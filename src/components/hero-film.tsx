"use client";

import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const scenes = [
  { name: 'coffee', title: 'Energia unui început bun.', label: 'CAFEA DE SPECIALITATE', logo: '/images/switchmorn-coffee-logo.webp', alt: 'SwitchMORN Coffee', width: 52, height: 53 },
  { name: 'water', title: 'Claritate în fiecare picătură.', label: 'APĂ FILTRATĂ', logo: '/images/vero-aqua-logo.webp', alt: 'Vero Aqua', width: 116, height: 44 },
] as const;

/** Both services remain visible; one control owns playback and reduced motion. */
export default function HeroFilm() {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [ready, setReady] = useState([false, false]);
  const [failed, setFailed] = useState([false, false]);
  const wantsPlayback = choice ?? !reduced;

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(motion.matches);
    updateMotion();
    motion.addEventListener('change', updateMotion);
    let inView = true;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(panel.current!);
    document.addEventListener('visibilitychange', updateVisibility);
    const nodes = videos.current;
    return () => {
      nodes.forEach(node => node?.pause());
      observer.disconnect();
      motion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const nodes = videos.current;
    nodes.forEach((node, i) => {
      if (!node) return;
      if (wantsPlayback && visible && !failed[i]) {
        if (!node.getAttribute('src')) {
          const mobile = window.matchMedia('(max-width: 620px)').matches;
          node.src = `/videos/makeon-${scenes[i].name}-v5${mobile ? '-mobile' : ''}.mp4`;
        }
        node.play().catch(() => { if (!cancelled) setChoice(false); });
      } else node.pause();
    });
    return () => { cancelled = true; nodes.forEach(node => node?.pause()); };
  }, [wantsPlayback, visible, failed]);

  return (
    <div className="hero-diptych" ref={panel}>
      <div className="hero-diptych-grid">
        {scenes.map((scene, i) => (
          <div className={`hero-service hero-service-${scene.name}`} key={scene.name}>
            <div className="hero-service-visual">
            <div className={`hero-film${ready[i] && !failed[i] ? ' hero-film-ready' : ''}`} aria-hidden="true">
              <Image src={`/images/makeon-${scene.name}-v5.webp`} alt="" fill priority sizes="(max-width: 620px) 50vw, 46vw" className="hero-film-poster" />
              <video ref={node => { videos.current[i] = node; }} muted loop playsInline preload="none" tabIndex={-1}
                poster={`/images/makeon-${scene.name}-v5.webp`} disablePictureInPicture
                onCanPlay={() => setReady(values => values.map((value, j) => j === i ? true : value))}
                onError={() => setFailed(values => values.map((value, j) => j === i ? true : value))} />
            </div>
            <div className="hero-service-top">
              <Image src={scene.logo} alt={scene.alt} width={scene.width} height={scene.height} className={`hero-brand-logo hero-brand-${scene.name}`} priority />
              <span aria-hidden="true">0{i + 1}</span>
            </div>
            </div>
            <div className="hero-service-copy">
              <span className="hero-service-label">{scene.label}</span>
              <p className="hero-service-caption">{scene.title}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="hero-editorial-bottom">
        <span>Cafea bună. Apă pură. <span>Un singur partener.</span></span>
        {!failed.every(Boolean) && <button type="button" className="hero-film-toggle"
          aria-label={wantsPlayback ? 'Întrerupe videoclipul de fundal' : 'Pornește videoclipul de fundal'}
          aria-pressed={wantsPlayback} onClick={() => setChoice(!wantsPlayback)}>
          {wantsPlayback ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          <span>{wantsPlayback ? 'Pauză' : 'Redă'}</span>
        </button>}
      </div>
    </div>
  );
}
