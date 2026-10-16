import { NextResponse } from 'next/server';
import { database, getOrder } from '../../../lib/payments/store';
import { appOrigin, createPayment, required } from '../../../lib/payments/phonepe';
import { hash, normalizeOrder } from '../../../lib/payments/order.mjs';

export const runtime = 'nodejs';
export async function POST(request) {
  try {
    if (request.headers.get('origin') !== appOrigin()) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    for (const name of ['PHONEPE_CLIENT_ID', 'PHONEPE_CLIENT_SECRET', 'PHONEPE_CLIENT_VERSION', 'PHONEPE_ENV', 'SUPABASE_SERVICE_ROLE_KEY']) required(name);
    const text = await request.text();
    if (text.length > 12000) return NextResponse.json({ error: 'Order is too large.' }, { status: 413 });
    let body, normalized;
    try {
      body = JSON.parse(text);
      if (!/^[a-f0-9-]{72}$/.test(body.checkoutToken || '')) throw new Error('Invalid checkout token.');
      normalized = normalizeOrder(body);
    } catch (error) { return NextResponse.json({ error: error.message || 'Invalid order.' }, { status: 400 }); }
    const accessHash = hash(body.checkoutToken);
    const id = `ATH_${accessHash.slice(0, 32)}`;
    const requestHash = hash(JSON.stringify(normalized));
    const { error } = await database().from('payment_orders').insert({ id, access_hash: accessHash, request_hash: requestHash, ...normalized });
    if (error && error.code !== '23505') throw new Error('Unable to save order. Check the database migration.');
    const order = await getOrder(id);
    if (!order || order.request_hash !== requestHash) return NextResponse.json({ error: 'This checkout has different details. Please start a new order.' }, { status: 409 });
    const response = NextResponse.json({ redirectUrl: order.status === 'PENDING' && order.checkout_url ? order.checkout_url : `${appOrigin()}/payment/${id}` });
    response.cookies.set(`athidi_${id}`, body.checkoutToken, { httpOnly: true, secure: appOrigin().startsWith('https:'), sameSite: 'lax', path: '/api/payments', maxAge: 604800 });
    response.headers.set('Cache-Control', 'no-store');
    if (error) return response; // Never create a second payment for a retried request.
    try {
      const payment = await createPayment(order);
      const { error: saveError } = await database().from('payment_orders').update({ checkout_url: payment.redirectUrl, provider_order_id: payment.orderId }).eq('id', id);
      if (saveError) throw new Error('Unable to save checkout URL.');
      const redirect = NextResponse.json({ redirectUrl: payment.redirectUrl });
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      redirect.headers.set('Cache-Control', 'no-store');
      return redirect;
    } catch {
      // A timed-out initiation may still have charged: send the customer to verification.
      return response;
    }
  } catch (error) {
    console.error('Payment setup error:', error.message);
    return NextResponse.json({ error: 'Payment is currently unavailable. Please try again later.' }, { status: 503 });
  }
}
