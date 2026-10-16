import 'server-only';
import { hash, safeEqual } from './order.mjs';

export function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
export function appOrigin() {
  const url = new URL(required('APP_URL'));
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('APP_URL must use HTTPS.');
  return url.origin;
}
let cachedToken;
function endpoints() {
  const mode = required('PHONEPE_ENV');
  if (!['sandbox', 'production'].includes(mode)) throw new Error('PHONEPE_ENV must be sandbox or production.');
  return mode === 'production'
    ? { api: 'https://api.phonepe.com/apis/pg', auth: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token' }
    : { api: 'https://api-preprod.phonepe.com/apis/pg-sandbox', auth: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token' };
}
async function token() {
  if (cachedToken && cachedToken.expires_at * 1000 > Date.now() + 60000) return cachedToken.access_token;
  const response = await fetch(endpoints().auth, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: required('PHONEPE_CLIENT_ID'), client_secret: required('PHONEPE_CLIENT_SECRET'), client_version: required('PHONEPE_CLIENT_VERSION'), grant_type: 'client_credentials' }),
  });
  if (!response.ok) throw new Error(`PhonePe authorization failed (${response.status}).`);
  cachedToken = await response.json();
  if (!cachedToken.access_token) throw new Error('PhonePe did not return an access token.');
  return cachedToken.access_token;
}
async function request(path, body, retry = true) {
  const response = await fetch(endpoints().api + path, {
    method: body ? 'POST' : 'GET', cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `O-Bearer ${await token()}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401 && retry) { cachedToken = null; return request(path, body, false); }
  if (!response.ok) throw new Error(`PhonePe request failed (${response.status}).`);
  return response.json();
}
export function getPayment(id) {
  return request(`/checkout/v2/order/${encodeURIComponent(id)}/status?details=false`);
}
export async function createPayment(order) {
  const result = await request('/checkout/v2/pay', {
    merchantOrderId: order.id, amount: order.amount_paise, expireAfter: 1200,
    paymentFlow: { type: 'PG_CHECKOUT', merchantUrls: { redirectUrl: `${appOrigin()}/payment/${order.id}` } },
  });
  const url = new URL(result.redirectUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.phonepe.com') || !result.orderId) throw new Error('Invalid PhonePe checkout response.');
  return result;
}
export function validWebhook(authorization) {
  return safeEqual(authorization, hash(`${required('PHONEPE_WEBHOOK_USERNAME')}:${required('PHONEPE_WEBHOOK_PASSWORD')}`));
}
