import { publicPages } from '../../lib/seo';

export const metadata = { title: 'Sitemap | Athidi Foods Adoni', description: 'Find every Athidi Foods menu and lunch subscription page in Adoni.', alternates: { canonical: '/sitemap.html' } };

export default function SitemapPage() {
  return <div className="store-section"><main className="store-container coming-page">
    <h1>Explore Athidi Foods</h1><p>Home-style food in Adoni. Find your favourites below.</p>
    <nav aria-label="Sitemap"><ul className="sitemap-links">{publicPages.map(page => <li key={page.path}><a href={page.path}>{page.label} <span aria-hidden="true">↗</span></a></li>)}</ul></nav>
  </main></div>;
}
