import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { required } from './phonepe';
import { verifiedUpdate } from './order.mjs';

export function database() {
  return createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function getOrder(id) {
  const { data, error } = await database().from('payment_orders').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('Unable to load order.');
  return data;
}
export async function recordPayment(order, payment) {
  const update = verifiedUpdate(order, payment);
  if (update) {
    const { error } = await database().from('payment_orders').update(update).eq('id', order.id).neq('status', 'COMPLETED');
    if (error) throw new Error('Unable to save payment status.');
  }
  return getOrder(order.id);
}
