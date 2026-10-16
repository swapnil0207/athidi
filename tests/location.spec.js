const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
});
async function checkout(page) {
  await page.goto('/order');
  await page.getByRole('button', { name: 'Add one Curd Rice', exact: true }).click();
  await page.getByRole('button', { name: 'Buy now' }).click();
  await expect(page.getByRole('button', { name: 'Confirm pin location' })).toBeEnabled();
}

test('Adoni fallback, selecting and retaining a custom pin', async ({ page }) => {
  await checkout(page);
  const coordinates = page.getByTestId('delivery-coordinates');
  await expect(coordinates).toHaveText('Pin: 15.627880, 77.274950');
  await page.getByLabel('Full name').fill('Customer');
  await page.getByLabel('Complete delivery address').fill('Adoni, near park');
  await page.getByLabel('PIN code', { exact: true }).fill('518301');
  await page.getByRole('button', { name: 'Pay with PhonePe' }).click();
  await expect(page.locator('#form-message')).toContainText('select or confirm');
  const map = page.getByRole('region', { name: 'Delivery location map' });
  await map.click({ position: { x: 100, y: 100 } });
  await expect(coordinates).toContainText('Selected:');
  const chosen = await coordinates.textContent();
  expect(chosen).not.toContain('15.627880, 77.274950');
  await page.getByRole('button', { name: 'Close order form' }).click();
  await page.getByRole('button', { name: 'Buy now' }).click();
  await expect(coordinates).toHaveText(chosen);
  // Keyboard users can adjust the pin precisely too.
  const marker = page.locator('.delivery-pin');
  await marker.focus();
  await page.keyboard.press('ArrowRight');
  await expect(coordinates).not.toHaveText(chosen);
});

test('granted location is selected automatically and can be changed', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 15.635, longitude: 77.281, accuracy: 15 });
  await checkout(page);
  const coordinates = page.getByTestId('delivery-coordinates');
  await expect(coordinates).toHaveText('Selected: 15.635000, 77.281000');
  await page.getByRole('region', { name: 'Delivery location map' }).click({ position: { x: 100, y: 100 } });
  await expect(coordinates).not.toHaveText('Selected: 15.635000, 77.281000');
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await expect(coordinates).toHaveText('Selected: 15.635000, 77.281000');
});

test('denied location leaves manual pin selection working', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, failure) => failure({ code: 1 });
  });
  await checkout(page);
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await expect(page.locator('.location-notice')).toContainText('permission is off');
  await expect(page.getByTestId('delivery-coordinates')).toHaveText('Pin: 15.627880, 77.274950');
  await page.getByRole('button', { name: 'Confirm pin location' }).click();
  await expect(page.getByTestId('delivery-coordinates')).toHaveText('Selected: 15.627880, 77.274950');
});

test('a late GPS response does not overwrite the customer selection', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = success => { window.delayedLocation = success; };
  });
  await checkout(page);
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await page.getByRole('region', { name: 'Delivery location map' }).click({ position: { x: 100, y: 100 } });
  const selected = await page.getByTestId('delivery-coordinates').textContent();
  await page.evaluate(() => window.delayedLocation({ coords: { latitude: 15.635, longitude: 77.281, accuracy: 10 } }));
  await expect(page.getByTestId('delivery-coordinates')).toHaveText(selected);
  await expect(page.getByRole('button', { name: 'Use my current location' })).toBeEnabled();
});

test('dragging the marker updates the delivery coordinates', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mouse drag is verified on desktop; mobile selection is covered by map taps.');
  await checkout(page);
  const marker = page.locator('.delivery-pin');
  await marker.scrollIntoViewIfNeeded();
  const box = await marker.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 65, box.y + box.height / 2 + 25, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByTestId('delivery-coordinates')).toContainText('Selected:');
  await expect(page.getByTestId('delivery-coordinates')).not.toContainText('15.627880, 77.274950');
});
