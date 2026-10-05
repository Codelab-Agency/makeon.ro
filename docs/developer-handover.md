# Makeon — Developer handover

This guide is for developers taking over the application. It describes the
implemented behavior, the code responsible for it, and the operational steps
needed to maintain it. No access to the original development team is required
to run the project once the repository and service credentials are available.

## 1. Application overview

Makeon combines a company website for SwitchMorn Coffee and Vero Aqua with a
coffee store and an authenticated administration dashboard. The public UI and
Payload CMS run in the same Next.js application. PostgreSQL, media storage,
payments, and email delivery are external services.

| Layer | Implementation |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| CMS and authentication | Payload CMS with PostgreSQL adapter |
| Database | Neon PostgreSQL |
| Media | Cloudflare R2 through the Payload S3 storage plugin |
| Payments | Stripe Checkout and signed webhooks |
| Contact email | Resend |
| Visuals | Three.js, GSAP, SVG, CSS |
| Current hosting | Vercel; optional standalone build for a VPS |

Use `package-lock.json` and `npm ci` for reproducible dependency installation.
The integration was developed with Node.js 24; use a supported Node version
compatible with the versions locked in the repository.

## 2. Repository map

| Location | Responsibility |
| --- | --- |
| `src/app/(site)/` | Public pages, store, product detail, payment result |
| `src/app/(payload)/` | Payload admin routes, layout, custom admin stylesheet |
| `src/app/api/` | Contact, catalog, checkout, production requests, Stripe webhook |
| `src/payload.config.ts` | CMS, database, R2, admin components, allowed origins |
| `src/cms/collections.ts` | Users, media, products, orders, access rules and hooks |
| `src/payload-types.ts` | Generated CMS types; regenerate after collection changes |
| `src/lib/storefront.ts` | Public catalog mapping and active-product filtering |
| `src/lib/commerce.ts` | Stock checkout, transactions, Stripe sessions, reconciliation |
| `src/lib/production-orders.ts` | Made-to-order requests and administrator payment links |
| `src/lib/commerce-validation.ts` | Cart validation, grinding options, money conversion |
| `src/lib/commerce-env.ts` | Configuration checks and payment availability |
| `src/lib/contact-request.ts` | Contact validation and Resend submission |
| `src/components/cart-provider.tsx` | Persisted cart and choice of checkout flow |
| `src/components/admin/` | Dashboard, order summary, payment-link panel, list presentation |
| `src/migrations/` | Versioned schema changes and custom SQL constraints |
| `scripts/bootstrap-commerce.ts` | Initial administrator and missing catalog products |
| `scripts/verify-migrations.mjs` | Migration verification on an explicitly configured clone |
| `tests/commerce/` | Database integration tests and mocked payment/email providers |
| `tests/*.spec.ts` | Playwright UI checks |

Business copy and catalog fallback data also live in `src/lib/coffee-catalog.ts`
and the relevant public components. Product data from the CMS takes precedence
once the CMS is configured.

## 3. Accounts, access, and environment

The owner should retain access to the Git repository, Vercel project, Neon
project, Cloudflare account/bucket/DNS, Stripe account, Resend account, domain
registrar, and an administrator account. Transfer service access through each
provider's account controls; credentials do not belong in this document.

Use `.env.example` as the configuration inventory. Local Next.js supports its
usual environment files. The migration verification command specifically reads
`.env`, while the bootstrap script loads environment variables through Next.js.
Keep the file used by a command consistent with its intended database.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Application PostgreSQL connection, with SSL for Neon |
| `PAYLOAD_SECRET` | Stable authentication secret, at least 32 characters |
| `APP_URL` | Canonical public origin used by checkout and origin checks |
| `ADMIN_ALLOWED_ORIGINS` | Additional exact admin origins, comma-separated |
| `PAYLOAD_DB_PUSH` | Defaults to disabled; `true` only for disposable local databases |
| `MIGRATION_TEST_DATABASE_URL` | Separate database/Neon endpoint for clone verification |
| `R2_ENDPOINT` | S3 endpoint, distinct from the public media URL |
| `R2_BUCKET` | Product image bucket |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Server-side S3 credentials scoped to the bucket |
| `R2_PUBLIC_URL` | Public media domain or enabled R2 development URL |
| `STRIPE_SECRET_KEY` | Server-side Stripe key, test or live as appropriate |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the configured webhook endpoint |
| `SHIPPING_PRICE_BANI` | Stock-checkout shipping amount as integer bani; explicitly set `0` for free shipping |
| `RESEND_API_KEY` | Server-side email provider key |
| `RESEND_FROM_EMAIL` | Sender, normally on a domain verified in Resend |
| `CONTACT_EMAIL_TO` | Recipient of contact requests |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial bootstrap only; remove password afterwards |
| `NEXT_OUTPUT_STANDALONE` | `true` enables the optional standalone Next.js build |

Do not put these credentials in `NEXT_PUBLIC_*`. Production and preview should
use separate databases and appropriate test/live provider configuration.

## 4. Local development and initialization

