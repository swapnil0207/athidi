'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { announcementPreferenceKey, showDueAnnouncements } from '../lib/announcements.mjs';

const PwaContext = createContext(null);
export const usePwa = () => useContext(PwaContext);

export default function PwaProvider({ children }) {
  const [registration, setRegistration] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [update, setUpdate] = useState(null);
  const [error, setError] = useState('');
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(true);

  useEffect(() => {
    let disposed = false;
    const standalone = window.matchMedia('(display-mode: standalone)');
    const syncInstalled = () => setInstalled(standalone.matches || navigator.standalone === true);
    const syncPermission = () => { if ('Notification' in window) setPermission(Notification.permission); };
    syncInstalled(); syncPermission();
    try { setAnnouncementsEnabled(localStorage.getItem(announcementPreferenceKey) !== 'false'); } catch { /* Report unavailable storage when scheduling. */ }
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    setSupported(window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator);
    const beforeInstall = event => { event.preventDefault(); setInstallPrompt(event); };
    const afterInstall = () => { setInstallPrompt(null); setInstalled(true); };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', afterInstall);
    window.addEventListener('focus', syncPermission);
    standalone.addEventListener('change', syncInstalled);
    if (window.isSecureContext && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(reg => {
        if (disposed) return;
        const activate = () => { if (reg.active) setRegistration(reg); setUpdate(reg.waiting); };
        const watch = () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => { if (!disposed) activate(); });
        };
        activate(); watch();
        reg.addEventListener('updatefound', watch);
        navigator.serviceWorker.ready.then(() => { if (!disposed) activate(); });
      }).catch(() => { if (!disposed) setError('App setup could not finish. Check your connection and reload to try again.'); });
    } else setError('Installation and notifications need HTTPS and a supported browser.');
    return () => {
      disposed = true;
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', afterInstall);
      window.removeEventListener('focus', syncPermission);
      standalone.removeEventListener('change', syncInstalled);
    };
  }, []);

  useEffect(() => {
    if (!registration || permission !== 'granted' || !announcementsEnabled) return;
    let pending = false;
    async function check() {
      if (pending || Notification.permission !== 'granted') return;
      pending = true;
      try {
        const show = () => showDueAnnouncements({ registration, storage: localStorage });
        if (navigator.locks?.request) await navigator.locks.request('athidi-announcements', show);
        else await show();
      } catch { setError('A scheduled notification could not be shown. Check browser storage and notification permissions.'); }
      finally { pending = false; }
    }
    check();
    const timer = window.setInterval(check, 10000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, [registration, permission, announcementsEnabled]);

  function toggleAnnouncements(enabled) {
    try { localStorage.setItem(announcementPreferenceKey, String(enabled)); setAnnouncementsEnabled(enabled); }
    catch { setError('Could not save your announcement preference. Enable browser storage and try again.'); }
  }

  async function install() {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    return choice.outcome === 'accepted';
  }
  async function enableNotifications() {
    if (!supported || !registration) throw new Error('Notification setup is not ready. Please wait or reload.');
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }
  async function testNotification() {
    if (!registration || Notification.permission !== 'granted') throw new Error('Enable notifications first.');
    await registration.showNotification('Athidi Foods is ready', { body: 'This is a test notification. Automatic order alerts are not connected yet.', icon: '/assets/favicon/athidi-pwa-192.png', tag: 'athidi-test', data: { url: '/app-settings' } });
  }
  function applyUpdate() {
    if (!update) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    update.postMessage({ type: 'ACTIVATE_UPDATE' });
  }
  return <PwaContext.Provider value={{ registration, installPrompt, installed, ios, supported, permission, error, update, install, enableNotifications, testNotification, applyUpdate, announcementsEnabled, toggleAnnouncements }}>{children}</PwaContext.Provider>;
}
