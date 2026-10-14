(() => {
  const menu = window.ATHIDI_MENU || [];
  const quantities = new Map(menu.map(item => [item.name, 0]));
  const $ = id => document.getElementById(id);
  const money = value => `₹${value.toLocaleString('en-IN')}`;
  const itemTotal = () => menu.reduce((sum, item) => sum + item.price * (quantities.get(item.name) || 0), 0);
  const itemCount = () => [...quantities.values()].reduce((sum, qty) => sum + qty, 0);
  const selectedItems = () => menu.filter(item => (quantities.get(item.name) || 0) > 0);
  const escapeText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function renderMenu() {
    const riceItems = menu.filter(item => /rice|biryani/i.test(item.name)).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    const mainItems = menu.filter(item => !/rice|biryani/i.test(item.name)).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    const cardMarkup = (items) => items.map((item, index) => `
      <article class="dish-card" data-dish="${escapeText(item.name)}">
        <img class="dish-image" src="${item.file}" alt="${escapeText(item.name)}" loading="${index < 3 ? 'eager' : 'lazy'}">
        <div class="dish-info">
          <div class="dish-title-row"><h3 class="dish-title">${escapeText(item.name)}</h3><span class="dish-price">${money(item.price)}</span></div>
          <div class="dish-controls">
            <span class="dish-hint">Per serving</span>
            <div class="quantity-control" aria-label="Quantity for ${escapeText(item.name)}">
              <button class="qty-btn" type="button" data-action="minus" data-name="${escapeText(item.name)}" aria-label="Remove one ${escapeText(item.name)}" disabled>−</button>
              <span class="qty-number" aria-live="polite">0</span>
              <button class="qty-btn" type="button" data-action="plus" data-name="${escapeText(item.name)}" aria-label="Add one ${escapeText(item.name)}">+</button>
            </div>
          </div>
        </div>
      </article>`).join('');
    $('rice-grid').innerHTML = cardMarkup(riceItems);
    $('main-course-grid').innerHTML = cardMarkup(mainItems);
    $('dish-count').textContent = `${menu.length} dishes`;
  }

  function renderCart() {
    const count = itemCount();
    const selected = selectedItems();
    $('cart-count').textContent = count === 0 ? 'No items selected' : `${count} item${count === 1 ? '' : 's'} selected`;
    $('cart-detail').textContent = selected.length ? selected.map(item => `${item.name} × ${quantities.get(item.name)}`).join(' · ') : 'Your selected dishes will appear here';
    $('cart-total').textContent = money(itemTotal());
    $('buy-now').disabled = count === 0;
    document.querySelectorAll('.dish-card').forEach(card => {
      const name = card.dataset.dish;
      const qty = quantities.get(name) || 0;
      card.classList.toggle('selected', qty > 0);
      card.querySelector('.qty-number').textContent = qty;
      card.querySelector('[data-action="minus"]').disabled = qty === 0;
    });
  }

  function renderBill() {
    const selected = selectedItems();
    const total = itemTotal();
    $('form-summary').innerHTML = `<strong>Your order · ${itemCount()} item${itemCount() === 1 ? '' : 's'}</strong><div class="summary-items">${selected.map(item => `${escapeText(item.name)} × ${quantities.get(item.name)} — ${money(item.price * quantities.get(item.name))}`).join('<br>')}</div>`;
    $('bill-items').textContent = money(total);
    $('bill-total').textContent = money(total + 30);
  }

  document.querySelector('.page-content').addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const name = button.dataset.name;
    const current = quantities.get(name) || 0;
    quantities.set(name, button.dataset.action === 'plus' ? current + 1 : Math.max(0, current - 1));
    renderCart();
  });

  function openModal() {
    if (itemCount() === 0) return;
    renderBill();
    $('form-message').textContent = '';
    $('form-message').className = 'form-message';
    $('order-modal').hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('customer-name').focus(), 50);
  }
  function closeModal() {
    $('order-modal').hidden = true;
    document.body.style.overflow = '';
    $('buy-now').focus();
  }
  $('buy-now').addEventListener('click', openModal);
  $('close-modal').addEventListener('click', closeModal);
  $('order-modal').addEventListener('click', event => { if (event.target === $('order-modal')) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('order-modal').hidden) closeModal(); });
  $('customer-pincode').addEventListener('input', () => {
    $('customer-pincode').value = $('customer-pincode').value.replace(/\D/g, '').slice(0, 6);
    $('form-message').textContent = '';
    $('form-message').className = 'form-message';
  });

  $('checkout-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('customer-name').value.trim();
    const address = $('customer-address').value.trim();
    const pincode = $('customer-pincode').value.trim();
    const message = $('form-message');
    if (!name || !address || !/^\d{6}$/.test(pincode)) {
      message.className = 'form-message';
      message.textContent = 'Please enter your name, complete address, and a valid 6-digit PIN code.';
      return;
    }
    if (!['518301', '518302'].includes(pincode)) {
      message.className = 'form-message';
      message.textContent = 'Sorry, we are currently not serving your area. Please check back as we expand delivery.';
      return;
    }
    if (itemCount() === 0) {
      message.className = 'form-message';
      message.textContent = 'Please select at least one dish before ordering.';
      return;
    }
    const selected = selectedItems();
    const lines = [
      'Hello Athidi Foods! I would like to place a weekend food order.',
      '',
      `Name: ${name}`,
      `Complete address: ${address}`,
      `PIN code: ${pincode}`,
      '',
      'Order details:',
      ...selected.map(item => `• ${item.name} × ${quantities.get(item.name)} — ${money(item.price)} each = ${money(item.price * quantities.get(item.name))}`),
      '',
      `Items total: ${money(itemTotal())}`,
      'Delivery fee: ₹30',
      `Total payable: ${money(itemTotal() + 30)}`,
	  'Please make payment on the link below to confirm your order',
	  `upi://pay?pa=9741119072%40idfcfirst&am=${money(itemTotal() + 30)}&cu=INR`
    ];
    const whatsappUrl = `https://wa.me/919741119072?text=${encodeURIComponent(lines.join('\n'))}`;
    window.location.href = whatsappUrl;
  });

  renderMenu();
  renderCart();
})();