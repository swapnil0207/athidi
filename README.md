# Athidi Foods website with Weekend Ordering

This is the existing Athidi Foods static website with one new weekend-ordering banner on `index.html` and a separate `order.html` ordering page.

## Deploy
Upload/extract the contents of this ZIP into the root of your existing GitHub Pages repository, replacing the existing `index.html` and `style.css` with the included updated versions. Keep the `CNAME` file. The other existing home-page sections and content are retained.

## Weekend ordering flow
- Customers choose dishes and quantities; the sticky cart shows item count and item subtotal.
- Buy now opens a delivery form showing item subtotal, ₹30 delivery fee, and grand total.
- Only PIN codes `518301` and `518302` are accepted for WhatsApp checkout. Other valid six-digit PIN codes display an out-of-area message.
- Accepted orders open WhatsApp to `+91 70280 27795` with customer name, address, PIN code, each dish, quantity, unit price, line total, item subtotal, delivery fee, and grand total prefilled.

The site is static and does not store orders or send messages automatically; the customer must press Send in WhatsApp.
