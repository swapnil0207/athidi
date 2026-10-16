export const LUNCH_KEY = 'athidi-lunch-preview-v1';
export const LUNCH_SESSION = 'athidi-lunch-session-v1';
export const presets = ['Vegetable rice, dal, curry & 2 phulkas', 'Lemon rice, sambar, beans curry & 2 phulkas', 'Tomato rice, dal, potato curry & 2 phulkas', 'Jeera rice, rajma, vegetable curry & 2 phulkas', 'Vegetable pulao, dal, curd & 2 phulkas'];
export function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function validDay(key) { return /^\d{4}-\d{2}-\d{2}$/.test(key) && dayKey(new Date(`${key}T12:00:00`)) === key; }
export function addDays(key, count) { const date = new Date(`${key}T12:00:00`); date.setDate(date.getDate() + count); return dayKey(date); }
export function weekday(key) { return new Date(`${key}T12:00:00`).getDay(); }
export function serviceDay(key) { return weekday(key) > 0 && weekday(key) < 6; }
export function weekDates(key) { const start = addDays(key, -(weekday(key) + 6) % 7); return Array.from({ length: 5 }, (_, i) => addDays(start, i)); }
export function balance(customer) { return customer.credits - customer.deliveries.reduce((sum, delivery) => sum + delivery.quantity, 0); }
export function createLunchDemo(today = dayKey()) {
  const customers = [['customer.demo', 'Demo customer', 6], ['ananya.demo', 'Ananya · demo', 18], ['ravi.demo', 'Ravi · demo', 24]].map(([id, name, used]) => {
    const deliveries = []; let date = addDays(today, -1);
    while (deliveries.length < used) { if (serviceDay(date)) deliveries.push({ date, quantity: 1, menu: presets[(weekday(date) - 1) % 5] }); date = addDays(date, -1); }
    return { id, name, credits: 26, deliveries, choices: {}, reviews: {} };
  });
  const menus = {};
  for (let i = 0; i < 56; i++) { const date = addDays(today, i); if (serviceDay(date)) menus[date] = { preset: presets[weekday(date) - 1], note: '' }; }
  return { version: 1, customers, menus, locks: {} };
}

// Allocate earlier scheduled lunches first. Locked plans reserve their full quantity.
export function planFor(data, target, today = dayKey()) {
  if (!validDay(target)) return [];
  if (data.locks[target]) return data.locks[target].rows;
  if (target < today) return data.customers.map(customer => {
    const delivery = customer.deliveries.find(item => item.date === target);
    return { id: customer.id, name: customer.name, requested: delivery?.quantity ?? 0, quantity: delivery?.quantity ?? 0, reason: delivery ? 'Fulfilled' : 'No fulfilled delivery' };
  });
  const budgets = Object.fromEntries(data.customers.map(customer => [customer.id, balance(customer) - Object.values(data.locks).reduce((sum, lock) => sum + lock.rows.filter(row => row.id === customer.id && row.quantity && !customer.deliveries.some(item => item.date === lock.date)).reduce((total, row) => total + row.quantity, 0), 0)]));
  let rows = [];
  for (let date = today; date <= target; date = addDays(date, 1)) {
    if (data.locks[date]) continue;
    rows = data.customers.map(customer => {
      const delivered = customer.deliveries.find(item => item.date === date);
      const requested = serviceDay(date) ? (customer.choices[date] ?? 1) : 0;
      let reason = !serviceDay(date) ? 'Non-delivery day' : !requested ? 'Paused' : !data.menus[date] ? 'Menu not published' : 'Scheduled';
      let quantity = reason === 'Scheduled' ? requested : 0;
      if (quantity > budgets[customer.id]) { quantity = 0; reason = 'Insufficient tokens'; }
      if (delivered) { quantity = delivered.quantity; reason = 'Fulfilled'; }
      else budgets[customer.id] -= quantity;
      return { id: customer.id, name: customer.name, requested, quantity, reason };
    });
  }
  return rows;
}

export function changeSchedule(data, id, from, to, quantity, today = dayKey()) {
  if (!validDay(from) || !validDay(to) || from < today || to < from || to > addDays(today, 55)) throw new Error('Choose dates within the next 56 days.');
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 26) throw new Error('Choose between 0 and 26 tiffins.');
  const next = structuredClone(data), customer = next.customers.find(item => item.id === id);
  if (!customer) throw new Error('Customer not found.');
  let changed = 0;
  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (!serviceDay(date)) continue;
    if (next.locks[date] || customer.deliveries.some(item => item.date === date)) throw new Error('This period includes a locked or fulfilled day. Contact the kitchen for changes.');
    customer.choices[date] = quantity; changed++;
  }
  if (!changed) throw new Error('This period has no Monday–Friday delivery days.');
  if (quantity > 1 && planFor(next, from, today).find(item => item.id === id)?.quantity !== quantity) throw new Error('Not enough unreserved tokens for this request, or no menu is published. Choose an earlier day or renew your subscription.');
  return next;
}

export function lockPlan(data, date, today = dayKey()) {
  if (!validDay(date) || date < today || date > addDays(today, 55) || !serviceDay(date) || !data.menus[date]) throw new Error('Choose a delivery day with a published menu within the next 56 days.');
  if (data.locks[date]) return data;
  return { ...data, locks: { ...data.locks, [date]: { date, rows: planFor(data, date, today), menu: { ...data.menus[date] } } } };
}

export function fulfillPlan(data, date, today = dayKey()) {
  if (date > today) throw new Error('Future deliveries cannot be marked fulfilled.');
  const lock = data.locks[date];
  if (!lock) throw new Error('Lock the cooking list before fulfilling deliveries.');
  const next = structuredClone(data);
  for (const row of lock.rows) {
    if (!row.quantity) continue;
    const customer = next.customers.find(item => item.id === row.id);
    if (customer.deliveries.some(item => item.date === date)) continue;
    if (balance(customer) < row.quantity) throw new Error('Insufficient tokens. Review this cooking list.');
    customer.deliveries.unshift({ date, quantity: row.quantity, menu: [lock.menu.preset, lock.menu.note].filter(Boolean).join(' · ') });
  }
  return next;
}
