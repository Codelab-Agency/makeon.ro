"use client";

import dynamic from 'next/dynamic';
import { ArrowDown, ArrowUpRight, Coffee, Droplets } from 'lucide-react';

const ElementScene = dynamic(() => import('./element-scene'), { ssr: false });
type World = 'coffee' | 'water';
const worlds = {
  coffee: { label: 'Cafea', detail: 'AROMĂ & ENERGIE', brand: 'SwitchMORN Coffee', title: 'Totul începe cu un bob.', description: 'Cafea de specialitate, espressoare și aprovizionare pentru echipa ta.' },
  water: { label: 'Apă', detail: 'PURITATEA APEI', brand: 'Vero Aqua', title: 'Echilibru, în fiecare picătură.', description: 'Apă filtrată, aparate și mentenanță. Hidratare bună, în fiecare zi.' },
};

export default function CombinedHero({ world, transitionId, onChange, onOffer }: {
  world: World;
  transitionId: number;
  onChange: (world: World, source: HTMLElement) => void;
  onOffer: () => void;
}) {
  const data = worlds[world];

  return (
    <section className="hero hero-combined hero-elements" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-service-label">CAFEA & APĂ · UN SINGUR PARTENER</p>
        <h1 id="hero-title"><span className="hero-energy-word">Energie</span> și <em>hidratare</em> premium{' '}
          <span className="hero-combined-audience">pentru tine și echipa ta!</span>
        </h1>
        <p className="hero-description">{data.description}</p>
        <div className="hero-switch-wrap">
          <div className="world-switch hero-world-switch" role="group" aria-label="Alege lumea Makeon">
            <span className={`switch-slider ${world}`} aria-hidden="true" />
            {(['coffee', 'water'] as const).map(value => {
              const Icon = value === 'coffee' ? Coffee : Droplets;
              return <button key={value} type="button" aria-label={`Lumea ${value === 'coffee' ? 'cafelei' : 'apei'}`}
                aria-pressed={world === value}
                onClick={event => onChange(value, event.currentTarget)}>
                <Icon size={22} aria-hidden="true" />
                <span>{worlds[value].label}<small>{worlds[value].detail}</small></span>
              </button>;
            })}
          </div>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={onOffer}>Solicită ofertă pentru echipa ta <ArrowUpRight size={19} /></button>
          <a className="hero-shop-link" href="#ecosistem">Descoperă soluțiile <ArrowDown size={16} /></a>
        </div>
      </div>
      <div className="hero-art">
        <div className="element-orbit" /><div className="element-orbit orbit-inner" />
        <ElementScene world={world} transitionId={transitionId} />
        <div className="element-identity"><span>{data.brand}</span><strong>{data.title}</strong><p>{world === 'coffee' ? 'O origine. O aromă. Ritualul tău.' : 'Un gest simplu. Un ritm mai bun.'}</p></div>
      </div>
    </section>
  );
}
