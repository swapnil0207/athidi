'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { demoShops, demoPassword, demoSessionKey, demoDataKey, createDemoData, statusLabels, formatMoney, currentMonth } from '../lib/shop-demo';

function TrackingForm({ order, onSave }) {
  const [link, setLink] = useState(order.tracking);
  const [message, setMessage] = useState('');
  function submit(event) {
    event.preventDefault();
    const value = link.trim();
    if (value) {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      } catch { setMessage('Enter a valid HTTPS tracking link.'); return; }
    }
    onSave(value);
    setMessage(value ? 'Tracking link saved in this demo.' : 'Tracking link removed.');
  }
  return <form className="partner-tracking" onSubmit={submit}>
    <label htmlFor={`tracking-${order.id}`}>Delivery tracking link</label>
    <div><input id={`tracking-${order.id}`} value={link} onChange={event => { setLink(event.target.value); setMessage(''); }} placeholder="https://…" type="text" inputMode="url" /><button type="submit" className="partner-button secondary">Save link</button></div>
    {order.tracking && <a href={order.tracking} target="_blank" rel="noopener noreferrer">Open saved tracking ↗</a>}
    <p role="status">{message}</p>
  </form>;
}

export default function ShopPortal({ view }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [shop, setShop] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [month, setMonth] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setMonth(currentMonth());
    if (view === 'login') { setReady(true); return; }
    try {
      const id = sessionStorage.getItem(demoSessionKey);
      const selectedShop = demoShops.find(item => item.id === id);
      if (!selectedShop) { router.replace('/dashboard/login'); return; }
      let saved;
      try { saved = JSON.parse(localStorage.getItem(demoDataKey(id))); } catch { /* Start a fresh demo if storage is unavailable. */ }
      const valid = saved?.version === 1 && Array.isArray(saved.products) && Array.isArray(saved.orders);
      setShop(selectedShop);
      setData(valid ? saved : createDemoData(selectedShop));
      setReady(true);
    } catch { setMessage('Browser storage is unavailable. Enable it to use this preview.'); setReady(true); }
  }, [view, router]);

  function save(next) {
    setData(next);
    try { localStorage.setItem(demoDataKey(shop.id), JSON.stringify(next)); }
    catch { setMessage('Changes are visible for this visit, but browser storage is unavailable.'); }
  }

  function login(event) {
    event.preventDefault();
    const selectedShop = demoShops.find(item => item.login === loginId.trim().toLowerCase());
    if (!selectedShop || password !== demoPassword) { setMessage('Use one of the demo IDs below and the demo password Preview123.'); return; }
    try { sessionStorage.setItem(demoSessionKey, selectedShop.id); router.push('/dashboard'); }
    catch { setMessage('Enable browser storage to open the preview.'); }
  }

  function logout() {
    sessionStorage.removeItem(demoSessionKey);
    setData(null); setShop(null); setReady(false);
    router.replace('/dashboard/login');
  }

  if (!ready) return <main className="store-container partner-loading" role="status">Opening shop workspace…</main>;

  if (view === 'login') return <main className="store-container partner-login">
    <section className="partner-welcome"><span className="store-eyebrow">ATHIDI PARTNERS</span><h1>Your shop.<br /><em>All in one place.</em></h1><p>Manage your menu, follow every order, and see how your month is shaping up.</p>
      <div className="partner-preview-note"><strong>Dashboard preview</strong><p>Sample orders and figures only. Demo login is not secure authentication. Real accounts will be issued manually when the backend is ready.</p></div>
      <div className="partner-shop-pills">{demoShops.map(item => <span key={item.id}>{item.name}</span>)}</div>
    </section>
    <section className="partner-login-card"><span className="store-eyebrow">WELCOME BACK</span><h2>Shop login</h2><p>Enter your assigned login ID and password.</p>
      <form onSubmit={login}><label htmlFor="shop-login">Login ID</label><input id="shop-login" autoComplete="username" value={loginId} onChange={event => setLoginId(event.target.value)} placeholder="e.g. biryani.demo" required />
        <label htmlFor="shop-password">Password</label><input id="shop-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
        <p className="partner-feedback" role="status">{message}</p><button className="partner-button" type="submit">Open demo dashboard <span aria-hidden="true">↗</span></button>
      </form>
      <details className="partner-demo-logins" open><summary>Try a demo shop</summary><p>Password for all demos: <code>Preview123</code></p>{demoShops.map(item => <button key={item.id} type="button" onClick={() => { setLoginId(item.login); setPassword(demoPassword); setMessage(''); }}><span>{item.name}</span><code>{item.login}</code></button>)}</details>
    </section>
  </main>;

  if (!data || !shop) return <main className="store-container partner-loading"><p role="status">{message || 'Please log in to preview your shop.'}</p><a href="/dashboard/login">Go to shop login →</a></main>;

  const orders = data.orders.filter(order => order.date.startsWith(month));
  const gross = orders.reduce((sum, order) => sum + order.total, 0);
  const charges = Math.round(gross * 0.05 * 100) / 100;
  const newOrders = data.orders.filter(order => order.status === 'received').length;
  const available = data.products.filter(product => product.available).length;
  const visibleOrders = orders.filter(order => filter === 'all' || order.status === filter);
  const products = data.products.filter(product => product.name.toLowerCase().includes(search.toLowerCase()));
  function updateOrder(id, change) { save({ ...data, orders: data.orders.map(order => order.id === id ? { ...order, ...change } : order) }); }
  function shopSettings(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const reopensAt = String(fields.get('reopensAt') || '');
    if (!data.open && reopensAt && new Date(reopensAt) <= new Date()) { setMessage('Choose a future reopening time.'); return; }
    save({ ...data, reopensAt, notice: String(fields.get('notice') || '').trim() });
    setMessage('Shop details saved in this demo. Reopening is a notice only; automatic reopening will come with the backend.');
  }

  return <main className="store-container partner-dashboard">
    <div className="partner-demo-strip"><span><strong>DEMO WORKSPACE</strong> Sample data · Changes stay in this browser · No live orders</span><button type="button" onClick={() => { save(createDemoData(shop)); setTab('overview'); setFilter('all'); setSearch(''); setMonth(currentMonth()); setMessage('This shop’s demo data has been reset.'); }}>Reset demo</button></div>
    <div className="partner-heading"><div><span className="store-eyebrow">YOUR SHOP WORKSPACE</span><h1>{shop.name}</h1><p>Good food. Smooth operations.</p></div><div className="partner-account"><span className={`partner-badge ${data.open ? 'available' : 'closed'}`}>{data.open ? 'Shop open' : 'Shop closed'}</span><button type="button" className="partner-button secondary" onClick={logout}>Log out</button></div></div>
    <div className="partner-workspace"><aside className="partner-sidebar"><nav aria-label="Dashboard sections">{[['overview', 'Overview', '◫'], ['orders', 'Orders', '▤'], ['products', 'Products', '▦'], ['shop', 'Shop settings', '◷']].map(([id, label, icon]) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setMessage(''); }}><span aria-hidden="true">{icon}</span>{label}{id === 'orders' && newOrders > 0 && <span className="partner-count">{newOrders}</span>}</button>)}</nav><div className="partner-sidebar-note"><strong>One shop. Your menu.</strong><p>This workspace shows only this demo shop. Log out to preview another shop.</p><small>{shop.login}</small></div></aside>
      <div className="partner-main"><p className="partner-feedback" role="status">{message}</p>
        {(tab === 'overview' || tab === 'orders') && <div className="partner-section-heading"><div><h2>{tab === 'overview' ? 'This month at a glance' : 'Your orders'}</h2><p>{tab === 'overview' ? 'A little clarity for your busy day.' : 'Keep every delivery moving.'}</p></div><label className="partner-month">Month<input aria-label="Report month" type="month" value={month} onChange={event => setMonth(event.target.value || currentMonth())} /></label></div>}
        {tab === 'overview' && <>
          <div className="partner-kpis"><article><span>Orders received</span><strong>{orders.length}</strong><small>In the selected month</small></article><article><span>Items sold · value</span><strong>{formatMoney(gross)}</strong><small>Sample paid item sales</small></article><article><span>Estimated charges</span><strong>{formatMoney(charges)}</strong><small>Illustrative 5% fee</small></article><article className="partner-kpi-highlight"><span>Estimated earnings</span><strong>{formatMoney(gross - charges)}</strong><small>Sales less sample charges</small></article></div>
          <p className="partner-finance-note">Demo estimate only. The 5% charge is a placeholder, not an agreed rate. Delivery, taxes, refunds and actual settlements are not included.</p>
          <div className="partner-overview-grid"><section className="partner-panel"><div className="partner-section-heading"><h3>Order activity</h3><button className="partner-text-button" onClick={() => setTab('orders')}>View orders ↗</button></div>{Object.entries(statusLabels).map(([id, label]) => <div className="partner-activity" key={id}><span>{label}</span><div><span style={{ width: `${orders.length ? orders.filter(order => order.status === id).length / orders.length * 100 : 0}%` }} /></div><strong>{orders.filter(order => order.status === id).length}</strong></div>)}</section>
            <section className="partner-panel partner-shop-summary"><img src={shop.image} alt="" /><h3>Your menu is looking good.</h3><p>{available} of {data.products.length} items available.</p><button className="partner-button secondary" onClick={() => setTab('products')}>Manage availability ↗</button></section></div>
          <section className="partner-panel partner-attention"><div><span className="store-eyebrow">NEEDS YOUR ATTENTION</span><h3>{newOrders ? `${newOrders} orders waiting to be started` : 'You’re all caught up.'}</h3><p>Sample orders across all dates. Live notifications will be added with the backend.</p></div><button className="partner-button" onClick={() => { setTab('orders'); setMonth(currentMonth()); setFilter('received'); }}>Review orders</button></section>
        </>}
        {tab === 'orders' && <>
          <label className="partner-order-filter">Order status<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All orders</option>{Object.entries(statusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <div className="partner-orders">{visibleOrders.length === 0 && <div className="partner-empty">No orders for this month and status.</div>}{visibleOrders.map(order => <article className="partner-panel partner-order" key={order.id}><div className="partner-order-top"><div><strong>#{order.id}</strong><p>{order.customer} · {order.date}</p></div><span className={`partner-badge ${order.status}`}>{statusLabels[order.status]}</span></div><p>{order.address}</p><ul>{order.items.map(item => <li key={item.name}><span>{item.quantity} × {item.name}</span><strong>{formatMoney(item.price * item.quantity)}</strong></li>)}</ul><div className="partner-order-total"><span>Paid item total <small>· demo</small></span><strong>{formatMoney(order.total)}</strong></div><label className="partner-status-control">Update order status<select aria-label={`Status for ${order.id}`} value={order.status} onChange={event => updateOrder(order.id, { status: event.target.value })}>{Object.entries(statusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><TrackingForm order={order} onSave={tracking => updateOrder(order.id, { tracking })} /></article>)}</div>
        </>}
        {tab === 'products' && <><div className="partner-section-heading"><div><h2>Your products</h2><p>{available} available · {data.products.length - available} out of stock</p></div><label className="partner-search">Search products<input type="search" placeholder="Find an item…" value={search} onChange={event => setSearch(event.target.value)} /></label></div><p className="partner-finance-note">Availability is a demo flag. It does not change the customer-facing menu yet.</p><div className="partner-products">{products.length === 0 && <p className="partner-empty">No products match your search.</p>}{products.map(product => <article key={product.id} className="partner-product"><img src={product.image} alt="" /><div><h3>{product.name}</h3><p>{formatMoney(product.price)}</p><span className={`partner-badge ${product.available ? 'available' : 'closed'}`}>{product.available ? 'Available' : 'Out of stock'}</span></div><button type="button" role="switch" aria-checked={product.available} aria-label={`Availability for ${product.name}`} className="partner-switch" onClick={() => save({ ...data, products: data.products.map(item => item.id === product.id ? { ...item, available: !item.available } : item) })}><span /></button></article>)}</div></>}
        {tab === 'shop' && <><div className="partner-section-heading"><div><h2>Shop settings</h2><p>Let customers know when you’re ready to serve.</p></div></div><section className="partner-panel"><div className="partner-shop-toggle"><div><h3>{data.open ? 'Your shop is open' : 'Your shop is closed'}</h3><p>{data.open ? 'Ready to receive orders.' : 'Taking a break. Set your expected reopening below.'}</p></div><button type="button" className="partner-switch" role="switch" aria-label="Shop open" aria-checked={data.open} onClick={() => { save({ ...data, open: !data.open }); setMessage('Shop status updated in this demo only.'); }}><span /></button></div><form className="partner-settings" onSubmit={shopSettings} key={shop.id + data.reopensAt + data.notice}><label htmlFor="shop-reopens">Expected reopening <small>· optional, your local time</small></label><input id="shop-reopens" name="reopensAt" type="datetime-local" defaultValue={data.reopensAt} /><label htmlFor="shop-notice">Message for customers</label><textarea id="shop-notice" name="notice" maxLength={200} rows={3} defaultValue={data.notice} placeholder="e.g. Closed for the evening. Back tomorrow at 10 AM." /><p className="partner-finance-note">This previews the notice only. It will not close the live storefront or reopen the shop automatically.</p><button type="submit" className="partner-button">Save shop details</button></form></section></>}
      </div>
    </div>
  </main>;
}
