import 'leaflet/dist/leaflet.css';
import './globals.css';
import './location.css';
import './store.css';
import { siteUrl, pageMetadata, businessSchema } from '../lib/seo';
import StoreHeader from '../components/StoreHeader';
import StoreFooter from '../components/StoreFooter';

export const metadata = {
  metadataBase: new URL(siteUrl),
  ...pageMetadata('/'),
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/assets/favicon/athidi-icon.svg?v=2', sizes: 'any', type: 'image/svg+xml' },
      { url: '/assets/favicon/athidi-icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/assets/favicon/athidi-apple-180.png?v=2',
  },
  manifest: '/assets/favicon/site.webmanifest',
};

export default function RootLayout({ children }) {
  return <html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
  </head><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema).replace(/</g, '\\u003c') }} /><div className="store-page store-shell"><StoreHeader /><div className="store-content">{children}</div><StoreFooter /></div></body></html>;
}