```sh
npm ci
npm run cms:types
npm run cms:importmap
npm run cms:migrate
npm run dev
```

Configure a development database before migration. Open the site at
`http://localhost:3000` and the dashboard at `/admin`. On Windows, `npm.cmd` can
be used if PowerShell blocks `npm.ps1`.

For a new database only, run `npm run cms:bootstrap` after migrations. It creates
the first administrator if none exists, requiring a password of at least 16
characters, and imports missing product slugs. Existing products are not
overwritten. Seed products begin with zero stock and unconfirmed prices.

An inherited database already contains users and catalog data. Obtain a valid
administrator account rather than expecting bootstrap to reset its password.
Public creation of the initial administrator is blocked.

## 5. Data model and access rules

- **Users:** authenticated dashboard users. The project does not implement a
  granular multi-role permissions system.
- **Media:** public product images; write operations require authentication.
  Local file storage is disabled. Missing R2 configuration blocks uploads.
- **Products:** unique slug, category, gram weight, description, notes, optional
  price in RON, physical stock, reserved quantity, image, and visibility flag.
  Product deletion is blocked; hide discontinued products with `active=false`.
- **Orders:** immutable financial/product snapshots, customer information,
  payment state, fulfillment state, Stripe identifiers, and order type.
  Financial changes are handled by server services, not ordinary admin edits.

The storefront explicitly filters active products and maps an allowlist of
public fields. Payload's Local API may bypass collection access rules; preserve
this filtering when changing server-side catalog code.

Without CMS configuration, a presentation catalog is available. Once configured,
database failures propagate rather than substituting stale catalog prices.
The public catalog query currently limits results to 1,000 products.

## 6. Money, stock, and payment invariants

Product `price` uses RON. Orders store `totalBani`, `shippingBani`, and
`unitPriceBani` as integer bani, matching Stripe. The dashboard displays these
values in RON. Use the shared conversion/validation helpers; do not accept prices
or totals supplied by the customer browser.

`stock` is physical inventory, including reserved units. `reserved` is inventory
held for pending stock payments. Sellable inventory is `stock - reserved`.

Stock reservation uses conditional SQL updates inside a transaction. Confirmation
deducts physical stock and releases its reservation atomically. Confirmed expiry
or cancellation releases reservations without deducting stock. Product locks
are acquired in ID order, and order advisory locks serialize retries across
application instances. Pass the transaction request through Payload Local API
writes so they use the same connection as raw SQL.

Two PostgreSQL constraints enforce valid stock/reservation quantities and
positive prices with at most two decimals: `products_inventory_valid` and
`products_price_valid`. Application hooks also protect reserved stock during
admin edits; bulk product edits are blocked. Do not remove these safeguards.

### Stock checkout

`POST /api/checkout` calls `createCheckout()` in `src/lib/commerce.ts`.
The server validates the cart, reserves stock, stores the order snapshot, and
creates a Stripe Checkout session. A cart fingerprint rejects altered submissions
using the same order key. The order reference is the Stripe idempotency key.
Stock reservations expire after approximately 35 minutes.

`applySession()` is the shared payment reconciliation function. Both the Stripe
webhook and `/comanda` result page call it. It verifies session identity, currency,
amount, and order state before committing payment and inventory changes. Repeated
payment notifications do not deduct stock again. Customer name, email, phone,
and delivery address are copied from Stripe when provided; existing values are
retained otherwise.

### Made-to-order checkout

`POST /api/orders/request` calls `createProductionRequest()`. Products without
stock or confirmed prices can be requested without immediate payment. A mixed
cart follows this flow in its entirety. The request stores customer contact
details and starts with `orderType=production`, `status=requested`.

An authenticated administrator confirms unit prices and shipping through
`POST /api/orders/payment-link`, which calls `generateProductionPayment()`.
The quote and payment attempt are persisted before Stripe session creation.
Pending quotes are frozen; retries reuse the same attempt and active link.
The Stripe key includes the order reference, production flow, and attempt.
Links expire after approximately 23 hours. Regeneration requires confirmed
expiry or a definitive creation failure; ambiguous network errors are retryable.

The administrator copies and sends the link manually. It is not emailed
automatically. Paid production orders use `applySession()` but never reserve or
deduct physical stock, including mixed carts. The server blocks fulfillment
changes before payment. Old expiry notifications from replaced links are ignored;
conflicting paid sessions are rejected.

### States and webhook configuration

Payment states are `requested`, `pending`, `paid`, `expired`, and `failed`.
Fulfillment states are `new`, `processing`, `shipped`, and `delivered`.
Payment state and fulfillment state are separate concerns.

Stripe should send `checkout.session.completed` and `checkout.session.expired`
to `/api/stripe/webhook`. The route verifies the signature against the raw
request body. Test and live webhook endpoints have different secrets. Local
forwarding through Stripe CLI also supplies its own signing secret.

Expiry is reconciled by webhook and opportunistically during commerce requests.
There is no dedicated scheduled reconciliation worker. Network failures should
be retried/reconciled; do not manually mark an order paid or release a reservation
without checking its actual Stripe session.

