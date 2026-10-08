"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee, HelpCircle, X } from "lucide-react";

export const grindDescriptions: Record<string, string> = {
  Ibric: "Măcinare foarte fină, pentru cafeaua preparată la ibric, direct în apă.",
  Moka: "Măcinare fină, puțin mai grosieră decât pentru espresso, pentru cafetiera moka de pe aragaz.",
  Espresso: "Măcinare fină, pentru prepararea sub presiune la espressorul cu portafiltru.",
};
const explanations: Record<string, string> = {
  Ibric: "Alege această variantă dacă prepari cafeaua într-un ibric. Textura este foarte fină, apropiată de pudră; cafeaua se prepară împreună cu apa, fără filtru de hârtie.",
  Moka: "Alege această variantă pentru cafetiera cu două compartimente, folosită pe aragaz. Cafeaua se pune în sita dintre rezervorul de apă și partea superioară. Nu este aceeași măcinare ca pentru ibric.",
  Espresso: "Alege această variantă pentru un espressor cu portafiltru, în care pui cafea măcinată. Dacă ai un aparat automat cu râșniță, ai nevoie de cafea boabe. Extracția poate necesita ajustări în funcție de aparat.",
};
export default function GrindGuide({selected, onSelect}: {selected:string;onSelect:(value:string)=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const element=dialog.current;
    if(!element || !open) return;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    element.showModal();
    return ()=>{element.close();document.body.style.overflow=overflow;};
  },[open]);
  return <>
    <button type="button" className="grind-guide-trigger" onClick={()=>setOpen(true)}><HelpCircle size={15}/>Nu ești sigur ce să alegi?</button>
    <dialog ref={dialog} className="grind-guide" aria-labelledby="grind-guide-title" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={event=>{
      if(event.target!==event.currentTarget) return;
      const rect=event.currentTarget.getBoundingClientRect();
      if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) setOpen(false);
    }}>
      <button type="button" className="grind-guide-close" aria-label="Închide ghidul de măcinare" onClick={()=>setOpen(false)}><X size={22}/></button>
      <span className="eyebrow">MĂCINAREA POTRIVITĂ APARATULUI TĂU</span>
      <h2 id="grind-guide-title">Cum îți prepari cafeaua?</h2>
      <p>Alege după aparatul pe care îl folosești, nu după cât de intensă preferi cafeaua.</p>
      <div className="grind-guide-options">{Object.entries(explanations).map(([format,text])=><section key={format}>
        <h3><Coffee size={19}/>{format}</h3><p>{text}</p>
        <button type="button" aria-pressed={selected===format} onClick={()=>{onSelect(format);setOpen(false);}}>Alege {format}{selected===format?" · selectat":""}</button>
      </section>)}</div>
      <p className="grind-guide-note">Ai un alt tip de aparat? Contactează-ne înainte să alegi, ca să verificăm măcinarea potrivită.</p>
    </dialog>
  </>;
}
