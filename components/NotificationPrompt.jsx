'use client';

import { useEffect, useState } from 'react';
import { usePwa } from './PwaProvider';

const dismissalKey = 'athidi-notification-prompt-dismissed';

export default function NotificationPrompt() {
  const pwa = usePwa();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(dismissalKey) === 'true'); } catch { /* Keep the optional prompt usable. */ }
    setReady(true);
  }, []);

  if (!ready || dismissed || !pwa.installed || !pwa.supported || (!answered && pwa.permission !== 'default')) return null;

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(dismissalKey, 'true'); } catch { /* Dismiss for this visit even without storage. */ }
  }
  async function enable() {
    setBusy(true);
    try {
      const result = await pwa.enableNotifications();
      setAnswered(true);
      setNotice(result === 'granted' ? 'Notifications are enabled on this device.' : result === 'denied' ? 'Notifications are blocked. You can allow them in your browser or device settings.' : 'No permission changed. You can choose again or enable notifications later in settings.');
    } catch (error) { setNotice(error.message || 'Please try again.'); }
    finally { setBusy(false); }
  }

  return <section className="notification-prompt" aria-label="Notification permission">
    <div className="store-container notification-prompt-inner"><div><strong>{answered && pwa.permission === 'granted' ? 'You’re all set.' : 'Keep Athidi Foods close.'}</strong><p>Allow notifications on this device? The temporary evening announcements need the app to stay open.</p><p className="notification-prompt-status" role="status">{notice}</p></div>
      <div className="notification-prompt-actions">{pwa.permission === 'default' && <button type="button" disabled={busy || !pwa.registration} onClick={enable}>{busy ? 'Please wait…' : 'Enable notifications'}</button>}<a href="/app-settings">Notification settings</a><button type="button" className="notification-prompt-dismiss" onClick={dismiss}>{answered ? 'Close' : 'Not now'}</button></div>
    </div>
  </section>;
}
