import test from 'node:test';
import assert from 'node:assert/strict';
import { announcements, announcementPreferenceKey, showDueAnnouncements } from '../lib/announcements.mjs';

function device() {
  const values = new Map(), shown = [];
  return { storage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }, registration: { showNotification: async title => { shown.push(title); } }, shown };
}
test('the four India-time announcements fire once each and do not replay', async () => {
  const context = device();
  assert.equal(new Date(announcements[0].at).toISOString(), '2026-10-17T15:45:00.000Z');
  for (const item of announcements) {
    await showDueAnnouncements({ ...context, now: Date.parse(item.at) - 1 });
    await showDueAnnouncements({ ...context, now: Date.parse(item.at) });
    await showDueAnnouncements({ ...context, now: Date.parse(item.at) + 10000 });
  }
  assert.deepEqual(context.shown, announcements.map(item => item.title));
});
test('disabled, missed and expired announcements do not notify', async () => {
  const context = device();
  context.storage.setItem(announcementPreferenceKey, 'false');
  await showDueAnnouncements({ ...context, now: Date.parse(announcements[0].at) });
  context.storage.setItem(announcementPreferenceKey, 'true');
  await showDueAnnouncements({ ...context, now: Date.parse(announcements[0].at) + 60000 });
  await showDueAnnouncements({ ...context, now: Date.parse('2026-10-19T21:15:00+05:30') });
  assert.equal(context.shown.length, 0);
});
test('a failed display can retry within the due minute', async () => {
  const context = device(), now = Date.parse(announcements[0].at);
  await assert.rejects(showDueAnnouncements({ ...context, now, registration: { showNotification: async () => { throw new Error('failure'); } } }));
  await showDueAnnouncements({ ...context, now: now + 10000 });
  assert.equal(context.shown.length, 1);
});
