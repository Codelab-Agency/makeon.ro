# Makeon

Site de prezentare și magazin online pentru Makeon, care reunește **SwitchMorn Coffee** și **Vero Aqua**. Platforma prezintă oferta de cafea, apă și echipamente pentru companii și include un dashboard pentru administrarea magazinului.

## Site-ul

Experiența vizuală alternează între cafea și apă, cu o scenă 3D în hero, tranziții animate și accente cromatice sincronizate în pagină. Secțiunile prezintă brandurile, produsele, serviciile și ofertele pentru companii.

Interfața este adaptată pentru desktop și telefon. Animațiile respectă preferința de mișcare redusă, iar scenele 3D au o variantă de rezervă pentru dispozitivele fără WebGL.

Solicitările de ofertă sunt trimise prin e-mail folosind Resend. Telefonul și WhatsApp sunt disponibile ca alternative de contact.

## Magazinul

Catalogul de cafea include pagini individuale de produs, fotografii, gramaje, note de degustare și informații despre origine. Produsele pot fi căutate, filtrate și sortate. Pentru cafeaua măcinată, clientul poate alege măcinarea pentru ibric, moka sau espresso.

Coșul păstrează selecția între pagini și permite modificarea cantităților și eliminarea produselor. Magazinul are două fluxuri de comandă:

- **Produse disponibile:** plată prin Stripe Checkout, cu rezervarea stocului și actualizarea lui după confirmarea plății.
- **Comenzi la cerere:** solicitare înregistrată în dashboard, confirmare telefonică și link de plată generat de administrator. Coșurile care includ produse fără stoc sau fără preț confirmat urmează integral acest flux.

Plățile sunt procesate idempotent, iar rezervările și actualizările stocului sunt protejate prin tranzacții și constrângeri în PostgreSQL. Comenzile la cerere nu afectează stocul fizic și pot fi trecute în pregătire după confirmarea plății.

## Administrare

Dashboardul de la `/admin` permite gestionarea produselor, prețurilor, stocurilor și imaginilor, precum și consultarea comenzilor și actualizarea statusului lor de pregătire și livrare.

Pentru comenzile la cerere, administratorul confirmă prețurile și transportul, generează linkul Stripe și îl transmite clientului. Datele clientului și adresa de livrare sunt preluate din sesiunea de plată atunci când sunt furnizate de Stripe.

## Tehnologii

| Componentă | Tehnologie |
| --- | --- |
| Aplicație | Next.js, React, TypeScript |
| Administrare | Payload CMS |
| Bază de date | PostgreSQL, găzduit în Neon |
| Imagini | Cloudflare R2 |
| Plăți | Stripe Checkout |
| E-mail | Resend |
| Animații | Three.js, GSAP, SVG și CSS |
| Găzduire | Vercel |

Aplicația, baza de date și stocarea imaginilor sunt separate, astfel încât infrastructura poate fi mutată fără refacerea magazinului. Modificările schemei bazei de date sunt gestionate prin migrări versionate.

## Documentație

- [Ghid de administrare](docs/commerce-setup.md) — utilizarea magazinului și gestionarea comenzilor.
- [Documentație tehnică](docs/commerce-development.md) — configurare, infrastructură, migrări și verificări.
