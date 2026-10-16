'use client';

import { useEffect, useRef, useState } from 'react';
import { menu } from '../lib/menu';
import { DELIVERY_FEE, money, validateDelivery } from '../lib/checkout';
import LocationPicker from './LocationPicker';
import { validLocation } from '../lib/location';

const byPrice = (a, b) => a.price - b.price || a.name.localeCompare(b.name);
const riceItems = menu.filter(item => /rice|biryani/i.test(item.name)).sort(byPrice);
const mainItems = menu.filter(item => !/rice|biryani/i.test(item.name)).sort(byPrice);

function MenuGrid({ id, label, items, quantities, changeQuantity }) {
  return <section id={id} className="menu-grid" aria-label={label}>
    {items.map((item, index) => {
      const quantity = quantities[item.name] || 0;
      return <article key={item.name} className={`dish-card${quantity ? ' selected' : ''}`} data-dish={item.name}>
        <img className="dish-image" src={item.file} alt={item.name} loading={index < 3 ? 'eager' : 'lazy'} />
        <div className="dish-info">
          <div className="dish-title-row"><h3 className="dish-title">{item.name}</h3><span className="dish-price">{money(item.price)}</span></div>
          <div className="dish-controls">
            <span className="dish-hint">Per serving</span>
            <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
              <button className="qty-btn" type="button" aria-label={`Remove one ${item.name}`} disabled={!quantity} onClick={() => changeQuantity(item.name, -1)}>−</button>
              <span className="qty-number" aria-live="polite">{quantity}</span>
              <button className="qty-btn" type="button" aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item.name, 1)}>+</button>
            </div>
          </div>
        </div>
      </article>;
    })}
  </section>;
}

