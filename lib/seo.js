export const siteUrl = 'https://athidifoods.in';

export const publicPages = [
  { path: '/', label: 'Home', title: 'Athidi Foods Adoni | Pure Veg Food & Lunch Subscriptions', description: 'Discover home-style vegetarian food in Adoni with Athidi Foods. Explore lunch subscriptions, biryani and curries. Find us in NGO Colony, Adoni.' },
  { path: '/lunch-subscription', label: 'Lunch Subscription', title: 'Lunch Subscription in Adoni | Athidi Foods', description: 'Explore home-style vegetarian lunch subscription plans in Adoni. Weekly and monthly lunches with free home delivery. Call Athidi Foods on 9618634908.' },
  { path: '/biryani-curries', label: 'Biryani & Curries', title: 'Vegetarian Biryani & Curries in Adoni | Athidi Foods', description: 'Order vegetarian biryani and curries from Athidi Foods in Adoni. Browse paneer and mushroom dishes, rice and curries, and choose your favourites.' },
  { path: '/sweets', label: 'Sweets — Coming soon', title: 'Sweets in Adoni — Coming Soon | Athidi Foods', description: 'Sweets at Athidi Foods in Adoni are coming soon. This menu is currently in progress. Explore our available lunch subscriptions, biryani and curries.' },
  { path: '/bakery', label: 'Bakery — Coming soon', title: 'Bakery Items in Adoni — Coming Soon | Athidi Foods', description: 'The Athidi Foods bakery menu in Adoni is currently under baking! Bakery ordering is coming soon. Explore our available vegetarian food menus.' },
  { path: '/dry-fruits', label: 'Dry Fruits — Coming soon', title: 'Dry Fruits in Adoni — Coming Soon | Athidi Foods', description: 'The dry fruits menu at Athidi Foods in Adoni is coming soon. This section is in progress. Explore our lunch subscriptions, biryani and curries today.' },
];

export function pageMetadata(path) {
  const page = publicPages.find(item => item.path === path);
  return {
    title: page.title, description: page.description,
    alternates: { canonical: page.path },
    openGraph: { type: 'website', locale: 'en_IN', siteName: 'Athidi Foods', title: page.title, description: page.description, url: page.path, images: [{ url: '/share-image', width: 1200, height: 630, alt: 'Athidi Foods — home-style vegetarian food in Adoni' }] },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: ['/share-image'] },
  };
}

export const businessSchema = {
  '@context': 'https://schema.org', '@type': 'FoodEstablishment', '@id': `${siteUrl}/#business`,
  name: 'Athidi Foods', url: siteUrl, telephone: '+919618634908',
  image: `${siteUrl}/share-image`, logo: `${siteUrl}/assets/Athidi%20Foods%20Logo%20with%20Steaming%20Bowl.png`,
  servesCuisine: ['Indian', 'Vegetarian'], areaServed: { '@type': 'City', name: 'Adoni' },
  address: { '@type': 'PostalAddress', streetAddress: 'Plot No. 46, NGO Colony, Near Children’s Park', addressLocality: 'Adoni', addressRegion: 'Andhra Pradesh', addressCountry: 'IN' },
  hasMenu: `${siteUrl}/biryani-curries`,
};