## 7. Schema migrations

Schema push is disabled by default in both development and production. It can
remove custom SQL constraints; enable it only on a disposable local database.
Never rewrite an applied migration or run a database reset against shared data.

For each change: generate a migration with `npm run cms:migrate:create`, inspect
its SQL and rollback, test on a copy, preserve a backup, then run
`npm run cms:migrate` against the intended database before publishing compatible
application code. Keep the ordered registry in `src/migrations/index.ts` aligned
with the migration files. Changes to generated types/import maps are committed
with the code that requires them.

The historical development schema-push issue was repaired on 5 October 2026:
production-order fields were added, inventory constraints were restored, and
the `dev` marker was removed after data verification. This is completed recovery
work, not a step that must be repeated on every deployment.

`npm run cms:migrate:verify` is a guarded recovery verifier for an existing clone:
it reads `.env`, refuses the main endpoint, requires the first four historical
migrations, compares existing-column data hashes, validates inventory constraints,
and clears the clone's `dev` marker only after success. It expects existing data
to remain unchanged; intentional data migrations may need a different verifier.
It does not create a backup or apply migrations to the main database.

Additive migrations usually preserve rows. Column/table deletion, incompatible
type conversion, and some rollbacks may destroy data and require separate review.

## 8. Deployment, backup, and migration to a VPS

On Vercel, configure server environment variables for the correct deployment
environment. Run reviewed migrations once before deploying the application.
`npm run build` produces the production build; `npm run start` serves it locally.
Check the public catalog, authenticated dashboard, R2 upload, and a Stripe test
checkout including webhook delivery before enabling live payments.

Keep database and media backups separately. A Neon branch is useful for testing
or a pre-migration snapshot, but it is not an independent off-provider backup.
Use PostgreSQL `pg_dump`/`pg_restore` for portable backups and practice restoration.
Database backups do not contain the R2 image files. Preserve object keys and
public URLs when copying media.

For a VPS, the application can continue using Neon and R2, or these services can
be moved separately. Enable `NEXT_OUTPUT_STANDALONE=true` before build; deploy
`.next/standalone` together with `.next/static` and `public` at their expected
paths, then start the generated `server.js`. Provide a reverse proxy/TLS,
process management, environment variables, and backups. Update `APP_URL`,
allowed admin origins, media URLs if changed, and the Stripe webhook destination.
Verify migrations, sequences, constraints, image access, and payments after a move.

## 9. Tests and validation

```sh
npm run typecheck
npm run build
```

The database integration suite uses only local PostgreSQL on
`127.0.0.1:55432/makeon_test`. It replaces the database URL and clears that test
database's products/orders. Payment and contact-provider calls are mocked.

```sh
docker run --name makeon-postgres-test -e POSTGRES_PASSWORD=makeon-local-test-only -e POSTGRES_DB=makeon_test -p 127.0.0.1:55432:5432 -d postgres:17-alpine
npm run test:commerce
```

Playwright expects the application to be running at `http://127.0.0.1:3000` and
uses installed Google Chrome. Run `npm run test:e2e`. Browser commerce tests use
mocked catalog/payment responses and do not replace real Stripe end-to-end testing.
Check mobile layouts and reduced motion when changing navigation or animations.

## 10. Operational troubleshooting and current limits

| Symptom | First checks |
| --- | --- |
| Admin action denied | Authentication, collection/field access, exact origin, `APP_URL` and `ADMIN_ALLOWED_ORIGINS` |
| Upload fails | All R2 variables, bucket-scoped token, public URL, accepted image type and 3 MB limit |
| Checkout unavailable | Database/secret, Stripe keys and webhook secret, `APP_URL`, explicit shipping amount |
| Paid order still pending | Stripe webhook delivery/signature, stored session ID, amount/currency match, database errors |
| Stock mismatch | Physical vs reserved stock, open/expired sessions, validated SQL constraints; reconcile rather than overwriting reservations |
| Contact email rejected | Verified sender, recipient, Resend response, test-domain recipient restrictions |
| Migration reports development push | Inspect history/schema and use a clone; do not reset or blindly approve destructive SQL |

Contact requests use Resend and are not stored as a separate lead collection.
Their throttle, and the production-request throttle, are per application instance,
not a shared distributed rate limiter. Add shared infrastructure if needed at scale.

Payload password-recovery email is not configured. Order payment links are sent
manually. Invoice issuance, shipping-label integrations, subscriptions, and
automated refunds are not implemented. The payment flow is designed for the
configured card Checkout path; additional payment methods/events require explicit
handling and tests. Refunds in Stripe do not automatically restore inventory here.

Custom admin styles target Payload class names, including the mobile navigation
overlay and horizontally scrollable tables. Check these after Payload upgrades.
Three.js/GSAP components handle reduced motion and offscreen work; preserve their
cleanup when changing visuals.

For daily shop operations, refer the owner to the
[administration guide](commerce-setup.md). Keep this handover guide updated when
changing payment behavior, schema, providers, or deployment infrastructure.
