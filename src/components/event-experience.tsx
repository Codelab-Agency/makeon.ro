"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, CalendarDays, Check, Coffee, MapPin, Plus, X } from "lucide-react";
import SiteHeader from "./site-header";
import FooterIdentity from "./footer-identity";
import FooterBrands from "./footer-brands";
import LegalFooter from "./legal-footer";
import ContactRequestForm from "./contact-request-form";
import { eventServices } from "@/lib/service-options";

const formats = {
  trailer: { label: "Rulota de cafea", tag: "ÎN AER LIBER", title: "Un loc de întâlnire. Oriunde e evenimentul.", text: "Rulota SwitchMORN aduce cafeaua în mijlocul evenimentului tău. O prezență care atrage privirile și îi adună pe invitați în jurul unei pauze bune.", image: "/images/events/rulota-exterior.webp", alt: "Rulota SwitchMORN Coffee, pregătită de servire la un eveniment în aer liber", features: ["Pentru grădini, curți și spații în aer liber", "Amplasare și acces stabilite cu organizatorul", "Meniu și ritm de servire adaptate invitaților"], service: eventServices.trailer },
  bar: { label: "Barul de interior", tag: "COFFEE CORNER", title: "Cafeaua bună își găsește locul la tine.", text: "Un bar mobil care se integrează în spațiul evenimentului. Potrivit pentru întâlniri de companie, recepții și petreceri la interior, cu o configurație aleasă împreună.", image: "/images/events/bar-mobil-makeon.webp", alt: "Barul mobil SwitchMORN Coffee amenajat la un eveniment de interior", features: ["Configurație adaptată spațiului disponibil", "Aparatură și meniu discutate înainte de eveniment", "Un punct de servire pentru pauzele invitaților"], service: eventServices.bar },
};
const questions = [
  ["Ce trebuie să vă spun pentru o ofertă?", "Data, localitatea, tipul evenimentului și numărul aproximativ de invitați. Ne ajută și câteva detalii despre spațiu și intervalul în care dorești servirea."],
  ["Ce include serviciul?", "Formatul ales, aparatura, meniul, durata servirii și celelalte servicii se stabilesc în oferta personalizată. Confirmăm împreună detaliile, astfel încât să știi exact ce primești."],
  ["De ce spațiu și utilități aveți nevoie?", "Cerințele depind de rulotă sau de configurația barului. Discutăm accesul, suprafața de amplasare și alimentarea electrică înainte de confirmare. Pentru exterior, stabilim și o variantă în caz de vreme nefavorabilă."],
  ["Cum se confirmă disponibilitatea?", "Ne trimiți solicitarea, verificăm data și logistica, apoi îți comunicăm oferta și condițiile de rezervare. Completarea formularului nu reprezintă o rezervare confirmată."],
];

