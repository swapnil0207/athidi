'use client';

import { useState } from 'react';
import { usePwa } from './PwaProvider';
import { announcements, announcementLabel } from '../lib/announcements.mjs';

export default function AppSettings() {
  const pwa = usePwa();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(action) {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message || 'Please try again.'); } finally { setBusy(false); }
  }
  return <main className="store-container app-settings"><a className="store-back" href="/">← Back to home</a><div className="store-intro"><span className="store-eyebrow">ATHIDI, A TAP AWAY</span><h1>A little closer<br /><em>to your home screen.</em></h1><p>Install the app and manage notifications on this device.</p></div>
    <div className="app-settings-grid"><section><span className="store-eyebrow">01 · INSTALL</span><h2>Make room for good food.</h2><p>Add Athidi Foods to your home screen for quick access to menus and your lunch subscription.</p>
      {pwa.installed ? <strong className="app-state">You’re using the installed app.</strong> : pwa.installPrompt ? <button disabled={busy} onClick={() => act(async () => { const accepted = await pwa.install(); setMessage(accepted ? 'Installation requested. Follow your browser’s instructions.' : 'Installation dismissed. You can try again from your browser menu.'); })}>Install Athidi Foods ↗</button> : <div className="app-install-help"><strong>{pwa.ios ? 'On iPhone or iPad' : 'Install from your browser'}</strong><p>{pwa.ios ? 'Open this site in Safari. Tap Share, then Add to Home Screen. Open Athidi Foods from the new icon.' : 'On Android, open the browser menu and choose Install app or Add to Home screen. On desktop, look for the install icon in the address bar.'}</p><small>If it’s already installed, open it from your home screen. Installation options depend on your browser.</small></div>}
    </section><section><span className="store-eyebrow">02 · NOTIFICATIONS</span><h2>Stay in the loop.</h2><p>Choose whether this device can show Athidi Foods notifications.</p>
      {pwa.ios && !pwa.installed ? <p className="app-install-help">On iPhone or iPad, install the app first, then open it from the home screen to enable notifications. Requires iOS/iPadOS 16.4 or later.</p> : !pwa.supported ? <p className="app-install-help">Notifications aren’t available in this browser. Try a supported browser over HTTPS.</p> : pwa.permission === 'denied' ? <p className="app-install-help">Notifications are blocked. Change permission in your browser’s site settings or your device’s notification settings, then return here.</p> : pwa.permission === 'granted' ? <><strong className="app-state">Notifications allowed on this device.</strong><button disabled={busy || !pwa.registration} onClick={() => act(async () => { await pwa.testNotification(); setMessage('Test notification sent to this device. If it is hidden, check your device’s notification or Focus settings.'); })}>Send test notification</button><p className="app-settings-note">To turn notifications off, use your browser or device notification settings.</p></> : <button disabled={busy || !pwa.registration} onClick={() => act(async () => { const permission = await pwa.enableNotifications(); setMessage(permission === 'granted' ? 'Permission enabled. You can send a test notification now.' : permission === 'denied' ? 'Notifications were blocked. You can change this in your device settings.' : 'No permission granted. You can choose again later.'); })}>Enable notifications</button>}
      <p className="app-settings-note">Test notifications work now. Automatic order updates and lunch reminders will be available after the live account and order system is connected.</p>
    </section></div>
    <section className="app-announcements"><span className="store-eyebrow">17–18 OCTOBER 2026 · INDIA TIME</span><h2>Two evenings. A little news.</h2><p>Allow notifications and keep this app open around these times. Closed apps and sleeping phones cannot reliably show these browser-timed messages. Missed messages are skipped after one minute.</p><label className="app-announcement-toggle"><input type="checkbox" checked={pwa.announcementsEnabled} onChange={event => pwa.toggleAnnouncements(event.target.checked)} /> Allow these four announcements on this device</label><ul>{announcements.map(item => <li key={item.id}><time dateTime={item.at}>{announcementLabel(item.at)} IST</time><span>{item.title}</span></li>)}</ul><p className="app-settings-note">This is a temporary, database-free schedule for every opted-in device. Automatic delivery with the app closed requires a push backend.</p></section>
    {pwa.error && <p role="alert" className="app-settings-message">{pwa.error}</p>}
    <p role="status" className="app-settings-message">{message}</p>
    {pwa.update && <section className="app-update"><div><h2>A fresh version is ready.</h2><p>Finish any order before refreshing the app.</p></div><button onClick={pwa.applyUpdate}>Update & refresh</button></section>}
  </main>;
}
