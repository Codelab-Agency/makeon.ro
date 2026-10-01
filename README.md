# Makeon

Concept de site pentru umbrela Makeon: SwitchMorn Coffee și Vero Aqua. Next.js App Router, TypeScript, Three.js și GSAP.

## Pornire

```sh
npm install
npm run dev
```

Pe Windows, dacă PowerShell blochează `npm.ps1`, folosește `npm.cmd install` și `npm.cmd run dev`. Deschide http://localhost:3000.

## Verificare

```sh
npm run typecheck
npm run build
```

Cu site-ul pornit local și Google Chrome instalat: `npm run test:e2e` verifică switch-ul, dialogul și navigația pe mobil. `npm run preview:images` salvează capturi desktop și mobil în `artifacts/`.

Switch-ul din hero declanșează o metamorfoză Three.js între un bob de cafea prăjit și o picătură de apă albastră. Bobul are o formă sculptată cu șanț central și o suprafață procedurală; doi boabe mici devin picături satelit. Un ShaderMaterial interpolează forma, textura și culorile; particulele de aromă se transformă în orbite în jurul apei. Scena răspunde mișcării cursorului, iar unde concentrice pulsează la bază. GSAP coordonează metamorfoza de 1,8 secunde, expansiunea particulelor, tranziția circulară peste ecran și intrarea titlurilor.

Ambele switch-uri sincronizează brandul, produsele, accentele întregii pagini și întrebările frecvente. Preferința `prefers-reduced-motion` păstrează scena statică și schimbă starea imediat. Scena se oprește din randare când este în afara ecranului sau pagina este ascunsă; resursele WebGL se eliberează la demontare. Există un fallback CSS când WebGL nu poate fi inițializat. Dialogul accesibil pregătește o discuție telefonică, fără a transmite date către un server.

## Materiale și conținut

Conținutul pornește de la pliantele furnizate. Oferta Vero Aqua este 31 € + TVA/lună/aparat, pe 36 luni; totalul din pliant este 1.116 € + TVA. Numărul de telefon din pliant este +40 744 524 728. Oferta și disponibilitatea trebuie reconfirmate înainte de publicare.

Ilustrațiile aparatelor, filtrelor și ambalajelor sunt concepte, nu fotografii sau reproduceri exacte ale produselor. Siglele sunt reprezentări tipografice provizorii. Înainte de lansare sunt necesare fotografiile și siglele originale, catalogul confirmat, informațiile legale și o integrare reală pentru solicitări de ofertă, dacă se dorește.

Vizualul static al primei direcții este păstrat în `public/images/makeon-hero.png`, cu promptul în `public/images/README.md`. Hero-ul actual folosește scena Three.js din `src/components/element-scene.tsx`.

Fonturile variabile Manrope și DM Sans sunt găzduite local prin Fontsource, inclusiv caracterele românești. Site-ul nu necesită cereri către Google Fonts.

## Magazin cafea

`/cafea` include 17 produse extrase din catalog: Intense, Noblesse, Armonia, Exotic Blend, Etiopia, Brazilia, Columbia, Guatemala, India, Costa Rica, Kenia, Indonezia, Organic, Decaff, Solubilă Peru BIO, Chicory și Kopi Luwak. Fiecare are pagină proprie la `/cafea/[slug]`, gramajul din catalog, note aromatice și, unde sunt documentate, origine, altitudine, varietate, procesare și prăjire. Sunt disponibile filtre pe categorie, căutare și sortare alfabetică.

Produsele măcinate permit alegerea măcinării pentru ibric, moka sau espresso. Coșul reține produsul, măcinarea și cantitatea în `localStorage`; variantele se păstrează separat. Se pot modifica cantitățile, elimina produse și copia selecția pentru solicitarea ofertei. Coșul funcționează între homepage, magazin și paginile produselor.

