import { NextResponse } from 'next/server';
import { validWebhook } from '../../../../lib/payments/phonepe';
import { getOrder, recordPayment } from '../../../../lib/payments/store';

export const runtime = 'nodejs';
export async function POST(request) {
  try {
    if (!validWebhook(request.headers.get('authorization'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const raw = await request.text();
    if (raw.length > 64000) return new Response(null, { status: 413 });
    let event;
    try { event = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
    if (!['checkout.order.completed', 'checkout.order.failed'].includes(event.event)) return NextResponse.json({ received: true });
    const id = event.payload?.merchantOrderId;
    if (!/^ATH_[a-f0-9]{32}$/.test(id || '')) return new Response(null, { status: 400 });
    const order = await getOrder(id);
    if (!order) return new Response(null, { status: 404 });
    await recordPayment(order, event.payload);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Unable to record payment.' }, { status: 503 });
  }
}
