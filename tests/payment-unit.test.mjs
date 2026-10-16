import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrder, verifiedUpdate, paidWhatsAppUrl, hash, safeEqual } from '../lib/payments/order.mjs';

const input = { customer: { name: ' Test ', address: 'Adoni', pincode: '518301', location: { latitude: 15.62788, longitude: 77.27495 } }, items: [{ name: 'Curd Rice', quantity: 2, price: 1 }], amount: 1 };
test('prices and delivery fee come from server menu, never from the browser', () => {
  const order = normalizeOrder(input);
  assert.equal(order.amount_paise, 15000);
  assert.equal(order.customer.name, 'Test');
});
test('rejects invalid quantities, unknown dishes, duplicate dishes and unsupported delivery', () => {
  for (const quantity of [0, -1, 1.5, 51, '2']) assert.throws(() => normalizeOrder({ ...input, items: [{ name: 'Curd Rice', quantity }] }));
  assert.throws(() => normalizeOrder({ ...input, items: [{ name: 'Fake', quantity: 1 }] }));
  assert.throws(() => normalizeOrder({ ...input, items: [...input.items, ...input.items] }));
  assert.throws(() => normalizeOrder({ ...input, customer: { ...input.customer, pincode: '123456' } }));
});
test('only matching provider orders and exact amounts can confirm payment', () => {
  const order = { ...normalizeOrder(input), status: 'PENDING', provider_order_id: 'OMO1' };
  assert.throws(() => verifiedUpdate(order, { state: 'COMPLETED', orderId: 'OMO1', amount: 1 }));
  assert.throws(() => verifiedUpdate(order, { state: 'COMPLETED', orderId: 'OTHER', amount: order.amount_paise }));
  const payment = { state: 'COMPLETED', orderId: 'OMO1', amount: order.amount_paise };
  assert.equal(verifiedUpdate(order, payment).status, 'COMPLETED');
  assert.equal(verifiedUpdate({ ...order, status: 'COMPLETED' }, { ...payment, state: 'FAILED' }), null);
  assert.equal(verifiedUpdate(order, { ...payment, state: 'PENDING' }), null);
});
test('WhatsApp is available only for paid orders and never asks for another payment', () => {
  const order = { ...normalizeOrder(input), id: 'ATH_test', status: 'PENDING' };
  assert.throws(() => paidWhatsAppUrl(order));
  const url = new URL(paidWhatsAppUrl({ ...order, status: 'COMPLETED' }));
  assert.equal(url.pathname, '/919741119072');
  assert.match(url.searchParams.get('text'), /Total paid: ₹150/);
  assert.doesNotMatch(url.searchParams.get('text'), /upi:\/\//);
  assert.match(url.searchParams.get('text'), /https:\/\/www.google.com\/maps\?q=15.62788,77.27495/);
});

test('delivery pin is validated and preserved in the saved customer details', () => {
  assert.deepEqual(normalizeOrder(input).customer.location, input.customer.location);
  for (const location of [null, {}, { latitude: '15', longitude: 77 }, { latitude: 91, longitude: 77 }, { latitude: 15, longitude: 181 }, { latitude: NaN, longitude: 77 }, { latitude: 15, longitude: Infinity }]) {
    assert.throws(() => normalizeOrder({ ...input, customer: { ...input.customer, location } }));
  }
  // Paid orders created before map support still produce their address message.
  const oldOrder = { ...normalizeOrder(input), id: 'ATH_old', status: 'COMPLETED' };
  delete oldOrder.customer.location;
  assert.doesNotThrow(() => paidWhatsAppUrl(oldOrder));
});
test('credential hash comparison rejects mismatches', () => {
  assert.equal(safeEqual(hash('user:password'), hash('user:password')), true);
  assert.equal(safeEqual('invalid', hash('user:password')), false);
});
