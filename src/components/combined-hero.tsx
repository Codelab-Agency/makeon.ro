"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

const ElementScene = dynamic(() => import('./element-scene'), { ssr: false });
export default function CombinedHero({ onOffer }: {
  onOffer: () => void;
}) {
  return (
    <section className="hero hero-combined hero-elements" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-service-label">SOLUȚII COMPLETE PENTRU FIRME</p>
        <h1 id="hero-title"><span className="hero-energy-word">Cafea de origine</span> și <em>apă filtrată.</em>{' '}
          <span className="hero-combined-audience">Pentru biroul tău.</span>
        </h1>
        <p className="hero-description">Cafea proaspăt prăjită, espressoare în comodat și soluții de filtrare a apei. Aparatura, aprovizionarea și mentenanța, adaptate echipei tale.</p>
        <div className="hero-offers" aria-label="Oferte pentru birou">
          <Link href="/cafeaua-ta" className="hero-offer-coffee">
            <span className="hero-offer-label">CAFEA & ESPRESSOR <ArrowUpRight size={12} aria-hidden="true" /></span>
            <p>Ofertă personalizată</p>
            <small>După numărul de colegi, consum și preferințe</small>
          </Link>
          <Link href="/apa" className="hero-offer-water">
            <span className="hero-offer-label">APĂ & DOZATOR <ArrowUpRight size={12} aria-hidden="true" /></span>
            <p>de la <strong>31 €</strong><span> / lună + TVA</span></p>
            <small>Per aparat · instalare, mentenanță și filtre incluse</small>
          </Link>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onOffer}>Cere oferta pentru biroul tău <ArrowUpRight size={19} /></button>
          <a className="hero-shop-link" href="#ecosistem">Descoperă soluțiile <ArrowDown size={16} /></a>
        </div>
        <p className="hero-offer-guidance">Spune-ne câți colegi sunteți. Îți propunem o configurație potrivită.</p>
      </div>
      <div className="hero-art">
        <div className="element-orbit" /><div className="element-orbit orbit-inner" />
        <ElementScene world="coffee" transitionId={0} automatic />
        <div className="element-identity"><span>SwitchMORN Coffee · Vero Aqua</span><strong>Cafeaua și apa echipei tale.</strong><p>Un singur partener, de la instalare la întreținere.</p></div>
      </div>
    </section>
  );
}
