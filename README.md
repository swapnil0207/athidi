# Athidi Foods — Next.js

Next.js App Router application preserving the home page, responsive design and weekend ordering flow.

## Run locally

Requires Node.js 20.9 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

## Build and deploy

```sh
npm run build
npm start
```

Deploy to a host supporting the Next.js Node.js runtime, such as Vercel, or run `npm start` on your server. PhonePe checkout uses server routes and cannot run on GitHub Pages or the old static `out/` export. Configure the environment variables on your hosting provider.

Routes: `/` is the five-category home page; `/lunch-subscription` preserves the original lunch landing page; `/biryani-curries` uses the existing ordering flow. `/sweets`, `/bakery`, and `/dry-fruits` are coming-soon pages. `/order`, `/payment/[id]`, and compatibility aliases `/index.html` and `/order.html` remain supported.

## Features

- All 13 dishes, original images and prices, price sorting, and rice/main-course categories.
- Quantity controls, selected-card styling, cart count, subtotal and ₹30 delivery fee.
- Name, address and six-digit PIN validation; delivery to 518301 and 518302 only.
- Checkout saves the order in Supabase and redirects to PhonePe. Only after server verification of successful payment does the result page open WhatsApp to +91 97411 19072 with the paid order details. The customer must tap Send. There is no second UPI payment request.
- Home subscription enquiries and calls retain +91 96186 34908.
- Modal close button, backdrop dismissal, Escape, scroll locking and focus restoration, plus keyboard focus containment.
- Cart quantities reset on reload. Submitted orders and verified payment states are stored in Supabase.

Edit menu data in `lib/menu.js`, checkout rules in `lib/checkout.js`, home content in `app/page.jsx`, and ordering UI in `components/OrderPage.jsx`. Original styles are scoped per page in `app/globals.css`. Static assets live in `public/assets/`.

## Supabase

Copy `.env.example` to `.env.local` and set your project's URL and publishable key. Local credentials are ignored by Git. Set the same variables in your hosting provider's build environment before building; restart the development server after changing them.

Use the shared client inside a Client Component's event handler or effect:

```js
import { createClient } from '../lib/supabase/client';

const supabase = createClient();
```

The public client is available for future browser features. Payment records use a separate server-only client with `SUPABASE_SERVICE_ROLE_KEY`. The payment table has RLS enabled with no browser access policies. Never expose the service-role key with a `NEXT_PUBLIC_` prefix.

Supabase client documentation: https://supabase.com/docs/reference/javascript/initializing

## Delivery location map

Checkout includes a Leaflet map using standard OpenStreetMap tiles. No API key, billing account, geocoding service or paid location SDK is needed. The map loads only when the delivery form opens, includes attribution and uses normal browser tile caching, following the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/). The public tile service is best-effort, with no uptime guarantee or reserved monthly allowance.

The map starts at Adoni (15.62788, 77.27495). If browser location permission is already granted, it automatically selects the current position. Otherwise the customer can tap “Use my current location” to request permission, or tap the map/drag the pin. Keyboard users can focus the pin and use arrow keys. The default Adoni pin must be confirmed or moved before checkout; it is never silently submitted as the customer's location. A manual selection is preserved when reopening the form and is not overwritten by a late GPS response.

Geolocation requires HTTPS in deployment (localhost works for development). A denied permission or GPS timeout leaves manual selection available. Location accuracy depends on the device, so the customer can adjust the pin. Address text and the supported PIN code remain required; the map does not automatically fill or verify the street address or delivery boundary.

Validated coordinates are saved in the existing `customer.location` JSON object with the order. No additional database migration is required. The paid WhatsApp message includes a clickable Google Maps coordinate link for delivery; generating that link does not use a paid Google API. Previously saved orders without coordinates remain readable.

## PhonePe credentials and activation

1. Run `supabase/migrations/202610150001_payment_orders.sql` once in your Supabase SQL editor, or apply it using Supabase CLI migrations. This file is prepared locally; it has not been applied to your project.
2. Fill the placeholders in `.env.local`: `SUPABASE_SERVICE_ROLE_KEY`, `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, and `PHONEPE_CLIENT_VERSION`. Use credentials issued for the chosen `PHONEPE_ENV` (`sandbox` initially; `production` only after UAT).
3. Set `APP_URL` to the exact public HTTPS origin of your app, with no path. Locally it is `http://localhost:3000`; use a public HTTPS tunnel for webhook testing. Open checkout using that same origin.
4. Set `PHONEPE_WEBHOOK_USERNAME` and `PHONEPE_WEBHOOK_PASSWORD` to strong values. In PhonePe Developer Settings, create a webhook using **SHA (Username & Password)** authentication with the same values, URL `https://YOUR_DOMAIN/api/payments/webhook`, and events `checkout.order.completed` and `checkout.order.failed`.
5. Restart the development server or redeploy. Complete PhonePe sandbox testing before changing to production credentials.

No PhonePe credentials are included and no real charge is made by the test suite. Until the placeholders and migration are configured, checkout shows a payment-unavailable message. WhatsApp Business API credentials are not needed for the chosen customer-send flow.

The server recalculates prices from `lib/menu.js`, including the delivery fee, in integer paise. A checkout token prevents duplicate payment creation on request retries. A private HTTP-only cookie restricts order-status access to the browser that created the order. Keep cookies enabled and return from PhonePe in the same browser. Verified payments cannot be downgraded by late or duplicate callbacks.

The result page polls pending payments for approximately one minute, then provides a manual recheck. PhonePe webhooks still update saved orders when the browser is closed. Unknown payment outcomes are not automatically retried as new charges: customers see their reference and contact details. A paid order is saved even if WhatsApp cannot open; the result page provides a manual link. A prefilled WhatsApp message is customer-editable, so use the stored payment record as proof of payment.

PhonePe references: [create payment](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/create-payment), [order status](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/order-status), [webhooks](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/webhook).

## Verification

```sh
npx playwright install chromium
npm run build
npm run test:payments
npm test
```

Unit tests cover server-calculated amounts, invalid orders, payment amount/ID matching, terminal success, and paid-only WhatsApp messages. Desktop/mobile browser tests cover the order flow and mocked PhonePe redirects, pending, failed, completed, and unavailable verification states. These do not replace live sandbox testing with your PhonePe account or database migration verification.
