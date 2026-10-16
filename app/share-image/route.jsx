import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function GET() {
  const logo = await readFile(path.join(process.cwd(), 'public/assets/Athidi Foods Logo with Steaming Bowl.png'));
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fffdf5', borderBottom: '24px solid #e6c96e', color: '#083e2e' }}>
    <img src={`data:image/png;base64,${logo.toString('base64')}`} width={670} height={261} alt="Athidi Foods" />
    <div style={{ display: 'flex', fontSize: 40, marginTop: 26, fontWeight: 700 }}>Home-style food. Made in Adoni.</div>
    <div style={{ display: 'flex', fontSize: 27, marginTop: 20 }}>Pure Veg · Lunch Subscriptions · Biryani & Curries</div>
    <div style={{ display: 'flex', fontSize: 23, marginTop: 28, color: '#55604e' }}>athidifoods.in · 96186 34908</div>
  </div>, { width: 1200, height: 630 });
}
