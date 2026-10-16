# Shop dashboard preview

Open `/dashboard/login`, or use **Shop login** in the shared footer. Choose a demo account to fill the form, then submit. All demo passwords are `Preview123`.

| Shop | Demo login |
| --- | --- |
| Lunch Subscription | lunch.demo |
| Biryani & Curries | biryani.demo |
| Sweets | sweets.demo |
| Bakery | bakery.demo |
| Dry Fruits | dryfruits.demo |

This is a UI prototype, not authentication. The IDs and password are public, and the client-side session can be bypassed. Do not put real customer data, secrets, or real account passwords into it. The login form will connect to server-validated, manually issued shop accounts after the data model is agreed.

The active demo shop is stored in sessionStorage. Product flags, shop settings, tracking links and order statuses persist per demo shop in localStorage. Reset demo restores that shop's samples. Logging out removes the demo session, not the saved sample edits. Other devices and browsers do not receive these changes.

The overview filters by calendar month. All sample orders represent paid item sales; the sample fee is 5%, and estimated earnings are item sales minus that fee. This is not a real fee agreement or payout calculation. Taxes, delivery charges, refunds and settlements are deliberately not invented. Sweets, bakery and dry fruit product names/prices are illustrative, not a published catalog.

Order status options: Received, In progress, Sent and Delivered. The demo allows edits between these states to explore the layout; backend transition rules remain to be designed. Tracking links must use HTTPS. There is no background order polling or notification delivery. The reopening date is a local-time notice only, not a scheduled job. Public menus, customer checkout and existing payment APIs are unaffected.

Before connecting live data: implement server-side shop membership and authorization, manual account provisioning, products scoped to their shop, availability checks during checkout, shop operating rules, order assignment and audit history, settlement accounting and real-time/polling updates. Database schema, RLS and migrations are intentionally not created in this layout task.

Dashboard routes use noindex and are excluded from the public XML sitemap. This is a crawler directive, not access control.