export default function EventExperience() {
  const [format, setFormat] = useState<keyof typeof formats>("trailer");
  const [opened, setOpened] = useState(false);
  const [interest, setInterest] = useState<string>(eventServices.trailer);
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const data = formats[format];
  const offer = (selection: string = data.service) => { setInterest(selection); setOpened(true); };
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const paint = () => {
      frame = 0;
      if (!motion.matches || document.hidden || dialog.current?.open) return;
      const hero = node.querySelector<HTMLElement>(".occasion-hero");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0) return;
      hero.style.setProperty("--occasion-travel", `${Math.min(36, Math.max(0, -rect.top * .08))}px`);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const setup = () => {
      observer?.disconnect(); node.dataset.motion = String(motion.matches);
      node.querySelector<HTMLElement>(".occasion-hero")?.style.removeProperty("--occasion-travel");
      if (!motion.matches) return;
      observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.visible = "true"; observer?.unobserve(entry.target); } }), { threshold: .12 });
      node.querySelectorAll(".occasion-reveal").forEach(el => observer?.observe(el));
    };
    setup(); motion.addEventListener("change", setup); window.addEventListener("scroll", scroll, { passive: true });
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); motion.removeEventListener("change", setup); window.removeEventListener("scroll", scroll); };
  }, []);
  useEffect(() => {
    const el = dialog.current;
    if (!opened || !el) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    el.showModal(); document.body.style.overflow = "hidden";
    return () => { el.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, [opened]);

  return <div ref={root} className="site world-coffee occasion-page">
    <SiteHeader onOffer={() => offer()} />
    <main>
      <section className="occasion-hero" aria-labelledby="occasion-title">
        <div className="occasion-hero-image"><Image src="/images/events/rulota-makeon.webp" alt="Rulota SwitchMORN Coffee seara, sub lumini calde, la un eveniment" fill priority sizes="100vw" /></div>
        <div className="occasion-hero-copy"><p className="occasion-eyebrow">SWITCHMORN COFFEE / EVENIMENTUL TĂU</p><h1 id="occasion-title"><span>Cafea bună.</span><span>Momente <em>memorabile.</em></span></h1><p>O rulotă în aer liber. Un bar la interior. Aceeași plăcere de a aduna oamenii în jurul unei cafele bune.</p><div className="occasion-actions"><button className="primary-button" onClick={() => offer()}>Hai să vorbim despre eveniment <ArrowUpRight size={18} /></button><a href="#formate">Alege formatul <ArrowDown size={16} /></a></div></div>
        <div className="occasion-hero-bottom"><span><Coffee size={18} /> CAFEAUA CARE ADUCE OAMENII ÎMPREUNĂ</span><span>RULOTĂ / BAR MOBIL</span></div>
      </section>

      <section className="occasion-intro occasion-section occasion-reveal"><p className="occasion-eyebrow">MAI MULT DECÂT O PAUZĂ</p><div><h2>Tu creezi ocazia.<br /><em>Noi aducem cafeaua.</em></h2><p>La o petrecere privată, o întâlnire de companie sau o recepție, cafeaua creează un loc în care conversațiile încep firesc. Alegem împreună formatul, meniul și felul în care ne integrăm în evenimentul tău.</p></div><div className="occasion-contexts"><span>Întâlniri de companie</span><span>Petreceri private</span><span>Recepții & lansări</span></div></section>

      <section className="occasion-formats occasion-section" id="formate" aria-labelledby="format-title">
        <div className="occasion-format-heading occasion-reveal"><div><p className="occasion-eyebrow">DOUĂ FORMATE. ACELAȘI GUST.</p><h2 id="format-title">Unde ne întâlnim?</h2></div><div className="occasion-format-switch" role="group" aria-label="Alege formatul evenimentului">{(Object.keys(formats) as Array<keyof typeof formats>).map(value => <button key={value} aria-pressed={format === value} onClick={() => setFormat(value)}>{formats[value].label}<ArrowUpRight size={16} aria-hidden="true" /></button>)}</div></div>
        <div className={`occasion-format-layout format-${format}`}>
          <div className="occasion-format-photo" key={format}><Image src={data.image} alt={data.alt} fill sizes="(max-width: 700px) 90vw, 58vw" /><span>{data.tag}</span></div>
          <div className="occasion-format-copy"><span className="occasion-format-number" aria-hidden="true">{format === "trailer" ? "01" : "02"}</span><h3>{data.title}</h3><p>{data.text}</p><ul>{data.features.map(feature => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul><button className="text-link" onClick={() => offer(data.service)}>Solicită ofertă pentru {format === "trailer" ? "rulotă" : "barul mobil"} <ArrowUpRight size={18} /></button></div>
        </div>
      </section>

      <section className="occasion-planning occasion-section" aria-labelledby="planning-title"><div className="occasion-reveal"><p className="occasion-eyebrow">BINE ORGANIZAT, DE LA PRIMA DISCUȚIE</p><h2 id="planning-title">Detaliile fac diferența.</h2><p className="occasion-planning-lead">Ne ocupăm de configurația de cafea. Împreună, punem la punct ce ține de spațiu și program.</p></div><div className="occasion-steps">{[
        { icon: CalendarDays, title: "Data & invitații", text: "Ne spui când are loc evenimentul, câți invitați estimezi și în ce interval vrei să servim cafeaua." },
        { icon: MapPin, title: "Locul & formatul", text: "Verificăm spațiul, accesul și utilitățile necesare. Alegem rulota sau barul, în funcție de locație." },
        { icon: Coffee, title: "Meniul & oferta", text: "Stabilim băuturile, configurația și serviciile. Primești o ofertă personalizată, cu detaliile și condițiile de rezervare." },
      ].map(({ icon: Icon, title, text }, i) => <article className="occasion-reveal" key={title}><div><Icon size={22} strokeWidth={1.3} /><span>0{i + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="occasion-questions occasion-section occasion-reveal" aria-labelledby="questions-title"><div><p className="occasion-eyebrow">ÎNAINTE SĂ NE VEDEM</p><h2 id="questions-title">Câteva lucruri<br />de pus la punct.</h2></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>

      <section className="occasion-closing occasion-section occasion-reveal"><p className="occasion-eyebrow">URMĂTORUL MOMENT BUN ÎNCEPE AICI</p><h2>Evenimentul tău.<br /><em>Cafeaua noastră.</em></h2><p>Spune-ne data, localitatea și numărul de invitați.<br />Noi verificăm disponibilitatea și pregătim propunerea.</p><button className="primary-button" onClick={() => offer()}>Povestește-ne ce pregătești <ArrowUpRight size={18} /></button><a href="tel:+40744524728">sau sună-ne: +40 744 524 728</a></section>
    </main>
    <footer className="footer"><div className="footer-top"><FooterIdentity /><FooterBrands /><a className="footer-phone" href="tel:+40744524728">Hai să vorbim <ArrowUpRight size={18} /><span>+40 744 524 728</span></a></div><LegalFooter /><div className="footer-bottom"><span>© {new Date().getFullYear()} Makeon. Toate drepturile rezervate.</span><a href="#occasion-title">Înapoi sus ↑</a></div></footer>
    <dialog ref={dialog} className="contact-dialog" aria-labelledby="event-dialog-title" onCancel={() => setOpened(false)} onClick={event => { if (event.target === event.currentTarget) setOpened(false); }}><div className="dialog-content"><button className="dialog-close" aria-label="Închide formularul" onClick={() => setOpened(false)}><X size={22} /></button><div className="dialog-intro"><p className="eyebrow">EVENIMENTUL TĂU / MAKEON</p><h2 id="event-dialog-title">Hai să pregătim<br />o pauză memorabilă.</h2><p>Adaugă data, localitatea și detaliile spațiului în mesaj. Verificăm disponibilitatea și revenim cu oferta.</p><a className="dialog-phone" href="tel:+40744524728">+40 744 524 728</a><a className="text-link" href="mailto:info@makeon.ro">info@makeon.ro <ArrowUpRight size={15} /></a></div><div className="dialog-form-panel">{opened && <ContactRequestForm interest={interest} onInterestChange={setInterest} />}</div></div></dialog>
  </div>;
}
