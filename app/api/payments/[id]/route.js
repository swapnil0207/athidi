import { NextResponse } from 'next/server';
import { getOrder, recordPayment } from '../../../../lib/payments/store';
import { getPayment } from '../../../../lib/payments/phonepe';
import { hash, safeEqual, paidWhatsAppUrl } from '../../../../lib/payments/order.mjs';

export const runtime = 'nodejs';
export async function GET(request, { params }) {
  const { id } = await params;
  const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!/^ATH_[a-f0-9]{32}$/.test(id)) return reply({ error: 'Order not found.' }, 404);
  const token = request.cookies.get(`athidi_${id}`)?.value;
  if (!token) return reply({ error: 'Open this payment result in the browser where you placed the order.' }, 403);
  try {
    let order = await getOrder(id);
    if (!order || !safeEqual(hash(token), order.access_hash)) return reply({ error: 'Order not found.' }, 404);
    if (order.status !== 'COMPLETED') order = await recordPayment(order, await getPayment(id));
    return reply({ id, status: order.status, amount: order.amount_paise / 100,
      ...(order.status === 'COMPLETED' ? { whatsappUrl: paidWhatsAppUrl(order) } : {}),
    });
  } catch {
    return reply({ error: 'We could not verify payment yet. Please check again; do not pay again until the status is confirmed.' }, 503);
  }
}
