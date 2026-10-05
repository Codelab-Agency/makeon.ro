# Makeon: Payload + Neon + Cloudflare R2 + Stripe

## Safe database changes

Schema push is disabled by default, including during `npm run dev`. It can
remove custom PostgreSQL constraints and bypass migration history. Set
`PAYLOAD_DB_PUSH=true` only for disposable local databases; the integration
suite enables it only after replacing the connection with its local test URL.

For an existing Neon database that contains a `dev` migration marker:

1. Stop local development processes connected to the main database. Create a
   Neon branch with the current schema and data, and retain a separate backup
   branch untouched until the production change has been verified.
2. Save the test branch connection as `MIGRATION_TEST_DATABASE_URL` in the local
   environment. Keep `DATABASE_URL` pointing at the main branch. Never commit
   either connection or share credentials in chat.
3. Check migration history and the actual schema on the clone before applying
   pending migrations. The `dev` marker is a warning, not proof that every
   migration has already run. Never mark pending migrations as applied without
   checking their effects.
   Run `npm run cms:migrate:verify` from the project root (reads `.env`). This
   command refuses the main endpoint, applies migrations only to the clone,
   compares hashes of every pre-existing table/column, validates constraints,
   and removes the clone's `dev` marker only after successful verification.
4. Test migrations against the clone with schema push disabled. Compare row
   counts and existing business data before/after. Check the validated
   `products_inventory_valid` and `products_price_valid` constraints and the
   order/payment fields. The constraint repair migration rejects invalid
   existing data rather than changing or deleting it.
5. Only after clone validation and backup, apply the reviewed pending migrations
   to the main branch during a maintenance window. Remove only the `dev`
   migration marker once the schema and migration history have been reconciled.
   Preserve all normal migration records.

Adding columns normally preserves rows. Dropping a column/table, changing a
type, or running a rollback may discard data; inspect every generated migration
and test on a clone first. Never use `migrate:fresh` or reset a shared database.

## Made-to-order flow

`POST /api/orders/request` saves a validated customer request without stock reservations or Stripe calls. The UUID and request fingerprint prevent duplicate orders and reject changed submissions using the same key. Mixed carts use this flow as a whole. `orderType=production` is distinct from ordinary reserved-stock checkout.

Authenticated administrators use `POST /api/orders/payment-link` to confirm unit prices and shipping in RON. The quote and payment attempt are committed before session creation; retries reuse the immutable quote and Stripe key. An active session is reused. Regeneration is allowed after confirmed expiration or a definitive creation failure. Links expire after approximately 23 hours and are copied/sent manually.

The shared Stripe reconciliation verifies session identity, amount and currency. Production orders never deduct inventory. Fulfillment updates before payment are rejected server-side. Old expiration webhooks are ignored after regeneration; conflicting paid sessions still fail reconciliation. The public request throttle is best-effort per instance, not distributed across Vercel.

Apply `20261005_113310_production_orders` before deploying this flow. Its rollback refuses to erase existing production orders. The integration suite exercises the stock and production flows against isolated PostgreSQL with simulated Stripe.

Aplicația și `/admin` rulează în același Next.js. PostgreSQL și imaginile sunt externe, astfel încât mutarea aplicației pe VPS nu schimbă produsele sau fișierele. Nu există chei publice pentru accesul la baza de date, R2 ori Stripe.

## 1. Neon

Creează un proiect PostgreSQL în UE în contul clientului. Folosește o bază/branch separată pentru dezvoltare și preview, fără datele clienților. Copiază URL-ul de conexiune cu pooling și SSL în `DATABASE_URL`. Aceeași variabilă funcționează cu un PostgreSQL propriu pe VPS.

## 2. R2

Creează un bucket pentru fotografiile produselor. Configurează un domeniu public precum `media.makeon.ro` și un token S3 cu acces doar la acel bucket. Completează `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`. Endpointul este de forma `https://<account-id>.r2.cloudflarestorage.com`; domeniul public este separat de endpointul S3. Contul trebuie să fie al clientului.

