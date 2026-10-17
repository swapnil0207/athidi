# Installation and notification support

Open `/app-settings`, or **Install & notifications** in the footer. Deploy over HTTPS; localhost also works for development. The manifest stays at `/assets/favicon/site.webmanifest` to preserve its existing URL, with a stable root ID/start URL, standalone display, shortcuts and orange steaming-bowl icons. The 512px icon has maskable padding; the Apple icon has an opaque background.

Android: use the install button when the browser offers it, or the browser menu's Install app / Add to Home screen. iPhone/iPad: Share → Add to Home Screen, then launch that installed app. Web Push requires iOS/iPadOS 16.4+ and a home-screen web app. Desktop installation depends on browser support. Installation prompts are browser-controlled and not guaranteed to appear on every visit.

The notification button requests permission only after a user action. Once granted, Send test notification displays a real service-worker notification on that device. Permission-denied states explain how to change browser/device settings. Permission alone does NOT create a push subscription or enroll a customer in automated messages.

After installation (or when opening the installed app), a notification prompt appears below the header if permission has not been decided. The system dialog opens only after tapping Enable notifications. Not now hides this prompt for the current browser session; the settings page remains available. Granted or blocked permissions are never automatically requested again. The prompt also confirms the result after a choice.

Temporary announcement preview: `lib/announcements.mjs` contains four hardcoded messages for 17 and 18 October 2026 at 21:15 and 21:30 Asia/Kolkata. These run on devices with permission while the app page is running. The app checks every 10 seconds and on focus/visibility changes, skips messages over one minute late, and remembers shown messages in localStorage. Web Locks coordinate cooperating tabs where supported. The settings page has an opt-out. Browser throttling, a closed app or a sleeping phone can prevent delivery; this is not remote push or a reliable alarm. Clearing browser storage can reset the shown markers. No database connection or server scheduler was added for this temporary preview.

`public/sw.js` handles incoming Web Push events and opens same-origin notification destinations. Supported payload: `{ "title": "Athidi Foods", "body": "Your lunch update is ready.", "url": "/dashboard/customer", "tag": "lunch-update" }`. The click handler opens a new window if the exact destination is not already open, avoiding navigation away from an ongoing checkout.

## What remains for automatic messages

Remote sending is not implemented yet because account authentication and subscription persistence are still demo-only. Before enabling live order alerts:

1. Create VAPID keys; keep the private key server-only and use a stable public key on the client.
2. After notification opt-in, use `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` and persist that subscription through an authenticated endpoint tied to the REAL account, never a demo client-side ID.
3. Add authenticated unsubscribe/device management, remove expired 404/410 subscriptions, and re-enroll when a subscription changes. Do not use server memory as persistent storage on Vercel.
4. Send Web Push from verified backend events (new order, order sent, scheduled lunch reminder) using a Web Push library and saved subscriptions. Avoid private customer/payment data in lock-screen messages and validate subscriptions before sending server-side requests.

No public broadcast/send endpoint, VAPID secrets, database tables or fake automatic messaging were added. Local test notifications verify presentation, not remote push delivery or delivery while the app is closed.

## Offline and updates

Only `/offline.html` is cached. Pages, dashboards, APIs, payment results and JavaScript bundles are not cached by this worker. Failed navigations show a reconnect screen; offline orders or token edits are not queued. Updated workers wait; `/app-settings` offers Update & refresh. Finish checkout before accepting that update. Increment the `athidi-offline-v1` cache name when modifying the offline screen.

Use the same canonical HTTPS domain consistently; installations, permissions, service workers and demo browser storage are isolated per origin. Ngrok and localhost installations do not transfer to the production domain. A changed ngrok hostname needs a new installation/permission.

Checks: `node tests/pwa-worker.test.mjs` and `npm test -- tests/pwa.spec.js`. Physical Android/iPhone installation, OS notification presentation and real push delivery must be checked on devices after deployment.

References: https://nextjs.org/docs/app/guides/progressive-web-apps and https://webkit.org/blog/13878/
