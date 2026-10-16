# Connected lunch subscription previews

Open Customer login or Admin login from the shared footer.

| Workspace | URL | Demo ID | Password |
| --- | --- | --- | --- |
| Customer | /dashboard/customer/login | customer.demo | Preview123 |
| Other sample customers | /dashboard/customer/login | ananya.demo or ravi.demo | Preview123 |
| Kitchen admin | /dashboard/admin/login | admin.demo | Preview123 |

These are client-side UI prototypes, not secure accounts. No real payment, subscription, database, notification or authorization is connected. Both previews share one localStorage record in the same browser, and refresh on storage events or window focus. Demo sessions are separate for customer and admin. Production must validate every action and shop/customer/admin permission on the server; local storage is neither secure nor transactional across concurrent tabs.

## Token and delivery assumptions

- A sample monthly pack credits 26 tokens. One fulfilled tiffin uses one token. Sample history starts the three customers with 20, 8 and 2 tokens remaining.
- Monday–Friday delivery, no expiry, and a 56-day planning horizon are preview assumptions pending business confirmation. A 26-token pack is not forced to expire at the end of a calendar month.
- Default quantity is one per delivery day. An extra-food request sets the TOTAL for that date: three means three, not four.
- A pause sets zero for every delivery day in the inclusive range. It replaces extra quantities in that range; resume restores one. Weekends are skipped, and a weekend-only request is rejected.
- Saving a request never consumes tokens. Earlier forecast lunches are allocated first; locked cooking lists reserve their quantities. Insufficient balances exclude the entire request, not a partial meal count. The customer sees actual balance and separately sees locked reservations.
- The admin locks the cooking list before preparation. That freezes quantities and the menu and blocks customer changes. Unfulfilled lists can be reopened explicitly, which releases reservations and allows changes. Fulfilled lists cannot be reopened.
- Admin marks all confirmed deliveries fulfilled after delivery. That records each quantity and deducts its tokens. Repeated fulfillment is idempotent; future dates cannot be fulfilled. Production should additionally support partial delivery, failed delivery, refunds and an audit trail.
- Unlocked future counts are forecasts and can change when earlier meals are paused or quantities change. Never cook from an unlocked forecast. There is no automatic fixed-time cutoff, rollover, or delivery scheduler in this prototype.
- Renewal links open a WhatsApp enquiry. No tokens are credited by merely requesting renewal.

## Menu and feedback

The five fixed menu options are illustrative. Admin can publish Monday–Friday menus and optional special-dish notes. Past dates and locked dates cannot be edited. The customer dashboard reads the same published menus. Reviews require a fulfilled delivery and allow a 1–5 rating plus optional text. Customers can update their review; admins see the review attached to its delivery menu.

Pure rule checks: `node tests/lunch-unit.test.mjs`.
Desktop/mobile end-to-end checks: `npm test -- tests/lunch-dashboard.spec.js --workers=2`.

Before live rollout, agree delivery days, holidays, daily cutoff/timezone, token expiry, renewal rules and treatment of failed/refunded deliveries. Design transactional token reservations and an immutable ledger, enforce all roles server-side, and connect menu publication, kitchen locking, fulfillment and reviews to persistent database records. No database schema or RLS changes have been made for these previews.
