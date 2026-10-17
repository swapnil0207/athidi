const { test, expect } = require('@playwright/test');

test('installed app offers notification permission only after a tap and confirms the result', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { get: () => true });
    window.permissionCalls = 0;
    let permission = 'default';
    Object.defineProperty(Notification, 'permission', { get: () => permission });
    Notification.requestPermission = async () => { window.permissionCalls++; permission = 'granted'; return permission; };
  });
  await page.goto('/');
  const prompt = page.getByRole('region', { name: 'Notification permission' });
  await expect(prompt).toBeVisible();
  const enable = prompt.getByRole('button', { name: 'Enable notifications', exact: true });
  await expect(enable).toBeEnabled();
  expect(await page.evaluate(() => window.permissionCalls)).toBe(0);
  await enable.click();
  await expect(prompt.getByRole('status')).toHaveText('Notifications are enabled on this device.');
  expect(await page.evaluate(() => window.permissionCalls)).toBe(1);
  await prompt.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(prompt).toHaveCount(0);
  await page.reload();
  await expect(prompt).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('floating WhatsApp clears the cart and hardcoded messages use India time', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-17T21:14:50+05:30') });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { get: () => true }); // Simulate an installed PWA.
    Object.defineProperty(Notification, 'permission', { get: () => 'granted' });
    window.announcementCalls = [];
    ServiceWorkerRegistration.prototype.showNotification = async function (title) { window.announcementCalls.push(title); };
  });
  await page.goto('/app-settings');
  await expect(page.getByRole('button', { name: 'Send test notification' })).toBeEnabled();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Let’s talk' })).toHaveCount(0);
  const whatsapp = page.getByRole('link', { name: 'Chat with Athidi Foods on WhatsApp' });
  await expect(whatsapp).toHaveAttribute('href', 'https://wa.me/919618634908');
  await expect(whatsapp).toBeVisible();
  await page.clock.fastForward(11000);
  await expect.poll(() => page.evaluate(() => window.announcementCalls)).toContain('Shree Ganeshaya Namaha');
  await page.clock.fastForward(900000);
  await expect.poll(() => page.evaluate(() => window.announcementCalls)).toContain('we are building something new stay tune');
  await page.goto('/biryani-curries');
  const buttonBounds = await whatsapp.boundingBox();
  const cartBounds = await page.locator('.cart-bar').boundingBox();
  expect(buttonBounds.y + buttonBounds.height).toBeLessThanOrEqual(cartBounds.y);
  await page.screenshot({ path: testInfo.outputPath('floating-whatsapp.png'), fullPage: false });
  await page.getByRole('button', { name: 'Add one Curd Rice' }).click();
  await page.getByRole('button', { name: /Buy now/ }).click();
  await expect(whatsapp).toBeHidden();
});

test('navigation install icon opens the available prompt and falls back to instructions', async ({ page }) => {
  await page.goto('/');
  const install = page.getByRole('button', { name: 'Install Athidi Foods app', exact: true });
  await expect(install).toBeVisible();
  await install.click();
  await expect(page).toHaveURL(/\/app-settings$/);
  await expect(page.getByRole('heading', { name: 'Make room for good food.' })).toBeVisible();
  await page.evaluate(() => {
    window.testInstallCalls = 0;
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.testInstallCalls++; };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(event);
  });
  await install.click();
  await expect.poll(() => page.evaluate(() => window.testInstallCalls)).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(install).toHaveCount(0);
});

test('PWA manifest, installation help and offline fallback', async ({ page, context, request }, testInfo) => {
  test.setTimeout(90000);
  const response = await request.get('/assets/favicon/site.webmanifest');
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.scope).toBe('/');
  expect(manifest.start_url).toBe('/');
  expect(manifest.display).toBe('standalone');
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBeTruthy();
  const worker = await request.get('/sw.js');
  expect(worker.headers()['cache-control']).toContain('no-store');
  await page.goto('/app-settings');
  await expect(page.getByRole('heading', { name: 'Make room for good food.' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('app-settings.png'), fullPage: true });
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('athidi-offline-v1');
    return (await cache.keys()).map(request => new URL(request.url).pathname);
  });
  expect(cached).toEqual(['/offline.html']);
  await context.setOffline(true);
  await page.goto('/dashboard/customer');
  await expect(page.getByRole('heading', { name: 'A little pause in the connection.' })).toBeVisible();
  await expect(page.getByText('Offline actions are not submitted.', { exact: false })).toBeVisible();
  await context.setOffline(false);
  await page.goto('/app-settings');
  await expect(page.getByRole('heading', { name: 'Stay in the loop.' })).toBeVisible();
});

test('notification controls handle granted and denied permissions (browser API simulated)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'iPhone notification flow requires a real installed iOS web app.');
  // Headless Chromium here reports Notification.permission=denied even when
  // Permissions.query says granted. Exercise UI/API wiring without claiming OS delivery.
  await page.addInitScript(() => {
    Object.defineProperty(Notification, 'permission', { get: () => localStorage.getItem('pwa-test-denied') ? 'denied' : 'granted' });
    window.testNotifications = [];
    ServiceWorkerRegistration.prototype.showNotification = async function (title, options) { window.testNotifications.push({ title, options }); };
  });
  await page.goto('/app-settings');
  const send = page.getByRole('button', { name: 'Send test notification' });
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.getByRole('status')).toContainText('Test notification sent');
  const notifications = await page.evaluate(() => window.testNotifications.map(item => item.title));
  expect(notifications).toContain('Athidi Foods is ready');
  await page.evaluate(() => localStorage.setItem('pwa-test-denied', 'true'));
  await page.reload();
  await expect(page.getByText('Notifications are blocked.', { exact: false })).toBeVisible();
});
