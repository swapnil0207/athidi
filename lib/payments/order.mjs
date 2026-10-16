import { createHash, timingSafeEqual } from 'node:crypto';
import { menu } from '../menu.js';
import { DELIVERY_FEE, validateDelivery, money } from '../checkout.js';
import { normalizeLocation, validLocation, locationLink } from '../location.js';

export const hash = value => createHash('sha256').update(value).digest('hex');
export function safeEqual(left, right) {
  const a = Buffer.from(left || ''), b = Buffer.from(right || '');
  return a.length === b.length && timingSafeEqual(a, b);
}
export function normalizeOrder(body) {
  if (!body || typeof body !== 'object') throw new Error('Invalid order.');
  const customer = Object.fromEntries(['name', 'address', 'pincode'].map(key => [key,
    typeof body.customer?.[key] === 'string' ? body.customer[key].trim() : '',
  ]));
  if (customer.name.length > 120 || customer.address.length > 1000) throw new Error('Name or address is too long.');
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > menu.length) throw new Error('Please select at least one dish.');
  const seen = new Set();
  const items = body.items.map(entry => {
    const dish = menu.find(item => item.name === entry?.name);
    if (!dish || seen.has(dish.name) || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 50) throw new Error('Invalid dish or quantity (maximum 50 per dish).');
    seen.add(dish.name);
    return { name: dish.name, quantity: entry.quantity, unit_paise: dish.price * 100 };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const validation = validateDelivery(customer, items.length);
  if (validation) throw new Error(validation);
  customer.location = normalizeLocation(body.customer?.location);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_paise, 0);
  return { customer, items, subtotal_paise: subtotal, delivery_paise: DELIVERY_FEE * 100, amount_paise: subtotal + DELIVERY_FEE * 100 };
}
export function verifiedUpdate(order, payment) {
  if (!payment || payment.amount !== order.amount_paise || !payment.orderId || (order.provider_order_id && payment.orderId !== order.provider_order_id)) throw new Error('Payment does not match the saved order.');
  if (!['COMPLETED', 'FAILED', 'PENDING'].includes(payment.state)) throw new Error('Unknown payment state.');
  if (order.status === 'COMPLETED' || payment.state === 'PENDING') return null;
  return {
    status: payment.state,
    provider_order_id: payment.orderId,
    transaction_id: payment.paymentDetails?.find(item => item.state === 'COMPLETED')?.transactionId || null,
    ...(payment.state === 'COMPLETED' ? { paid_at: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  };
}
export function paidWhatsAppUrl(order) {
  if (order.status !== 'COMPLETED') throw new Error('Payment has not been verified.');
  const lines = [
    'Hello Athidi Foods! My weekend food order is paid.',
    `Order ID: ${order.id}`, 'Payment: SUCCESSFUL (PhonePe)',
    ...(order.transaction_id ? [`Transaction ID: ${order.transaction_id}`] : []), '',
    `Name: ${order.customer.name}`, `Complete address: ${order.customer.address}`, `PIN code: ${order.customer.pincode}`, '',
    ...(validLocation(order.customer.location) ? [`Delivery location: ${locationLink(order.customer.location)}`, ''] : []),
    'Order details:',
    ...order.items.map(item => `• ${item.name} × ${item.quantity} — ${money(item.unit_paise / 100)} each = ${money(item.quantity * item.unit_paise / 100)}`), '',
    `Items total: ${money(order.subtotal_paise / 100)}`, `Delivery fee: ${money(order.delivery_paise / 100)}`,
    `Total paid: ${money(order.amount_paise / 100)}`,
  ];
  return `https://wa.me/919741119072?text=${encodeURIComponent(lines.join('\n'))}`;
}
