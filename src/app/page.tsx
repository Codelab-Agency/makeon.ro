"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Coffee,
  Droplets,
  Check,
  X,
  Leaf,
  Wrench,
  ShieldCheck,
  Plus,
  Minus,
  Phone,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProductScene from "@/components/product-scene";
import dynamic from "next/dynamic";
import CoffeeShop from "@/components/coffee-shop";
import SiteHeader from "@/components/site-header";
import BrandLogo from "@/components/brand-logo";
import Starburst from "@/components/starburst";
import ServiceStudio from "@/components/service-studio";
import PageMotion from "@/components/page-motion";
import CustomSelect from "@/components/custom-select";
import { serviceOptions, normalizeService } from "@/lib/service-options";
const BusinessScene = dynamic(() => import("@/components/business-scene"), {
  ssr: false,
});

const ElementScene = dynamic(() => import("@/components/element-scene"), {
  ssr: false,
});

type World = "coffee" | "water";
const content = {
  coffee: {
    brand: "SWITCHMORN COFFEE",
    eyebrow: "ENERGIE PENTRU FIECARE ZI",
    line: "Zile bune.",
    accent: "Încep cu o cafea.",
    description:
      "Cafea cu personalitate. Aparate pe care te poți baza. Tot ce ai nevoie pentru ritualul preferat al echipei tale, într-un singur loc.",
    cta: "Descoperă cafelele",
    tag: "Cafea bună. Conversații și mai bune.",
    section: "Un ritual mic. Un impact mare.",
    intro:
      "De la prima ceașcă de dimineață la pauza care aduce echipa împreună. Cafea pentru acasă, birou, cafenea sau restaurant. Descoperă soluția potrivită spațiului tău.",
    products: [
      {
        title: "Cafea cu personalitate",
        category: "CAFEA BOABE",
        text: "Intense, Noblesse, Armonia și Exotic Blend. Patru caractere, aceeași pasiune pentru o cafea proaspătă.",
        type: "beans",
      },
      {
        title: "Barista-ul din biroul tău",
        category: "ESPRESSOARE",
        text: "Espressoare automate pentru un espresso intens, un cappuccino fin și fiecare preferință a echipei.",
        type: "coffee",
      },
      {
        title: "Ritualul, fără griji",
        category: "ABONAMENTE PENTRU COMPANII",
        text: "Ofertă personalizată pentru aparatul și cafeaua echipei tale. Prețul și serviciile se confirmă în funcție de nevoile voastre.",
        type: "subscription",
      },
    ],
    faq: [
      [
        "Cum aleg aparatul potrivit pentru biroul meu?",
        "Pornim de la numărul de colegi, consumul zilnic și băuturile preferate. Îți propunem apoi un espressor și o soluție de aprovizionare potrivite echipei tale.",
      ],
      [
        "Ce sortimente de cafea sunt disponibile?",
        "Magazinul include 17 sortimente din catalogul SwitchMorn: blenduri de cafea boabe, cafele de origine măcinate, Organic, Decaff, Solubilă Peru BIO, Chicory și Kopi Luwak. Gramajele, aromele și detaliile fiecărei cafele sunt disponibile pe pagina produsului.",
      ],
      [
        "Pot combina cafeaua cu un abonament de apă?",
        "Da. Makeon reunește SwitchMorn Coffee și Vero Aqua, astfel încât să poți solicita o ofertă comună pentru cafea, apă filtrată și echipamente.",
      ],
      [
        "Cum primesc o ofertă pentru compania mea?",
        "Spune-ne câți oameni sunt în echipă și ce soluții te interesează. Discutăm nevoile spațiului și pregătim o ofertă personalizată.",
      ],
    ],
  },
  water: {
    brand: "VERO AQUA",
    eyebrow: "HIDRATARE, ZI DE ZI",
    line: "Apă pură.",
    accent: "O grijă în minus.",
    description:
      "Apă filtrată, mereu la îndemână. Aparate moderne și filtrare adaptată spațiului tău. Abonamentul Vero Aqua include filtre și mentenanță. O alegere simplă pentru oamenii din echipa ta.",
    cta: "Descoperă lumea apei",
    tag: "Mai multă apă. Mai puțin plastic.",
    section: "Un gest simplu. O zi mai bună.",
    intro:
      "Apă rece, caldă sau la temperatura camerei. Soluții de filtrare pentru birouri, spații comerciale și echipe de toate dimensiunile.",
    products: [
      {
        title: "Apă bună, la un gest distanță",
        category: "APARATE DE APĂ",
        text: "Trei temperaturi, comenzi separate și filtrare în patru stadii cu lampă UV. Gândit pentru biroul tău.",
        type: "water",
      },
      {
        title: "Puritate în fiecare pahar",
        category: "FILTRE & CONSUMABILE",
        text: "Soluții de filtrare pentru aparatele de apă și cafea. Alegem filtrele potrivite echipamentului tău.",
        type: "filters",
      },
      {
        title: "Totul inclus. Fără griji.",
        category: "ABONAMENT VERO AQUA",
        text: "Instalare, mentenanță, igienizare și înlocuirea filtrelor. De la 31 € + TVA / lună, pe 36 de luni.",
        type: "subscription",
      },
    ],
    faq: [
      [
        "Ce include abonamentul Vero Aqua?",
        "Conform ofertei din pliant: aparat nou, instalare și punere în funcțiune, mentenanță periodică, igienizare, înlocuirea filtrelor și asistență tehnică. Prețul este 31 € + TVA/lună, pentru 36 de luni.",
      ],
      [
        "Ce tipuri de apă oferă aparatele?",
        "Modelul din oferta Vero Aqua oferă apă rece, caldă și la temperatura camerei. Are filtrare în patru stadii și lampă UV. Configurația se confirmă în oferta pentru spațiul tău.",
      ],
      [
        "Sunt disponibile și filtre pentru espressoare?",
        "Da. Putem include soluții de filtrare pentru aparatele de apă și pentru cele de cafea. Compatibilitatea filtrului se verifică în funcție de echipamentul existent.",
      ],
      [
        "Există costuri suplimentare de mentenanță?",
        "Oferta prezentată include mentenanța, igienizarea și înlocuirea filtrelor în abonament. Condițiile finale și cerințele de instalare se confirmă înainte de contractare.",
      ],
    ],
  },
};

