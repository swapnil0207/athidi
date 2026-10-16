import { publicPages, siteUrl } from '../lib/seo';

export default function sitemap() {
  return publicPages.map(page => ({ url: `${siteUrl}${page.path}` }));
}
