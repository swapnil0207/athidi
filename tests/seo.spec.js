const { test, expect } = require('@playwright/test');

test('public pages expose canonical URLs and sharing metadata to crawlers', async ({ request }) => {
  test.setTimeout(120000);
  const routes = ['/', '/lunch-subscription', '/biryani-curries', '/sweets', '/bakery', '/dry-fruits', '/order'];
  const titles = new Set();
  for (const route of routes) {
    const response = await request.get(route, { headers: { 'User-Agent': 'WhatsApp/2.0' } });
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    const canonical = route === '/order' ? '/biryani-curries' : route;
    const canonicalUrl = html.match(/rel="canonical" href="([^"]+)"/)[1];
    expect(new URL(canonicalUrl).href).toBe(new URL(canonical, 'https://athidifoods.in').href);
    expect(html).toContain('property="og:image" content="https://athidifoods.in/share-image"');
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('name="description"');
    expect(html).toContain('application/ld+json');
    if (route !== '/order') titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
  }
  expect(titles.size).toBe(6);
});

test('sitemaps, robots and high-resolution preview are accessible', async ({ request }) => {
  test.setTimeout(90000);
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain('Sitemap: https://athidifoods.in/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml.match(/<loc>/g)).toHaveLength(6);
  expect(xml).not.toContain('/payment/');
  expect(xml).not.toContain('/order');
  const html = await request.get('/sitemap.html');
  expect(html.ok()).toBeTruthy();
  expect(await html.text()).toContain('aria-label="Sitemap"');
  const preview = await request.get('/share-image');
  expect(preview.ok()).toBeTruthy();
  expect(preview.headers()['content-type']).toContain('image/png');
  const image = await preview.body();
  expect(image.readUInt32BE(16)).toBe(1200);
  expect(image.readUInt32BE(20)).toBe(630);
  const icon = await request.get('/assets/favicon/athidi-icon-192.png');
  expect(icon.ok()).toBeTruthy();
  expect((await icon.body()).readUInt32BE(16)).toBe(192);
  const payment = await request.get('/payment/seo-check');
  expect(await payment.text()).toContain('name="robots" content="noindex, nofollow"');
});
