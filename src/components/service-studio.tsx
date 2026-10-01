"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Coffee, Droplets } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
const services = {
  coffee: [
    {
      title: "Prăjire în loturi mici",
      detail:
        "De la boabe verzi de origine la cafeaua din ceașcă. Profilul de prăjire este ajustat pentru metoda ta de preparare, cu atenție la aromă și echilibru.",
      tags: ["Boabe de origine", "Profil de prăjire", "Loturi mici"],
      action: "Discutăm despre prăjire",
      label: "DE LA ORIGINE LA AROMĂ",
    },
    {
      title: "Blendul care te reprezintă",
      detail:
        "Un amestec gândit pentru preferințele tale și băuturile pe care le pregătești. Explorăm împreună o formulă personalizată pentru acasă, cafenea sau echipă.",
      tags: ["Blend personalizat", "Preferințe de gust", "HoReCa"],
      action: "Vreau un blend personalizat",
      label: "FORMULA TA DE GUST",
    },
    {
      title: "Espresso sau slow mornings?",
      detail:
        "Prăjire pentru espresso și pentru cafea la filtru: V60, Chemex sau AeroPress. Alegem cafeaua în funcție de felul în care îți place să o prepari.",
      tags: ["Espresso", "V60 & Chemex", "AeroPress"],
      action: "Ajută-mă să aleg cafeaua",
      label: "PENTRU METODA TA",
    },
    {
      title: "Descoperă înainte să alegi",
      detail:
        "Poți solicita o comandă de cafea de probă și recomandări pentru acasă, cafenea, restaurant sau birou. Sortimentele, cantitățile și prețul se confirmă împreună.",
      tags: ["Cafea de probă", "Acasă & birou", "Cafenele & restaurante"],
      action: "Solicită cafea de probă",
      label: "URMĂTOAREA TA CAFEA",
    },
  ],
  water: [
    {
      title: "Pornim de la apa ta",
      detail:
        "Consultanța pornește de la analiza apei și a echipamentului existent. Recomandăm sistemul de filtrare în funcție de consum, spațiu și nevoile aparatului.",
      tags: ["Analiza apei", "Compatibilitate", "Recomandare personalizată"],
      action: "Solicită consultanță pentru apă",
      label: "FIECARE SPAȚIU E DIFERIT",
    },
    {
      title: "Instalare, cap-coadă",
      detail:
        "Montarea sistemului de filtrare este adaptată spațiului tău: cafenea, restaurant sau birou. Stabilim configurația și cerințele de instalare înainte de ofertă.",
      tags: ["Sisteme de filtrare", "Montaj", "Birouri & HoReCa"],
      action: "Solicită instalarea unui sistem",
      label: "UN CIRCUIT BINE GÂNDIT",
    },
    {
      title: "Grijă care continuă",
      detail:
        "Verificări periodice, mentenanță și înlocuirea filtrelor la timp. Pentru sistemele de filtrare, intervalele și costurile se stabilesc în ofertă; abonamentul Vero Aqua are serviciile sale incluse.",
      tags: [
        "Verificări periodice",
        "Schimb de filtre",
        "Suport după instalare",
      ],
      action: "Solicită mentenanță și filtre",
      label: "DINCOLO DE INSTALARE",
    },
    {
      title: "Apa bună face cafeaua bună",
      detail:
        "Soluții dedicate espressoarelor și automatelor de cafea, alături de sisteme pentru restaurante și birouri. Filtrarea potrivită ajută gustul băuturii și protejează echipamentul de depunerile de calcar.",
      tags: ["Espressoare", "Automate de cafea", "Protecția echipamentului"],
      action: "Caut filtre pentru espressor",
      label: "CELE DOUĂ LUMI SE ÎNTÂLNESC",
    },
  ],
};

