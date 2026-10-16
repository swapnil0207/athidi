# Search and sharing setup

The canonical domain is https://athidifoods.in (matching public/CNAME). Keep this in sync in lib/seo.js if the production domain changes. The hosting provider should redirect www to this domain and HTTP to HTTPS.

- Each public category has a unique title, description, canonical URL, Open Graph metadata and Twitter preview metadata.
- /share-image serves a 1200 × 630 PNG using the original high-resolution logo. WhatsApp may retain an older preview after deployment; test with a newly shared URL such as /?share=2. Existing messages may keep their old preview.
- The browser icon is a scalable bowl mark with 192px and 512px PNG variants and a 180px Apple touch icon. Source: public/assets/favicon/athidi-icon.svg.
- /sitemap.xml lists the six canonical public pages. /sitemap.html is the visitor sitemap, linked in the footer. /robots.txt advertises the XML sitemap.
- /order keeps working but points search engines to /biryani-curries as its canonical page. Legacy HTML aliases inherit canonical metadata.
- Payment pages use noindex; API responses have an X-Robots-Tag header. Payment pages remain crawlable so crawlers can see noindex. These directives are not access controls.
- FoodEstablishment structured data uses the supplied business name, phone and address. No ratings, hours or location coordinates have been invented.
- Coming-soon pages are described honestly. Add real products and useful local content when these services launch; placeholder pages have limited ranking potential.

After deploying, verify the domain in Google Search Console and submit https://athidifoods.in/sitemap.xml. Set up or update the business's Google Business Profile with matching name, address, phone and website. Review the live pages with Google's URL Inspection and Rich Results Test. Indexing and rankings are controlled by search engines and are not guaranteed by these changes.

References: https://nextjs.org/docs/app/getting-started/metadata-and-og-images and https://developers.google.com/search/docs/appearance/structured-data/local-business
