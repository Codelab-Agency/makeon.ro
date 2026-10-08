import { ArrowUpRight, CalendarDays } from "lucide-react";
import AmbientOrbit from "./ambient-orbit";
import { eventServices } from "@/lib/service-options";

/** Illustrative silhouettes until the client supplies photography of the actual setups. */
function EventSetup({ trailer }: { trailer: boolean }) {
  return (
    <svg className="event-setup" viewBox="0 0 520 300" fill="none" aria-hidden="true">
      <ellipse cx="260" cy="266" rx="205" ry="14" fill="currentColor" opacity=".06" />
      {trailer ? <>
        <path d="M85 218V103Q85 68 122 68H358Q385 68 385 98V218H85Z" fill="#30231c" stroke="currentColor" strokeWidth="2" />
        <path d="M105 97H365L380 129H90L105 97Z" fill="currentColor" opacity=".8" />
        <path d="M132 132H338V192H132V132Z" fill="#130f0c" stroke="currentColor" strokeOpacity=".5" />
        <path d="M118 196H351V205H118V196Z" fill="currentColor" />
        <path d="M385 217H423L440 234H375M89 229H379" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        {[149, 320].map(x => <g key={x}><circle cx={x} cy="237" r="23" fill="#130f0c" stroke="currentColor" strokeWidth="2" /><circle cx={x} cy="237" r="8" stroke="currentColor" /></g>)}
        {[154, 195, 236, 277, 318].map(x => <circle key={x} cx={x} cy="141" r="3" fill="currentColor" />)}
        <path d="M211 170H233V187H211V170ZM233 174H240V182H233M270 168H292V187H270V168Z" stroke="currentColor" strokeWidth="2" />
      </> : <>
        <path d="M119 220V152H402V220H119Z" fill="#30231c" stroke="currentColor" strokeWidth="2" />
        <path d="M106 143H414V155H106V143Z" fill="currentColor" />
        <path d="M132 222V245M389 222V245M144 82V140M377 82V140M139 82H382" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {[165, 212, 260, 308, 355].map(x => <g key={x}><path d={`M${x} 82V94`} stroke="currentColor" /><circle cx={x} cy="98" r="5" fill="currentColor" /></g>)}
        <rect x="185" y="106" width="79" height="35" rx="4" fill="#130f0c" stroke="currentColor" />
        <path d="M194 119H255M201 124V132M247 124V132M293 121H310V139H293V121ZM310 125H316V134H310" stroke="currentColor" strokeWidth="2" />
        <path d="M149 174H374M149 198H374" stroke="currentColor" strokeOpacity=".2" />
      </>}
      <text x={trailer ? 235 : 260} y={trailer ? 90 : 190} fill="currentColor" textAnchor="middle" fontSize="11" letterSpacing="4">MAKEON</text>
    </svg>
  );
}

export default function PrivateEvents({ onOffer }: { onOffer: (selection: string) => void }) {
  return (
    <section className="private-events section-padding" id="evenimente" aria-labelledby="events-title">
      <div className="section-top reveal">
        <span className="eyebrow"><CalendarDays size={14} /> MAKEON / EVENIMENTE PRIVATE</span>
        <span className="section-index">NE VEDEM LA EVENIMENTUL TĂU</span>
      </div>
      <div className="events-heading reveal">
        <h2 id="events-title">Dăm gust<br /><span>evenimentului tău.</span></h2>
        <p>Rulotă și bar mobil pentru evenimente private. Alegem împreună formatul potrivit locației, numărului de invitați și atmosferei pe care vrei să o creezi.</p>
      </div>
      <div className="events-grid">
        {[
          { title: "Rulota Makeon", label: "01 / RULOTĂ", text: "Un punct de întâlnire la evenimentul tău. Discutăm locația și spațiul disponibil pentru a stabili cum putem aduce rulota acolo.", service: eventServices.trailer },
          { title: "Barul mobil", label: "02 / BAR MOBIL", text: "Un bar care vine la tine. Stabilim împreună configurația și serviciile potrivite pentru invitații tăi și pentru spațiul evenimentului.", service: eventServices.bar },
        ].map((setup, i) => (
          <article className="event-card reveal" key={setup.service}>
            <div className="event-art">
              <AmbientOrbit />
              <span className="event-art-label">{setup.label}</span>
              <EventSetup trailer={i === 0} />
            </div>
            <div className="event-card-copy">
              <h3>{setup.title}</h3>
              <p>{setup.text}</p>
              <button className="text-link" onClick={() => onOffer(setup.service)}>Solicită ofertă pentru {i === 0 ? "rulotă" : "barul mobil"}<ArrowUpRight size={18} /></button>
            </div>
          </article>
        ))}
      </div>
      <p className="events-note reveal">Spune-ne data, localitatea și numărul estimativ de invitați. Disponibilitatea și detaliile se confirmă în ofertă.</p>
    </section>
  );
}