Prețurile sunt `null` în `src/lib/coffee-catalog.ts`, fiindcă nu au fost furnizate. Interfața afișează „Preț la cerere” și nu generează prețuri sau totaluri fictive. După completarea câmpurilor `price` în RON cu TVA inclus, prețurile și totalul produselor se afișează automat. Plata online, transmiterea comenzilor, livrarea și stocurile nu sunt încă integrate. Solicitarea actuală este telefonică; copierea selecției nu trimite o comandă.

Oferta de 31 € + TVA/lună este exclusiv pentru apă Vero Aqua. Cardul abonamentului de cafea afișează „Ofertă personalizată”; prețul și serviciile rămân de confirmat cu clientul.

Ambalajele magazinului sunt reprezentări construite în CSS, inspirate de catalog, și nu fotografii exacte ale produselor. Paginile de catalog originale sunt păstrate în `public/catalog/` și sunt accesibile din fiecare pagină de produs. Nu au fost incluse în descrieri afirmațiile de sănătate din catalog; pentru Chicory este afișată mențiunea „Conține gluten”.

## Servicii și animații în pagină

Serviciile sunt adaptate din https://makeon.ro/ (consultat la 1 octombrie 2026), fără preluarea designului: prăjire în loturi mici, blenduri personalizate, profiluri pentru espresso/V60/Chemex/AeroPress, cafea de probă, consultanță pentru filtrare, instalare, mentenanță și schimb de filtre. Cafeaua de probă este o solicitare de comandă, fără promisiunea unei mostre gratuite. Costurile serviciilor generale de filtrare se stabilesc în ofertă; nu sunt confundate cu abonamentul Vero Aqua. Sursa HTML este arhivată local în `artifacts/research/makeon-home.html`.

Secțiunea `#servicii` include patru taburi pentru fiecare lume, utilizabile și cu săgețile tastaturii. GSAP animă tamburul prăjitoriei, boabele și aburul, respectiv fluxul și bulele circuitului de filtrare. Graficele sunt ilustrații, nu scheme tehnice ale aparatelor. Curba procesului se trasează odată cu scrollul, ambalajele și cartușele plutesc, paharul are unde animate, iar pașii colaborării au o linie de progres. Cardurile magazinului intră la scroll și ambalajele se ridică la hover. Animațiile continue GSAP sunt oprite în afara ecranului și în file ascunse; preferința de reducere a mișcării dezactivează aceste efecte.

Dialogul include serviciul selectat și permite deschiderea WhatsApp cu mesaj pregătit. Mesajul nu este trimis automat. Telefonul, WhatsApp și `contact@makeon.ro` provin din site-ul existent.

Dropdown-urile pentru servicii, dimensiunea echipei, sortare și măcinare folosesc componenta `CustomSelect`: listă proprie, selecție cu tastatura, căutare prin tastare, închidere la click exterior și Escape. Popup-ul se poziționează deasupra sau dedesubt în funcție de spațiu și este redat în dialog atunci când controlul aparține unui dialog. Lista de servicii are 11 opțiuni fixe în `service-options.ts`; butoanele aleg opțiunea relevantă fără să adauge propriul text în listă.

Secțiunea pentru companii are switch Cafea / Apă sincronizat cu celelalte switch-uri și cu oferta. `BusinessScene` construiește o ceașcă de ceramică, farfurioară, cafea cu cremă, abur și boabe în orbită, respectiv un pahar cu apă și picături. Schimbarea folosește GSAP pentru tranziția dintre obiectele Three.js. Scena răspunde cursorului, se oprește când nu este vizibilă sau fila este ascunsă și respectă preferința de reducere a mișcării.

Animațiile la scroll sunt discrete și integrate în secțiunile existente: parallax de 6–9 px pe vizualurile produselor, mișcare de 7 px pe ilustrațiile serviciilor și o rotație ușoară a ceștii / variație mică a nivelului apei în scena pentru companii. Nu există o secțiune suplimentară sau blocare sticky. Preferința de reducere a mișcării dezactivează aceste efecte.