export default function ServiceStudio({
  world,
  onOffer,
}: {
  world: "coffee" | "water";
  onOffer: (selection: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLElement>(null);
  const active = services[world][selected];
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const loop = gsap.timeline({ repeat: -1, paused: true });
        let steam: gsap.core.Tween | undefined;
        if (world === "coffee") {
          loop
            .to(
              ".studio-drum",
              {
                rotation: 360,
                transformOrigin: "50% 50%",
                duration: 18,
                ease: "none",
              },
              0,
            )
            .to(
              ".studio-bean",
              {
                rotation: "+=360",
                transformOrigin: "50% 50%",
                duration: 9,
                stagger: 0.12,
                ease: "none",
              },
              0,
            );
          steam = gsap.to(".studio-steam", {
            y: -18,
            opacity: 0.25,
            duration: 2,
            stagger: 0.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            paused: true,
          });
        } else {
          loop
            .to(
              ".studio-flow",
              { strokeDashoffset: -90, duration: 2, ease: "none" },
              0,
            )
            .to(
              ".studio-bubble",
              {
                y: -28,
                opacity: 0.2,
                duration: 2,
                stagger: 0.15,
                ease: "sine.inOut",
              },
              0,
            );
        }
        const observer = new IntersectionObserver(([entry]) => {
          root.current?.classList.toggle(
            "motion-visible",
            entry.isIntersecting,
          );
          if (entry.isIntersecting && !document.hidden) {
            loop.play();
            steam?.play();
          } else {
            loop.pause();
            steam?.pause();
          }
        });
        if (root.current) observer.observe(root.current);
        const visibility = () => {
          if (document.hidden) {
            loop.pause();
            steam?.pause();
          } else if (root.current?.classList.contains("motion-visible")) {
            loop.play();
            steam?.play();
          }
        };
        document.addEventListener("visibilitychange", visibility);
        gsap.from(".studio-diagram", {
          scale: 0.9,
          opacity: 0,
          duration: 1.2,
          scrollTrigger: {
            trigger: root.current,
            start: "top 80%",
            once: true,
          },
        });
        gsap.fromTo(
          ".studio-scroll-layer",
          {
            y: 7,
            rotation: world === "coffee" ? -2 : 0,
            transformOrigin: "250px 190px",
          },
          {
            y: -7,
            rotation: world === "coffee" ? 2 : 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          },
        );
        gsap.fromTo(
          ".studio-profile",
          { strokeDashoffset: 600 },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top 85%",
              end: "bottom 70%",
              scrub: 1,
            },
          },
        );
        return () => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", visibility);
        };
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [world]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".studio-detail",
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
      );
    }, root);
    return () => ctx.revert();
  }, [selected, world]);
  return (
    <section
      ref={root}
      className={`service-studio section-padding studio-${world}`}
      id="servicii"
    >
      <div className="section-top">
        <span className="eyebrow">MAKEON / PRICEPERE ÎN FIECARE DETALIU</span>
        <span className="section-index">DE LA PRODUS LA EXPERIENȚĂ</span>
      </div>
      <div className="studio-heading">
        <h2>
          {world === "coffee" ? (
            <>
              Dincolo de cafea.
              <br />
              <span>Pasiune, pusă la lucru.</span>
            </>
          ) : (
            <>
              Dincolo de apă.
              <br />
              <span>Un sistem gândit pentru tine.</span>
            </>
          )}
        </h2>
        <p>
          {world === "coffee"
            ? "Originea, prăjirea și prepararea se întâlnesc în ceașca ta. Descoperă ce putem construi împreună."
            : "Consultanță, instalare și grijă după montaj. Pentru un pahar bun și echipamente care funcționează bine."}
        </p>
      </div>
      <div className="studio-layout">
        <div className="studio-visual">
          <span className="studio-visual-label">
            {world === "coffee" ? <Coffee size={16} /> : <Droplets size={16} />}{" "}
            {active.label}
          </span>
          <svg
            className="studio-diagram"
            viewBox="0 0 500 410"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`studio-glow-${world}`}>
                <stop stopColor="currentColor" stopOpacity=".22" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle
              cx="250"
              cy="195"
              r="180"
              fill={`url(#studio-glow-${world})`}
            />
            <g className="studio-scroll-layer">
              {world === "coffee" ? (
                <>
                  <circle
                    cx="250"
                    cy="190"
                    r="135"
                    fill="none"
                    stroke="currentColor"
                    opacity=".18"
                  />
                  <g className="studio-drum">
                    <circle
                      cx="250"
                      cy="190"
                      r="109"
                      fill="#221b14"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="250"
                      cy="190"
                      r="96"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="2 10"
                    />
                    {[0, 60, 120, 180, 240, 300].map((angle) => (
                      <path
                        key={angle}
                        d="M250 90 Q280 150 250 170"
                        transform={`rotate(${angle} 250 190)`}
                        fill="none"
                        stroke="currentColor"
                        opacity=".45"
                      />
                    ))}
                  </g>
                  {Array.from({ length: 12 }, (_, i) => {
                    const a = i * 2.4,
                      r = 35 + (i % 3) * 21,
                      x = 250 + Math.cos(a) * r,
                      y = 190 + Math.sin(a) * r;
                    return (
                      <g className="studio-bean" key={i}>
                        <ellipse
                          cx={x}
                          cy={y}
                          rx="9"
                          ry="14"
                          transform={`rotate(${i * 30} ${x} ${y})`}
                          fill={i % 2 ? "#bd7b42" : "#8e562f"}
                        />
                        <path
                          d={`M${x} ${y - 8}q-5 8 0 16`}
                          stroke="#392416"
                          fill="none"
                        />
                      </g>
                    );
                  })}
                  {[210, 250, 290].map((x, i) => (
                    <path
                      key={x}
                      className="studio-steam"
                      d={`M${x} 65q-14 -12 0 -24t0 -24`}
                      fill="none"
                      stroke="currentColor"
                      opacity={0.3 + i * 0.12}
                      strokeWidth="2"
                    />
                  ))}
                  <path
                    className="studio-profile"
                    d="M70 355 C150 352 150 334 200 330 S310 300 345 325 S410 314 432 302"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="600"
                  />
                  <path
                    d="M70 365H432M70 310V365"
                    stroke="currentColor"
                    opacity=".2"
                  />
                  <text x="70" y="389">
                    ORIGINE
                  </text>
                  <text x="355" y="389">
                    AROMĂ
                  </text>
                </>
              ) : (
                <>
                  <path
                    d="M58 185H115M175 185H220M280 185H325M385 185H441"
                    stroke="currentColor"
                    opacity=".2"
                    strokeWidth="3"
                  />
                  <path
                    className="studio-flow"
                    d="M58 185H441"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="5 10"
                  />
                  {[115, 220, 325].map((x, i) => (
                    <g key={x}>
                      <rect
                        x={x}
                        y="100"
                        width="60"
                        height="165"
                        rx="27"
                        fill="#162d31"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <rect
                        x={x + 8}
                        y="88"
                        width="44"
                        height="20"
                        rx="5"
                        fill="#203c40"
                        stroke="currentColor"
                      />
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <path
                          key={n}
                          d={`M${x + 12} ${132 + n * 18}h36`}
                          stroke="currentColor"
                          opacity=".25"
                        />
                      ))}
                      <text x={x + 21} y="291">
                        0{i + 1}
                      </text>
                      <circle
                        className="studio-bubble"
                        cx={x + 30}
                        cy="229"
                        r="5"
                        fill="currentColor"
                      />
                    </g>
                  ))}
                  <path
                    d="M425 154q-24 29 0 34q24 -5 0 -34"
                    fill="currentColor"
                    opacity=".8"
                  />
                  <path
                    className="studio-profile"
                    d="M65 348 C160 348 175 310 250 310 S355 338 435 307"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="600"
                  />
                  <text x="65" y="389">
                    APA TA
                  </text>
                  <text x="324" y="389">
                    ECHILIBRU
                  </text>
                </>
              )}
            </g>
          </svg>
          <div className="studio-visual-footer">
            <span>
              {world === "coffee"
                ? "ORIGINE → PRĂJIRE → CEAȘCĂ"
                : "CONSULTANȚĂ → FILTRARE → GRIJĂ"}
            </span>
            <span>ILUSTRAȚIE DE PROCES</span>
          </div>
        </div>
        <div className="studio-services">
          <div
            className="studio-tabs"
            role="tablist"
            aria-label={
              world === "coffee"
                ? "Servicii pentru cafea"
                : "Servicii pentru apă"
            }
          >
            {services[world].map((service, i) => (
              <button
                id={`service-tab-${i}`}
                key={i}
                role="tab"
                aria-selected={selected === i}
                aria-controls="service-detail"
                tabIndex={selected === i ? 0 : -1}
                onClick={() => setSelected(i)}
                onKeyDown={(e) => {
                  if (
                    [
                      "ArrowDown",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowLeft",
                      "Home",
                      "End",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 3
                          : (selected +
                              (e.key === "ArrowDown" || e.key === "ArrowRight"
                                ? 1
                                : 3)) %
                            4;
                    setSelected(next);
                    document.getElementById(`service-tab-${next}`)?.focus();
                  }
                }}
              >
                <span>0{i + 1}</span>
                <span className="studio-tab-title">{service.title}</span>
                <ArrowUpRight size={19} />
              </button>
            ))}
          </div>
          <div
            className="studio-detail"
            role="tabpanel"
            id="service-detail"
            aria-labelledby={`service-tab-${selected}`}
          >
            <p>{active.detail}</p>
            <div className="studio-tags">
              {active.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <button
              className="text-link"
              onClick={() => onOffer(active.action)}
            >
              {active.action}
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
