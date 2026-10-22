"use client";

import Image from 'next/image';
import { useEffect, useRef } from 'react';

/** Transparent reference-derived cartridges with a lightweight, paused-offscreen flow. */
export default function WaterFiltration() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current!;
    let visible = false;
    const update = () => node.classList.toggle('is-flow-visible', visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(node);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  return (
    <div className="water-filtration water-filtration-photo" ref={root}>
      <h3>Filtrare în 4 etape.</h3>
      <p>De la sediment la membrana de ultrafiltrare.</p>
      <div className="water-filtration-diagram">
        <div className="filtration-photo-stage">
          <Image src="/images/filtration/four-filters.webp" alt="Patru filtre: sediment, cărbune activ, carbon block și membrană UF" width={1536} height={1024} sizes="(max-width: 800px) 100vw, 50vw" className="filtration-filters-photo" />
          <svg className="filtration-flow" viewBox="0 0 600 400" fill="none" aria-hidden="true">
            <path d="M24 204C110 195 160 213 242 204S396 195 474 204S550 208 577 201" stroke="#5ccbe5" strokeOpacity=".18" strokeWidth="12" strokeLinecap="round" />
            <path d="M24 204C110 195 160 213 242 204S396 195 474 204S550 208 577 201" stroke="#80e1f3" strokeOpacity=".65" strokeWidth="2.5" strokeLinecap="round" />
            <path className="filtration-moving-stream" d="M24 204C110 195 160 213 242 204S396 195 474 204S550 208 577 201" stroke="#e0fbff" strokeWidth="3" strokeDasharray="4 28" strokeLinecap="round" />
            <path d="m569 196 8 5-7 6" stroke="#b6f3fc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <ul className="water-filtration-stages">
          {['Sediment', 'Cărbune activ', 'Carbon block', 'Membrană UF'].map((name, index) => <li key={name}><span className="filtration-step-number">0{index + 1}</span><span>{name}</span></li>)}
        </ul>
      </div>
    </div>
  );
}
