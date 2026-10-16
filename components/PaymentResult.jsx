'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { money } from '../lib/checkout';

export default function PaymentResult({ orderId }) {
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('Checking your payment…');
  const [checking, setChecking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const opened = useRef(false);
  const check = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to check payment.');
      setResult(data);
      setMessage(data.status === 'COMPLETED' ? 'Payment successful! Send your order to Athidi Foods on WhatsApp.' : data.status === 'FAILED' ? 'Payment failed or was cancelled. You can return to the menu and try again.' : 'Your payment is still pending. Please wait before attempting another payment.');
      if (data.status === 'COMPLETED' && !opened.current) {
        opened.current = true;
        // Keep a visible link if the device blocks opening WhatsApp automatically.
        let alreadyOpened = false;
        try {
          alreadyOpened = sessionStorage.getItem(`whatsapp:${orderId}`) === 'opened';
          sessionStorage.setItem(`whatsapp:${orderId}`, 'opened');
        } catch { /* Storage may be unavailable in private browsing. */ }
        if (!alreadyOpened) window.location.assign(data.whatsappUrl);
      }
    } catch (error) {
      setMessage(error.message);
    } finally { setChecking(false); setAttempt(value => value + 1); }
  }, [orderId]);
  useEffect(() => { check(); }, [check]);
  useEffect(() => {
    if (!attempt || attempt >= 12 || result?.status === 'COMPLETED' || result?.status === 'FAILED') return;
    const timeout = setTimeout(check, 5000);
    return () => clearTimeout(timeout);
  }, [attempt, result, check]);

  return <div className="order-page"><main className="order-container intro payment-result">
    <a className="back-link" href="/">← Athidi Foods</a>
    <h1>{result?.status === 'COMPLETED' ? 'Thank you!' : 'Payment status'}</h1>
    <p role="status" aria-live="polite">{message}</p>
    <p>Order reference: <strong>{orderId}</strong></p>
    {result && <p>Total: <strong>{money(result.amount)}</strong></p>}
    {result?.status === 'COMPLETED' ? <>
      <a className="primary-btn" href={result.whatsappUrl}>Send order on WhatsApp ↗</a>
      <p>Payment is saved. The WhatsApp message is sent only when you tap Send.</p>
    </> : <>
      <button className="primary-btn" type="button" disabled={checking} onClick={check}>{checking ? 'Checking…' : 'Check payment again'}</button>
      {result?.status === 'FAILED' && <p><a className="back-link" href="/order">Return to menu</a></p>}
      <p>If payment was deducted but is not confirmed, do not pay again. Contact <a href="tel:+919618634908">96186 34908</a> with your order reference.</p>
    </>}
  </main></div>;
}
