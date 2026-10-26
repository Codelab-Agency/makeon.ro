"use client";

import dynamic from 'next/dynamic';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

const ElementScene = dynamic(() => import('./element-scene'), { ssr: false });
export default function CombinedHero({ onOffer }: {
  onOffer: () => void;
}) {
  return (
    <section className="hero hero-combined hero-elements" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-service-label">CAFEA & APĂ · UN SINGUR PARTENER</p>
        <h1 id="hero-title"><span className="hero-energy-word">Energie</span> și <em>hidratare</em> premium{' '}
          <span className="hero-combined-audience">pentru tine și echipa ta!</span>
        </h1>
        <p className="hero-description">Espressoare, dozatoare, aprovizionare și mentenanță. Tot ce are nevoie echipa ta, de la un singur partener.</p>
        <div className="hero-offers" aria-label="Oferte pentru birou">
          <div className="hero-offer-water">
            <span className="hero-offer-label">ABONAMENT APĂ</span>
            <p>de la <strong>31 €</strong><span> / lună + TVA</span></p>
            <small>Per aparat</small>
          </div>
          <div className="hero-offer-coffee">
            <span className="hero-offer-label">SOLUȚII DE CAFEA</span>
            <p>Ofertă personalizată</p>
            <small>În funcție de aparat și consum</small>
          </div>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onOffer}>Solicită ofertă pentru echipa ta <ArrowUpRight size={19} /></button>
          <a className="hero-shop-link" href="#ecosistem">Descoperă soluțiile <ArrowDown size={16} /></a>
        </div>
      </div>
      <div className="hero-art">
        <div className="element-orbit" /><div className="element-orbit orbit-inner" />
        <ElementScene world="coffee" transitionId={0} automatic />
        <div className="element-identity"><span>SwitchMORN Coffee · Vero Aqua</span><strong>Două ritualuri. Un singur partener.</strong><p>Energie și echilibru, în fiecare zi.</p></div>
      </div>
    </section>
  );
}