function Beans() {
  return (
    <div
      className="coffee-bags"
      aria-label="Concepte de ambalaj Intenso, Noblesse și Armonia"
    >
      {["Intense", "Noblesse", "Armonia"].map((name, i) => (
        <div className={`bag bag-${i}`} key={name}>
          <div className="bag-seal" />
          <Coffee size={22} />
          <span>SWITCHMORN</span>
          <small>COFFEE</small>
          <strong>{name}</strong>
          <div className="bag-detail">
            CAFEA BOABE
            <br />
            500 g
          </div>
        </div>
      ))}
    </div>
  );
}

function Filters() {
  return (
    <div className="filters-art" aria-label="Concept de cartușe filtrante">
      <div className="filter-cylinder">
        <span>VERO</span>
        <Droplets />
        <small>AQUA</small>
      </div>
      <div className="filter-cylinder second">
        <span>PURE</span>
        <Droplets />
        <small>FILTER</small>
      </div>
      <div className="filter-ring" />
    </div>
  );
}

export default function Home() {
  const [world, setWorld] = useState<World>("coffee");
  const [transitionId, setTransitionId] = useState(0);
  const activeWorld = useRef<World>("coffee");
  const curtain = useRef<HTMLDivElement>(null);
  const transition = useRef<gsap.core.Timeline | null>(null);
  const [faq, setFaq] = useState<number | null>(0);
  const [modal, setModal] = useState(false);
  const [interest, setInterest] = useState("Cafea + apă");
  const [team, setTeam] = useState("11–30 persoane");
  const [prepared, setPrepared] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scrollAnchor = useRef<{ element: HTMLElement; top: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const data = content[world];

  useLayoutEffect(() => {
    const anchor = scrollAnchor.current;
    const site = root.current;
    if (!anchor || !site) return;
    site.style.overflowAnchor = "none";
    const align = () => {
      if (!anchor.element.isConnected) return;
      const delta = anchor.element.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) > .5) window.scrollTo({ top: window.scrollY + delta, behavior: "instant" });
    };
    align();
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      align();
      secondFrame = requestAnimationFrame(() => {
        align();
        site.style.overflowAnchor = "";
        if (scrollAnchor.current === anchor) scrollAnchor.current = null;
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      site.style.overflowAnchor = "";
    };
  }, [world]);

  useEffect(
    () => () => {
      transition.current?.kill();
    },
    [],
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.from(".hero-reveal", {
          y: 32,
          opacity: 0,
          duration: 1,
          stagger: 0.11,
          ease: "power3.out",
        });
        gsap.from(".hero-art", {
          y: 35,
          opacity: 0,
          duration: 1.3,
          delay: 0.25,
          ease: "power3.out",
        });
        gsap.to(".floating-note", {
          y: -9,
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) =>
          gsap.from(el, {
            y: 35,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          }),
        );
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  useEffect(() => {
    ScrollTrigger.refresh();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".world-copy",
        { opacity: 0, y: 35, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.035,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".hero-world-heading",
        { y: 45, opacity: 0, filter: "blur(12px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power3.out",
        },
      );
    }, root);
    return () => ctx.revert();
  }, [world]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (modal) {
      el.showModal();
      document.body.style.overflow = "hidden";
    } else {
      el.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  function openOffer(selection = "Cafea + apă") {
    setInterest(normalizeService(selection));
    setPrepared(false);
    setModal(true);
  }
  function changeWorld(value: World, source?: HTMLElement) {
    if (activeWorld.current === value) return;
    const localSwitch = source?.closest<HTMLElement>(".business-switch, .mini-switch");
    scrollAnchor.current = localSwitch ? { element: localSwitch, top: localSwitch.getBoundingClientRect().top } : null;
    if (localSwitch && root.current) root.current.style.overflowAnchor = "none";
    const enteringSection = localSwitch?.closest(".reveal");
    if (enteringSection) {
      gsap.killTweensOf(enteringSection);
      gsap.set(enteringSection, { y: 0, opacity: 1 });
    }
    activeWorld.current = value;
    transition.current?.kill();
    setWorld(value);
    setFaq(0);
    setTransitionId((id) => id + 1);
    const el = curtain.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const button =
      source?.closest(".business-switch, .mini-switch, .world-switch") ??
      root.current?.querySelector(".world-switch");
    const rect = button?.getBoundingClientRect();
    const x = rect
      ? Math.round(rect.left + rect.width / 2)
      : window.innerWidth / 2;
    const y = rect
      ? Math.max(0, Math.min(window.innerHeight, rect.top + rect.height / 2))
      : window.innerHeight / 2;
    el.dataset.destination = value;
    transition.current = gsap
      .timeline()
      .set(el, {
        opacity: 0.88,
        clipPath: `circle(0px at ${x}px ${y}px)`,
        visibility: "visible",
      })
      .to(el, {
        clipPath: `circle(${Math.hypot(window.innerWidth, window.innerHeight)}px at ${x}px ${y}px)`,
        duration: 0.85,
        ease: "power3.inOut",
      })
      .to(el, { opacity: 0, duration: 0.65, ease: "power2.out" }, 0.6)
      .set(el, { visibility: "hidden" });
  }

  return (
    <div ref={root} className={`site world-${world}`}>
      <div ref={curtain} className="world-curtain" aria-hidden="true">
        <div className="curtain-current" />
        <span>{world === "coffee" ? "ENERGIE" : "PURITATE"}</span>
      </div>
      <SiteHeader onOffer={() => openOffer()} />

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hero-world-label world-copy">
              {world === "coffee" ? (
                <Coffee size={15} />
              ) : (
                <Droplets size={15} />
              )}{" "}
              {data.brand} <span>/ {world === "coffee" ? "01" : "02"}</span>
            </div>
            <h1 id="hero-title" className="hero-world-heading">
              {world === "coffee" ? "Binele începe" : "Lasă binele"}
              <br />
              <span>{world === "coffee" ? "cu o cafea." : "să curgă."}</span>
              <Starburst className="heading-star" />
            </h1>
            <p className="hero-description world-copy">{data.description}</p>
            <div
              className="world-switch hero-reveal"
              role="group"
              aria-label="Alege lumea Makeon"
            >
              <span className={`switch-slider ${world}`} />
              <button
                onClick={event => changeWorld("coffee", event.currentTarget)}
                aria-label="Lumea cafelei"
                aria-pressed={world === "coffee"}
              >
                <Coffee size={21} />
                <span>
                  Cafea<small>AROMĂ & ENERGIE</small>
                </span>
              </button>
              <button
                onClick={event => changeWorld("water", event.currentTarget)}
                aria-label="Lumea apei"
                aria-pressed={world === "water"}
              >
                <Droplets size={21} />
                <span>
                  Apă<small>PURITATEA APEI</small>
                </span>
              </button>
            </div>
            <p className="switch-hint">
              <span /> Schimbă elementul. Simte transformarea.
            </p>
            <a
              className="primary-button hero-reveal world-copy"
              href={world === "coffee" ? "#magazin" : "#solutii"}
            >
              {data.cta}
              <ArrowUpRight size={20} />
            </a>
            <div className="hero-footnote hero-reveal">
              <Coffee size={14} />
              <span>Cafea bună.</span>
              <span className="footnote-divider" />
              <Droplets size={14} />
              <span>Apă pură.</span>
              <span className="footnote-divider" />
              <span>Zile mai bune.</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-kicker">
              <span>THE ELEMENTS OF A BETTER DAY.</span>
              <span>INTERACTIVE EXPERIENCE</span>
            </div>
            <div className="element-orbit" />
            <div className="element-orbit orbit-inner" />
            <ElementScene world={world} transitionId={transitionId} />
            <span className="element-side-label">
              {world === "coffee"
                ? "FROM BEAN TO YOUR EVERYDAY"
                : "LET THE GOOD FLOW"}
            </span>
            <div className="element-coordinate">
              <span>45° 56′ N</span>
              <span>25° 00′ E</span>
            </div>
            <div className="element-identity world-copy">
              <span>{world === "coffee" ? "01 — CAFEA" : "02 — APĂ"}</span>
              <strong>
                {world === "coffee"
                  ? "Totul începe cu un bob."
                  : "Echilibru, în fiecare picătură."}
              </strong>
              <p>
                {world === "coffee"
                  ? "O origine. O aromă. Ritualul tău."
                  : "Un gest simplu. Un ritm mai bun."}
              </p>
            </div>
          </div>
          <a className="scroll-cue" href="#ecosistem">
            <ArrowDown size={15} />
            Explorează universul Makeon
          </a>
          <span className="hero-bottom-line">CAFEA & APĂ. ÎN ECHILIBRU.</span>
        </section>

        <div className="benefits-strip">
          <span>
            <ShieldCheck size={19} />
            Un singur partener
          </span>
          <i />
          <span>
            <Wrench size={19} />
            Service & mentenanță
          </span>
          <i />
          <span>
            <Coffee size={19} />
            Gust fără compromis
          </span>
          <i />
          <span>
            <Leaf size={19} />
            Mai puțin plastic
          </span>
        </div>

        <section className="ecosystem section-padding" id="ecosistem">
          <div className="section-top reveal">
            <span className="eyebrow">UNIVERSUL MAKEON</span>
            <span className="section-index">01 / ÎMPREUNĂ, MAI BINE</span>
          </div>
          <div className="ecosystem-heading reveal">
            <h2>
              Două ritualuri.
              <br />
              <span>O singură alegere bună.</span>
            </h2>
            <p>
              Credem că un loc de muncă mai bun începe cu lucrurile simple. O
              cafea care inspiră. Un pahar de apă care revigorează. Și un
              partener care se ocupă de tot.
            </p>
          </div>
          <div className="brand-cards">
            <button
              className={`brand-card coffee-brand reveal ${world === "coffee" ? "selected" : ""}`}
              onClick={() => {
                changeWorld("coffee");
                document.getElementById("solutii")?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                });
              }}
            >
              <div className="brand-card-top">
                <span>
                  <Coffee size={19} />
                  SWITCHMORN COFFEE
                </span>
                <ArrowUpRight />
              </div>
              <h3>
                Gustul unei
                <br />
                dimineți mai bune.
              </h3>
              <p>Cafea de specialitate · Espressoare · Abonamente</p>
              <div className="brand-art">
                <Beans />
              </div>
              <span className="brand-card-link">
                Explorează lumea cafelei
                <ArrowRight size={18} />
              </span>
            </button>
            <button
              className={`brand-card water-brand reveal ${world === "water" ? "selected" : ""}`}
              onClick={() => {
                changeWorld("water");
                document.getElementById("solutii")?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                });
              }}
            >
              <div className="brand-card-top">
                <span>
                  <Droplets size={19} />
                  VERO AQUA
                </span>
                <ArrowUpRight />
              </div>
              <h3>
                Claritate în fiecare
                <br />
                picătură.
              </h3>
              <p>Apă filtrată · Aparate · Filtre & mentenanță</p>
              <div className="water-visual">
                <span className="water-ripple ripple-one" />
                <span className="water-ripple ripple-two" />
                <div className="water-glass">
                  <div className="water-fill" />
                  <span className="glass-highlight" />
                </div>
                <span className="water-spark">✧</span>
              </div>
              <span className="brand-card-link">
                Explorează lumea apei
                <ArrowRight size={18} />
              </span>
            </button>
          </div>
        </section>

        <section className="solutions section-padding" id="solutii">
          <div className="section-top reveal">
            <span className="eyebrow world-copy">{data.brand}</span>
            <div className="mini-switch">
              <button
                aria-pressed={world === "coffee"}
                onClick={event => changeWorld("coffee", event.currentTarget)}
              >
                <Coffee size={16} />
                Cafea
              </button>
              <button
                aria-pressed={world === "water"}
                onClick={event => changeWorld("water", event.currentTarget)}
              >
                <Droplets size={16} />
                Apă
              </button>
            </div>
          </div>
          <div className="solutions-heading reveal">
            <div>
              <h2 className="world-copy">{data.section}</h2>
              <p className="world-copy">{data.intro}</p>
            </div>
            <a className="text-link" href="#abonamente">
              Soluții pentru echipa ta
              <ArrowUpRight size={19} />
            </a>
          </div>
          <div className="product-grid">
            {data.products.map((product, i) => (
              <article className="product-card world-copy" key={i}>
                <div className={`product-art product-${product.type}`}>
                  <span className="product-number">0{i + 1}</span>
                  {product.type === "beans" ? (
                    <Beans />
                  ) : product.type === "coffee" || product.type === "water" ? (
                    <ProductScene kind={product.type} />
                  ) : product.type === "filters" ? (
                    <Filters />
                  ) : (
                    <div className="subscription-art">
                      <div className="subscription-pass">
                        <span>makeon®</span>
                        <div className="pass-symbol">
                          {world === "coffee" ? (
                            <Coffee size={42} />
                          ) : (
                            <Droplets size={42} />
                          )}
                        </div>
                        <small>EVERYDAY MEMBERSHIP</small>
                        <div className="pass-line" />
                        <span className="pass-bottom">
                          Pentru echipa ta.
                          <ArrowUpRight size={19} />
                        </span>
                      </div>
                      <span className="pass-orbit" />
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <span className="eyebrow">{product.category}</span>
                  <h3>{product.title}</h3>
                  <p>{product.text}</p>
                  <button
                    className="text-link"
                    onClick={() =>
                      openOffer(
                        serviceOptions[
                          world === "coffee"
                            ? i === 2
                              ? 2
                              : 1
                            : i === 1
                              ? 4
                              : 3
                        ],
                      )
                    }
                  >
                    Află mai multe
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <ServiceStudio world={world} onOffer={openOffer} />
        {world === "coffee" && <CoffeeShop />}
        <PageMotion world={world} />

        <section className="business section-padding" id="abonamente">
          <div className="business-copy reveal">
            <span className="eyebrow">
              <span className="status-dot" /> MAKEON PENTRU COMPANII
            </span>
            <div
              className="business-switch"
              role="group"
              aria-label="Alege abonamentul"
            >
              <span className={`business-switch-slider ${world}`} />
              <button
                aria-pressed={world === "coffee"}
                onClick={event => changeWorld("coffee", event.currentTarget)}
              >
                <Coffee size={17} />
                Cafea
              </button>
              <button
                aria-pressed={world === "water"}
                onClick={event => changeWorld("water", event.currentTarget)}
              >
                <Droplets size={17} />
                Apă
              </button>
            </div>
            <h2>
              Tu ai grijă de echipă.
              <br />
              <span>Noi, de pauzele ei.</span>
            </h2>
            <p>
              Cafea, apă și echipamente, într-o soluție gândită pentru voi. De
              la instalare la mentenanță, ai un singur partener și mai mult timp
              pentru ce contează.
            </p>
            <div className="business-ritual">
              <div className="business-checks">
                <span>
                  <Check size={17} />
                  Soluții adaptate echipei tale
                </span>
                <span>
                  <Check size={17} />
                  Instalare și asistență tehnică
                </span>
                <span>
                  <Check size={17} />
                  Aprovizionare și mentenanță
                </span>
              </div>
              <BusinessScene world={world} />
            </div>
            <button
              className="primary-button light-button"
              onClick={() => openOffer()}
            >
              Găsim soluția potrivită
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="membership-card reveal" data-service={world}>
            {world === "water" ? (
              <>
                <div className="membership-top">
                  <Droplets size={23} />
                  <span>VERO AQUA / BUSINESS</span>
                  <span className="membership-badge">DOAR PENTRU APĂ</span>
                </div>
                <h3>
                  Apă de calitate.
                  <br />
                  Fără griji.
                </h3>
                <div className="price">
                  31
                  <span>
                    €<small>+ TVA / lună</small>
                  </span>
                </div>
                <p className="price-note">
                  Abonament de apă · 36 de luni · per aparat
                </p>
                <div className="membership-divider" />
                <ul>
                  {[
                    "Aparat nou & instalare",
                    "Filtrare în 4 stadii + lampă UV",
                    "Apă rece, caldă și la temperatura camerei",
                    "Mentenanță, igienizare & filtre",
                    "Asistență tehnică",
                  ].map((item) => (
                    <li key={item}>
                      <Check size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className="membership-cta"
                  onClick={() =>
                    openOffer("Abonament Vero Aqua — 31 € + TVA/lună")
                  }
                >
                  Vreau această soluție
                  <ArrowUpRight size={18} />
                </button>
                <small className="offer-note">
                  Ofertă exclusiv Vero Aqua. Condițiile se confirmă la
                  contractare.
                </small>
              </>
            ) : (
              <>
                <div className="membership-top">
                  <Coffee size={23} />
                  <span>SWITCHMORN / BUSINESS</span>
                  <span className="membership-badge">PENTRU ECHIPA TA</span>
                </div>
                <h3>
                  Cafeaua echipei.
                  <br />
                  În ritmul vostru.
                </h3>
                <div className="coffee-offer-title">
                  Ofertă
                  <br />
                  <span>personalizată.</span>
                </div>
                <p className="price-note">
                  Abonament de cafea · preț stabilit la cerere
                </p>
                <div className="membership-divider" />
                <ul>
                  {[
                    "Alegerea espressorului potrivit",
                    "Sortimente în funcție de preferințe",
                    "Consum adaptat numărului de colegi",
                    "Servicii și condiții discutate împreună",
                  ].map((item) => (
                    <li key={item}>
                      <Check size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className="membership-cta"
                  onClick={() =>
                    openOffer("Abonament de cafea — ofertă personalizată")
                  }
                >
                  Solicită oferta de cafea
                  <ArrowUpRight size={18} />
                </button>
                <small className="offer-note">
                  Prețul și serviciile abonamentului de cafea urmează să fie
                  confirmate.
                </small>
              </>
            )}
          </div>
        </section>

        <section className="how section-padding" id="despre">
          <div className="section-top reveal">
            <span className="eyebrow">SIMPLU, DE LA ÎNCEPUT</span>
            <span className="section-index">MAKE IT EASY. MAKEON.</span>
          </div>
          <h2 className="reveal">
            O pauză bună începe
            <br />
            cu o conversație.
          </h2>
          <div className="steps">
            <span className="journey-progress" aria-hidden="true" />
            {[
              {
                title: "Ne cunoaștem",
                text: "Ne spui despre echipa ta, spațiul vostru și ce v-ar face zilele mai bune.",
              },
              {
                title: "Găsim formula voastră",
                text: "Alegem împreună cafeaua, aparatele și soluția de apă care vi se potrivesc.",
              },
              {
                title: "Ne ocupăm de restul",
                text: "Stabilim instalarea, aprovizionarea și serviciile. Voi vă bucurați de fiecare pauză.",
              },
            ].map((step, i) => (
              <div className="step reveal" key={step.title}>
                <div className="step-top">
                  <span>0{i + 1}</span>
                  <ArrowUpRight size={25} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="faq section-padding">
          <div className="faq-heading reveal">
            <span className="eyebrow">BINE DE ȘTIUT</span>
            <h2>
              O întrebare bună
              <br />
              merită un răspuns.
            </h2>
            <p>Mai ai întrebări? Suntem la o conversație distanță.</p>
            <a className="text-link" href="tel:+40744524728">
              <Phone size={16} />
              +40 744 524 728
              <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="faq-list reveal">
            {data.faq.map(([q, a], i) => (
              <div className={`faq-item ${faq === i ? "open" : ""}`} key={q}>
                <h3>
                  <button
                    id={`faq-trigger-${i}`}
                    onClick={() => setFaq(faq === i ? null : i)}
                    aria-expanded={faq === i}
                    aria-controls={`faq-answer-${i}`}
                  >
                    {q}
                    {faq === i ? <Minus size={19} /> : <Plus size={19} />}
                  </button>
                </h3>
                <div
                  id={`faq-answer-${i}`}
                  className="faq-answer"
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  hidden={faq !== i}
                >
                  <p>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="closing section-padding reveal">
          <span className="eyebrow">LUCRURI MICI. ZILE MAI BUNE.</span>
          <h2>
            Hai să facem loc
            <br />
            <span>pentru mai bine.</span>
            <Starburst className="closing-star" />
          </h2>
          <button className="primary-button" onClick={() => openOffer()}>
            Începem cu o conversație
            <ArrowUpRight size={20} />
          </button>
          <span className="closing-footnote">
            Cafea bună. Apă pură. Un singur Furnizor.
          </span>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-top">
          <BrandLogo href="#" />
          <p>
            Grijă pentru oameni.
            <br />
            În fiecare ceașcă. În fiecare pahar.
          </p>
          <div className="footer-brands">
            <span>
              <Coffee size={17} />
              SwitchMorn Coffee
            </span>
            <span>
              <Droplets size={17} />
              Vero Aqua
            </span>
          </div>
          <a href="tel:+40744524728" className="footer-phone">
            Hai să vorbim
            <ArrowUpRight size={18} />
            <span>+40 744 524 728</span>
          </a>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Makeon. Toate drepturile rezervate.
          </span>
          <span>Concept de prezentare · România</span>
          <a href="#">
            Înapoi sus
            <ArrowUpRight size={13} />
          </a>
        </div>
      </footer>

      <dialog
        ref={dialog}
        className="contact-dialog"
        onCancel={() => setModal(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(false);
        }}
      >
        <div className="dialog-content">
          <button
            className="dialog-close"
            aria-label="Închide formularul"
            onClick={() => setModal(false)}
          >
            <X size={22} />
          </button>
          <span className="eyebrow">HAI SĂ NE CUNOAȘTEM</span>
          <h2>
            O soluție bună
            <br />
            începe cu tine.
          </h2>
          <p>
            Alege ce te interesează și dimensiunea echipei. Pregătim detaliile
            pentru discuția noastră.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPrepared(true);
            }}
          >
            <label htmlFor="interest">Ce soluție cauți?</label>
            <CustomSelect
              id="interest"
              label="Ce soluție cauți?"
              value={interest}
              onChange={(value) => {
                setInterest(value);
                setPrepared(false);
              }}
              options={serviceOptions.map((value) => ({ value, label: value }))}
            />
            <label htmlFor="team">Câți oameni sunt în echipă?</label>
            <CustomSelect
              id="team"
              label="Câți oameni sunt în echipă?"
              value={team}
              onChange={(value) => {
                setTeam(value);
                setPrepared(false);
              }}
              options={[
                "1–10 persoane",
                "11–30 persoane",
                "31–75 persoane",
                "76–150 persoane",
                "Peste 150 persoane",
              ].map((value) => ({ value, label: value }))}
            />
            <button type="submit" className="primary-button">
              Pregătește discuția
              <ArrowRight size={18} />
            </button>
          </form>
          {prepared && (
            <div className="contact-summary" role="status">
              <Check size={20} />
              <div>
                <strong>Ai pregătit detaliile.</strong>
                <p>
                  {interest} · {team}
                </p>
                <span>
                  Alege telefonul sau WhatsApp pentru a discuta oferta.
                  Detaliile se trimit doar când alegi tu să trimiți mesajul.
                </span>
                <a
                  className="text-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/40744524728?text=${encodeURIComponent(`Bună! Mă interesează: ${interest}. Echipa: ${team}. Aș dori o ofertă Makeon.`)}`}
                >
                  Continuă pe WhatsApp
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          )}
          <a className="dialog-phone" href="tel:+40744524728">
            <Phone size={18} />
            +40 744 524 728
            <ArrowUpRight size={18} />
          </a>
          <a className="dialog-email text-link" href="mailto:contact@makeon.ro">
            contact@makeon.ro
            <ArrowUpRight size={16} />
          </a>
        </div>
      </dialog>
    </div>
  );
}
