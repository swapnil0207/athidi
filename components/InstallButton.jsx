'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePwa } from './PwaProvider';

export default function InstallButton() {
  const pwa = usePwa();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (pwa.installed) return null;

  async function install() {
    if (!pwa.installPrompt) { router.push('/app-settings'); return; }
    setBusy(true);
    try { await pwa.install(); }
    catch { router.push('/app-settings'); }
    finally { setBusy(false); }
  }

  return <button className="store-install" type="button" aria-label="Install Athidi Foods app" title="Install Athidi Foods app" disabled={busy} onClick={install}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 15v5h14v-5" /></svg>
  </button>;
}
