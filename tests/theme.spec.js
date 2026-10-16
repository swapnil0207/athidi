const { test, expect } = require('@playwright/test');

test('all pages share the header and footer without horizontal overflow', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await page.route('**/api/payments/theme-check', route => route.fulfill({ json: { status: 'FAILED', amount: 180 } }));
  for (const path of ['/', '/lunch-subscription', '/biryani-curries', '/order', '/sweets', '/bakery', '/dry-fruits', '/sitemap.html', '/payment/theme-check']) {
    await page.goto(path);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('.store-header')).toBeVisible();
    await expect(page.locator('.store-footer')).toContainText('20126192001203');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (['/lunch-subscription', '/biryani-curries', '/payment/theme-check'].includes(path)) {
      await page.screenshot({ path: testInfo.outputPath(path.split('/')[1] + '.png'), fullPage: true });
    }
  }
});