Payload acceptă JPEG, PNG, WebP și AVIF până la 3 MB (sub limita cererilor Vercel) și creează o variantă pentru carduri. Dacă R2 nu este configurat, încărcările sunt blocate: stocarea locală este dezactivată, inclusiv pe Vercel. Nu pune documente de comandă sau date personale în bucketul public.

## 3. Inițializare

Copiază `.env.example` în `.env.local` și completează valorile. Generează `PAYLOAD_SECRET` cu minimum 32 de octeți aleatori (de exemplu `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Setează `APP_URL` la originea aplicației, fără slash final.

Instalare și dezvoltare:

```
npm install
npm run cms:types
npm run cms:importmap
npm run cms:migrate
npm run cms:bootstrap
npm run dev
```

Bootstrapul cere `ADMIN_EMAIL` și `ADMIN_PASSWORD` de minimum 16 caractere doar dacă nu există administrator. Crearea publică a primului administrator este blocată. Elimină parola de bootstrap din mediu după rulare. La `/admin`, adaugă prețurile reale în RON, cu TVA inclus, stocul fizic și fotografiile. Importul păstrează prețurile neconfirmate goale și stocul la zero; rerularea nu suprascrie produsele existente.

## 4. Stripe

Începe cu chei TEST. Setează `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plus `SHIPPING_PRICE_BANI` (integer; 2000 înseamnă 20 RON, 0 înseamnă transport gratuit). Transportul nu se presupune automat.

Webhook: `https://<domeniu>/api/stripe/webhook`, evenimente `checkout.session.completed` și `checkout.session.expired`. Pentru local se poate folosi Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Folosește secretul webhook afișat de CLI pentru local; cel din Dashboard pentru producție.

Plata folosește Stripe Checkout în RON, carduri și livrare în România. Serverul citește prețurile din PostgreSQL, nu din browser. Prețurile, denumirile și cantitățile sunt salvate ca snapshot al comenzii. Stocul este rezervat 35 de minute; după confirmarea plății se scade stocul fizic și se eliberează rezervarea. Webhookul și pagina de confirmare procesează idempotent aceeași comandă. La expirare se eliberează rezervarea. La următoarea încercare de checkout sunt reconciliate și rezervările expirate pentru care webhookul nu a ajuns. Un abandon nu golește coșul.

Dashboardul permite vizualizarea comenzilor și plăților; starea financiară nu este editabilă manual. Activează chitanțele prin email în Stripe dacă clientul le dorește. Payload nu are încă un furnizor de email pentru recuperarea parolelor; administratorul poate actualiza parola din cont sau prin intervenție tehnică. Facturarea, AWB, rambursările automatizate și abonamentele recurente nu sunt incluse.

## 5. Producție / Vercel

Configurează variabilele server în Vercel, separat pentru Production și Preview. Nu pune secrete în `NEXT_PUBLIC_*`. Planul Vercel pentru producția comercială trebuie ales conform condițiilor furnizorului.

Schema se actualizează prin migrări, nu prin schema push în producție:

```
npm run cms:migrate
npm run build
```

Rulează migrările o singură dată pe baza corectă înainte de publicare. După aceea rulează bootstrapul pe baza de producție dintr-un mediu local securizat. Nu activa plata live până nu verifici o comandă Stripe TEST, expirarea, stocurile, accesul administratorului și încărcarea/ștergerea unei imagini R2.

Fără `DATABASE_URL` și `PAYLOAD_SECRET`, site-ul păstrează catalogul de prezentare, `/admin` explică configurarea, iar API-urile de administrare/plată răspund cu 503. După conectarea bazei, erorile nu sunt mascate prin produse/prețuri statice; checkoutul este oprit când catalogul nu poate fi actualizat.

## 6. Mutarea pe VPS

Publică aplicația Next.js și aceleași variabile; pentru build standalone setează `NEXT_OUTPUT_STANDALONE=true` și pornește `.next/standalone/server.js`. Păstrează Neon și R2 pentru o mutare fără transfer de date. Pentru mutarea PostgreSQL folosește `pg_dump` / `pg_restore`, apoi schimbă `DATABASE_URL` și verifică secvențele și migrările. Pentru mutarea fișierelor copiază bucketul și schimbă adaptorul S3/domeniul public; păstrează denumirile fișierelor. Actualizează `APP_URL` și webhookul Stripe dacă domeniul se schimbă. Backupurile bazei și imaginilor trebuie ținute separat de server.

## 7. Verificări locale

`npm run test:commerce` folosește exclusiv baza locală `makeon_test`, pe portul 55432, și șterge produsele/comenzile din acea bază la început. Stripe este simulat; testele nu efectuează plăți reale. Pentru un mediu de test separat:

```
docker run --name makeon-postgres-test -e POSTGRES_PASSWORD=makeon-local-test-only -e POSTGRES_DB=makeon_test -p 127.0.0.1:55432:5432 -d postgres:17-alpine
npm run test:commerce
```

Cu aplicația pornită pe portul 3000, `npm run test:e2e` verifică interfața în Chrome. Testele de checkout din browser folosesc un catalog și răspunsuri API simulate.

Revenirea prin butonul de anulare Stripe eliberează rezervarea și păstrează coșul. Rezervările expirate sunt reconciliate și la încărcarea catalogului, pentru a recupera stocul dacă webhookul de expirare nu a ajuns.

## 8. Concurență și idempotență

Rezervarea folosește un UPDATE condiționat în PostgreSQL (`stock - reserved >= cantitate`), cu blocare pe rând. Toate produsele unei comenzi sunt rezervate într-o singură tranzacție; dacă unul nu este disponibil, întreaga operație este anulată. Cantitățile se validează și în serviciul server, nu doar în ruta HTTP.

Referința comenzii este unică și este folosită drept cheie de idempotență Stripe. O blocare tranzacțională pe comandă sincronizează retry-urile, crearea/salvarea sesiunii Stripe și procesarea webhookurilor, inclusiv între instanțe Vercel. Retry-ul reia aceeași sesiune; nu creează o comandă sau o rezervare nouă. Erorile de rețea păstrează rezervarea pentru recuperare. Comportamentul cheii Stripe este descris în [documentația oficială](https://docs.stripe.com/api/idempotent_requests).

Confirmarea plății verifică sesiunea, suma și moneda, apoi scade stocul și marchează comanda plătită în aceeași tranzacție. Livrarea repetată sau simultană a aceleiași confirmări nu scade stocul din nou. O eroare de salvare anulează și modificarea de stoc. Constrângerile bazei blochează stocul negativ și scăderea stocului fizic sub rezervările active; migrațiile trebuie aplicate înainte de activarea plăților.

Editarea unui produs în dashboard blochează rândul înainte de citirea documentului și păstrează rezervările controlate de server. Editările în masă ale produselor sunt blocate; produsele se editează individual pentru a păstra această protecție.

## 9. Originea dashboardului

Dashboardul trimite cererile API la aceeași origine unde este deschis, prin URL-uri relative. `APP_URL` rămâne adresa canonică a site-ului și o origine permisă pentru autentificarea cu cookie. Dacă adminul se testează local în timp ce `APP_URL` indică domeniul public, setează `ADMIN_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000` în mediul local. Pentru acces de pe telefon, adaugă originea LAN exactă, inclusiv protocolul și portul. În producție, permite doar originile folosite efectiv de administrator; nu folosi wildcarduri. După modificări, repornește aplicația.

Imaginea se salvează din butonul „Salvează” din bara de sus a formularului sau a panoului deschis din produs. Selectează fișierul și completează descrierea imaginii înainte de salvare.
