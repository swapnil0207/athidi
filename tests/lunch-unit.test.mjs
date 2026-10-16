import test from 'node:test';
import assert from 'node:assert/strict';
import { createLunchDemo, balance, planFor, changeSchedule, lockPlan, fulfillPlan, weekDates } from '../lib/lunch-demo.mjs';

const today = '2026-10-19';
test('past delivery totals come from history without consuming more tokens', () => {
  const data = createLunchDemo(today);
  const before = JSON.stringify(data);
  const rows = planFor(data, '2026-10-16', today);
  assert.equal(rows.reduce((sum, row) => sum + row.quantity, 0), 3);
  assert.ok(rows.every(row => row.reason === 'Fulfilled'));
  assert.equal(JSON.stringify(data), before);
  assert.equal(planFor(data, '2026-10-18', today).reduce((sum, row) => sum + row.quantity, 0), 0);
});
test('impossible dates cannot create schedules or cooking lists', () => {
  const data = createLunchDemo(today);
  assert.throws(() => changeSchedule(data, 'customer.demo', '2026-11-31', '2026-11-31', 0, today), /within/);
  assert.throws(() => lockPlan(data, '2026-11-31', today), /delivery day/);
  assert.deepEqual(planFor(data, 'invalid', today), []);
});
test('week menu runs Monday to Friday, including when opened Sunday', () => {
  assert.deepEqual(weekDates('2026-10-25'), ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']);
});
test('one tiffin by default, pauses use zero and three means three total', () => {
  let data = createLunchDemo(today);
  assert.equal(balance(data.customers[0]), 20);
  assert.equal(planFor(data, today, today).reduce((sum, row) => sum + row.quantity, 0), 3);
  data = changeSchedule(data, 'customer.demo', today, today, 3, today);
  data = changeSchedule(data, 'ananya.demo', today, '2026-10-21', 0, today);
  assert.equal(planFor(data, today, today).reduce((sum, row) => sum + row.quantity, 0), 4);
  assert.equal(balance(data.customers[0]), 20);
  data = lockPlan(data, today, today);
  assert.throws(() => changeSchedule(data, 'customer.demo', today, today, 0, today), /locked/);
  data = fulfillPlan(data, today, today);
  assert.equal(balance(data.customers[0]), 17);
  assert.equal(balance(data.customers[1]), 8);
  assert.equal(balance(data.customers[2]), 1);
  assert.deepEqual(fulfillPlan(data, today, today), data);
});
test('insufficient tokens never partially fill an extra order or go negative', () => {
  const data = createLunchDemo(today);
  assert.throws(() => changeSchedule(data, 'ravi.demo', today, today, 3, today), /Not enough/);
  assert.equal(planFor(data, '2026-10-21', today).find(row => row.id === 'ravi.demo').quantity, 0);
  const locked = lockPlan(data, '2026-10-20', today);
  assert.equal(planFor(locked, today, today).find(row => row.id === 'ravi.demo').quantity, 1);
  assert.throws(() => fulfillPlan(locked, '2026-10-20', today), /Future/);
});
test('weekends, no menu, invalid ranges, fulfilled dates and pause conflicts', () => {
  let data = createLunchDemo(today);
  assert.equal(planFor(data, '2026-10-24', today).reduce((sum, row) => sum + row.quantity, 0), 0);
  assert.throws(() => changeSchedule(data, 'customer.demo', '2026-10-24', '2026-10-25', 0, today), /no Monday/);
  assert.throws(() => changeSchedule(data, 'customer.demo', '2026-10-18', today, 0, today), /within/);
  data = changeSchedule(data, 'customer.demo', today, today, 3, today);
  data = changeSchedule(data, 'customer.demo', today, today, 0, today);
  assert.equal(planFor(data, today, today)[0].quantity, 0);
  data = changeSchedule(data, 'customer.demo', today, today, 1, today);
  assert.equal(planFor(data, today, today)[0].quantity, 1);
  delete data.menus[today];
  assert.equal(planFor(data, today, today)[0].reason, 'Menu not published');
  assert.throws(() => lockPlan(data, today, today), /published/);
});
