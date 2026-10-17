// Fixed India-time dates. This schedule intentionally ends on 18 October 2026.
export const announcementPreferenceKey = 'athidi-announcements-enabled';
export const announcements = [
  { id: '2026-10-17-2115', at: '2026-10-17T21:15:00+05:30', title: 'Shree Ganeshaya Namaha' },
  { id: '2026-10-17-2130', at: '2026-10-17T21:30:00+05:30', title: 'we are building something new stay tune' },
  { id: '2026-10-18-2115', at: '2026-10-18T21:15:00+05:30', title: 'Fresh ideas are cooking at Athidi Foods.' },
  { id: '2026-10-18-2130', at: '2026-10-18T21:30:00+05:30', title: 'Something delicious is on the way. Stay tuned!' },
];
export const announcementLabel = value => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value));

export async function showDueAnnouncements({ registration, storage, now = Date.now() }) {
  if (storage.getItem(announcementPreferenceKey) === 'false') return;
  for (const announcement of announcements) {
    const elapsed = now - Date.parse(announcement.at);
    if (elapsed < 0 || elapsed >= 60000) continue; // Skip missed times, never replay days later.
    const key = `athidi-announcement-shown-${announcement.id}`;
    if (storage.getItem(key)) continue;
    storage.setItem(key, 'true');
    try {
      await registration.showNotification(announcement.title, { body: 'Athidi Foods · Adoni', icon: '/assets/favicon/athidi-pwa-192.png', tag: `athidi-${announcement.id}`, data: { url: '/' } });
    } catch (error) { storage.removeItem(key); throw error; }
  }
}
