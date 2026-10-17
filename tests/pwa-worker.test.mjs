import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function worker() {
  const handlers = {}, shown = [], opened = [];
  const self = { location: { origin: 'https://athidifoods.in' }, addEventListener: (name, handler) => { handlers[name] = handler; }, registration: { showNotification: async (title, options) => { shown.push({ title, ...options }); } }, clients: { matchAll: async () => [], openWindow: async url => { opened.push(url); } } };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), { self, URL });
  return { handlers, shown, opened };
}
test('push handles malformed payloads and prevents external notification destinations', async () => {
  const { handlers, shown } = worker();
  let pending;
  handlers.push({ data: { json: () => { throw new Error('not JSON'); } }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(shown[0].title, 'Athidi Foods');
  handlers.push({ data: { json: () => ({ title: 'Lunch update', url: 'https://outside.example' }) }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(shown[1].data.url, 'https://athidifoods.in/');
});
test('notification clicks open the intended local page and reject API/external URLs', async () => {
  const { handlers, opened } = worker();
  for (const destination of ['/dashboard/customer', 'javascript:alert(1)', '/api/payments']) {
    let pending;
    handlers.notificationclick({ notification: { close() {}, data: { url: destination } }, waitUntil: promise => { pending = promise; } });
    await pending;
  }
  assert.deepEqual(opened, ['https://athidifoods.in/dashboard/customer', 'https://athidifoods.in/', 'https://athidifoods.in/']);
});
test('non-navigation and API fetches are not intercepted', () => {
  const { handlers } = worker();
  let intercepted = false;
  for (const request of [{ method: 'POST', mode: 'navigate', url: 'https://athidifoods.in/api/payments' }, { method: 'GET', mode: 'cors', url: 'https://athidifoods.in/api/payments/demo' }, { method: 'GET', mode: 'navigate', url: 'https://athidifoods.in/api/payments/demo' }]) {
    handlers.fetch({ request, respondWith() { intercepted = true; } });
  }
  assert.equal(intercepted, false);
});