export default function OrderPage() {
  const [quantities, setQuantities] = useState({});
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const checkoutAttempt = useRef(null);
  const submitLock = useRef(false);
  const nameInput = useRef(null);
  const buyButton = useRef(null);
  const selected = menu.filter(item => quantities[item.name] > 0);
  const count = selected.reduce((sum, item) => sum + quantities[item.name], 0);
  const total = selected.reduce((sum, item) => sum + item.price * quantities[item.name], 0);
  const changeQuantity = (name, delta) => setQuantities(current => ({ ...current, [name]: Math.max(0, (current[name] || 0) + delta) }));
  function closeModal() { setOpen(false); buyButton.current?.focus(); }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    nameInput.current?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') { setOpen(false); buyButton.current?.focus(); }
      if (event.key === 'Tab') {
        const controls = [...document.querySelectorAll('.order-modal button, .order-modal input, .order-modal textarea, .order-modal a[href], .order-modal [tabindex="0"]')].filter(control => !control.disabled && control.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [open]);

  async function submitOrder(event) {
    event.preventDefault();
    if (submitLock.current) return;
    const fields = new FormData(event.currentTarget);
    const customer = Object.fromEntries(['name', 'address', 'pincode'].map(key => [key, String(fields.get(key) || '').trim()]));
    const error = validateDelivery(customer, count);
    if (error) { setMessage(error); return; }
    if (!validLocation(location)) { setMessage('Please select or confirm your delivery pin on the map.'); return; }
    customer.location = location;
    const items = selected.map(item => ({ name: item.name, quantity: quantities[item.name] }));
    const fingerprint = JSON.stringify({ customer, items });
    if (checkoutAttempt.current?.fingerprint !== fingerprint) {
      checkoutAttempt.current = { fingerprint, token: crypto.randomUUID() + crypto.randomUUID() };
    }
    submitLock.current = true;
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items, checkoutToken: checkoutAttempt.current.token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not start payment. Please try again.');
      window.location.assign(result.redirectUrl);
    } catch (error) {
      setMessage(error.message || 'Could not connect. Please try again.');
      submitLock.current = false;
      setSubmitting(false);
    }
  }

return <div className="order-page">

  <main className="order-container page-content">
    <section className="intro">
      <a className="back-link" href="/">? Back to home</a>
      <h1>Biryani &amp; Curries</h1>
      <span className="eyebrow">FRESHLY PREPARED • WEEKEND SPECIALS</span>
      <br />
      <div className="service-note"><span>📍</span><span>Currently delivering to pin codes <strong>518301</strong> and <strong>518302</strong>.</span></div>
    </section>
    <section className="menu-category" aria-labelledby="rice-heading">
      <div className="category-heading"><div><span className="category-kicker">RICE SPECIALS</span><h2 id="rice-heading">Rice &amp; Biryani</h2></div><p>All rice dishes, sorted by price</p></div>
      <MenuGrid id="rice-grid" label="Rice and biryani menu" items={riceItems} quantities={quantities} changeQuantity={changeQuantity} />
    </section>
    <div className="menu-divider" role="separator" aria-label="End of rice specials and start of main course"><span>MAIN COURSE</span></div>
    <section className="menu-category" aria-labelledby="main-course-heading">
      <div className="category-heading"><div><span className="category-kicker">CURRIES &amp; SIDES</span><h2 id="main-course-heading">Main Course</h2></div><p>Sorted from lowest to highest price</p></div>
      <MenuGrid id="main-course-grid" label="Main course menu" items={mainItems} quantities={quantities} changeQuantity={changeQuantity} />
    </section>
  </main>

  <aside className="cart-bar" aria-label="Your order summary">
    <div className="cart-inner">
      <div className="cart-summary"><span className="cart-icon">🛍️</span><div><strong id="cart-count">{count === 0 ? 'No items selected' : `${count} item${count === 1 ? '' : 's'} selected`}</strong><small id="cart-detail">{selected.length ? selected.map(item => `${item.name} × ${quantities[item.name]}`).join(' · ') : 'Your selected dishes will appear here'}</small></div></div>
      <div className="cart-total"><small>Item total</small><strong id="cart-total">{money(total)}</strong></div>
      <button className="primary-btn" id="buy-now" ref={buyButton} type="button" disabled={count === 0} onClick={() => { setMessage(''); setOpen(true); }}>Buy now <span>→</span></button>
    </div>
  </aside>

  <div className="modal-backdrop" id="order-modal" hidden={!open} onClick={event => { if (event.target === event.currentTarget) closeModal(); }}>
    <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="close-modal" id="close-modal" type="button" onClick={closeModal} aria-label="Close order form">×</button>
      <div className="modal-heading"><span className="modal-kicker">ALMOST THERE</span><h2 id="modal-title">Delivery details</h2><p>Confirm your details and pay securely with PhonePe. After payment, send your order on WhatsApp.</p></div>
      <div className="form-summary" id="form-summary"><strong>Your order · {count} item{count === 1 ? '' : 's'}</strong><div className="summary-items">{selected.map(item => <div key={item.name}>{item.name} × {quantities[item.name]} — {money(item.price * quantities[item.name])}</div>)}</div></div>
      <form id="checkout-form" noValidate onSubmit={submitOrder}>
        <label htmlFor="customer-name">Full name</label>
        <input id="customer-name" ref={nameInput} name="name" type="text" autoComplete="name" placeholder="Enter your full name" required />
        <label htmlFor="customer-address">Complete delivery address</label>
        <textarea id="customer-address" name="address" rows="3" autoComplete="street-address" placeholder="House / flat, street, area, city" required></textarea>
        {open && <LocationPicker value={location} onChange={setLocation} />}
        <label htmlFor="customer-pincode">PIN code</label>
        <input id="customer-pincode" onInput={event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 6); setMessage(''); }} name="pincode" type="text" inputMode="numeric" autoComplete="postal-code" maxLength="6" pattern="[0-9]{6}" placeholder="6-digit PIN code" required />
        <p className="form-message" id="form-message" role="status" aria-live="polite">{message}</p>
        <div className="bill">
          <div><span>Items total</span><strong id="bill-items">{money(total)}</strong></div>
          <div><span>Delivery fee</span><strong>₹30</strong></div>
          <div className="bill-grand"><span>Total payable</span><strong id="bill-total">{money(total + DELIVERY_FEE)}</strong></div>
        </div>
        <button className="primary-btn submit-order" type="submit" disabled={submitting}>{submitting ? 'Opening payment…' : 'Pay with PhonePe'} <span>↗</span></button>
        <p className="whatsapp-note">After successful payment, WhatsApp opens with your order ready. Tap Send to notify Athidi Foods.</p>
      </form>
    </section>
  </div>
    
</div>;
}
