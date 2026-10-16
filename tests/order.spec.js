const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Keep map UI tests independent of the public tile service.
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
});

test('home navigation, menu, images and cart', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/index.html');
  await expect(page).toHaveTitle('Athidi Foods Adoni | Pure Veg Food & Lunch Subscriptions');
  await page.getByRole('link', { name: 'Biryani & Curries', exact: true }).click();
  await expect(page.locator('.dish-card')).toHaveCount(13);
  for (const id of ['rice-grid', 'main-course-grid']) {
    const prices = await page.locator(`#${id} .dish-price`).allTextContents();
    const values = prices.map(price => Number(price.replace(/\D/g, '')));
    expect(values).toEqual([...values].sort((a, b) => a - b));
  }
  const loaded = await page.locator('img').evaluateAll(images => Promise.all(images.map(image => new Promise(resolve => {
    const check = new Image(); check.onload = () => resolve(true); check.onerror = () => resolve(false); check.src = image.src;
  }))));
  expect(loaded.every(Boolean)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const buy = page.getByRole('button', { name: 'Buy now' });
  await expect(buy).toBeDisabled();
  await page.getByRole('button', { name: 'Add one Curd Rice', exact: true }).click();
  await page.getByRole('button', { name: 'Add one Curd Rice', exact: true }).click();
  await page.getByRole('button', { name: 'Add one Dal Fry', exact: true }).click();
  await expect(page.locator('#cart-count')).toHaveText('3 items selected');
  await expect(page.locator('#cart-total')).toHaveText('₹240');
  await page.getByRole('button', { name: 'Remove one Curd Rice', exact: true }).click();
  await buy.click();
  await expect(page.locator('#bill-total')).toHaveText('₹210');
  await expect(page.getByLabel('Full name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(buy).toBeFocused();
  await buy.click();
  await page.getByRole('button', { name: 'Close order form' }).click();
  await buy.click();
  await page.locator('#order-modal').click({ position: { x: 2, y: 2 } });
  await expect(page.getByRole('dialog')).toBeHidden();
  await buy.click();
  await page.getByRole('button', { name: 'Pay with PhonePe' }).click();
  await expect(page.getByRole('status')).toContainText('Please enter your name');
  await page.getByLabel('Full name').fill('Test Customer');
  await page.getByLabel('Complete delivery address').fill('12 Test Street');
  await page.getByLabel('PIN code', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Pay with PhonePe' }).click();
  await expect(page.getByRole('status')).toContainText('not serving your area');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.locator('.store-page')).toBeVisible();
  expect(errors).toEqual([]);
});


for (const pin of ['518301', '518302']) {
  test('PhonePe checkout for ' + pin, async ({ page }) => {
    await page.goto('/order');
    await page.getByRole('button', { name: 'Add one Curd Rice', exact: true }).click();
    await page.getByRole('button', { name: 'Buy now' }).click();
    await page.getByLabel('Full name').fill('Test Customer');
    await page.getByLabel('Complete delivery address').fill('12 Test Street');
    await page.getByLabel('PIN code', { exact: true }).fill(pin);
    await page.getByRole('button', { name: 'Confirm pin location' }).click();
    await page.route('**/api/payments', async route => {
      const body = route.request().postDataJSON();
      expect(body.customer.pincode).toBe(pin);
      expect(body.customer.location).toEqual({ latitude: 15.62788, longitude: 77.27495 });
      expect(body.items).toEqual([{ name: 'Curd Rice', quantity: 1 }]);
      expect(body.amount).toBeUndefined();
      await route.fulfill({ json: { redirectUrl: 'https://mercury-uat.phonepe.com/test-checkout' } });
    });
    await page.route('https://mercury-uat.phonepe.com/**', route => route.fulfill({ body: 'PhonePe checkout intercepted' }));
    await page.getByRole('button', { name: 'Pay with PhonePe' }).click();
    await expect(page).toHaveURL('https://mercury-uat.phonepe.com/test-checkout');
  });
}

for (const status of ['PENDING', 'FAILED', 'COMPLETED']) {
  test('payment result ' + status, async ({ page }) => {
    const id = 'ATH_' + 'a'.repeat(32);
    let whatsappRequests = 0;
    await page.route('https://wa.me/**', route => { whatsappRequests++; return route.fulfill({ body: 'WhatsApp intercepted' }); });
    await page.route('**/api/payments/' + id, route => route.fulfill({ json: {
      id, status, amount: 90,
      ...(status === 'COMPLETED' ? { whatsappUrl: 'https://wa.me/919741119072?text=paid' } : {}),
    } }));
    await page.goto('/payment/' + id);
    if (status === 'COMPLETED') {
      await expect(page).toHaveURL(/wa.me/);
      expect(whatsappRequests).toBe(1);
    } else {
      await expect(page.getByRole('status')).toContainText(status === 'PENDING' ? 'pending' : 'failed');
      expect(whatsappRequests).toBe(0);
      await expect(page.getByRole('link', { name: 'Send order on WhatsApp' })).toHaveCount(0);
    }
  });
}

test('payment verification errors do not claim success', async ({ page }) => {
  const id = 'ATH_' + 'b'.repeat(32);
  await page.route('**/api/payments/' + id, route => route.fulfill({ status: 503, json: { error: 'Please check again; do not pay again.' } }));
  await page.goto('/payment/' + id);
  await expect(page.getByRole('status')).toContainText('do not pay again');
  await expect(page.getByRole('button', { name: 'Check payment again' })).toBeEnabled();
});

test('payment endpoints reject untrusted origins and status requests without ownership', async ({ request }) => {
  const start = await request.post('/api/payments', { headers: { Origin: 'https://untrusted.example' }, data: {} });
  expect(start.status()).toBe(403);
  const status = await request.get('/api/payments/ATH_' + 'c'.repeat(32));
  expect(status.status()).toBe(403);
  expect((await status.json()).whatsappUrl).toBeUndefined();
});
