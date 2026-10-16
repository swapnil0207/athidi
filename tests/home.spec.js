const { test, expect } = require('@playwright/test');

test('five home banners lead to the correct services', async ({ page }, testInfo) => {
  test.setTimeout(90000); // Visits six routes; allow cold compilation on a reused dev server.
  await page.goto('/');
  const names = ['Lunch Subscription', 'Biryani & Curries', 'Order Sweets', 'Order Bakery Items', 'Order Dry Fruits'];
  await expect(page.locator('.category-banner')).toHaveCount(5);
  await expect(page.locator('.category-banner h2')).toHaveText(names);
  for (const img of await page.locator('.category-photo img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty('complete', true);
    expect(await img.evaluate(element => element.naturalWidth)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.getByRole('link', { name: names[0], exact: true }).click();
  await expect(page).toHaveURL(/\/lunch-subscription$/);
  await expect(page.locator('.home-page .hero h1')).toContainText('Good Food.');
  await expect(page.getByRole('link', { name: 'Call Now' })).toHaveAttribute('href', 'tel:+919618634908');
  await expect(page.locator('.price-card.featured')).toContainText('₹2,400');
  await page.getByRole('banner').getByRole('link', { name: 'Athidi Foods home', exact: true }).click();
  for (const [index, path, message] of [[2, '/sweets', 'Currently in progress.'], [3, '/bakery', 'Currently, this site is under baking. Work in progress!'], [4, '/dry-fruits', 'Currently in progress.']]) {
    await page.getByRole('link', { name: names[index], exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path + '$'));
    await expect(page.locator('h1')).toHaveText(names[index]);
    await expect(page.locator('.coming-copy p')).toHaveText(message);
    await page.getByRole('link', { name: 'Back to home' }).click();
  }
});
