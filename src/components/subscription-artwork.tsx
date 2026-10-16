/** Recurring service artwork without pricing, lettering or date numbers. */
export default function SubscriptionArtwork({ world = "water" }: { world?: "coffee" | "water" }) {
  return (
    <svg className={`subscription-artwork subscription-${world}`} viewBox="0 0 700 570" fill="none" role="img" aria-label={world === "coffee" ? "Abonament de cafea pentru echipă, cu servicii recurente" : "Abonament lunar de apă, cu servicii recurente incluse"}>
      <defs>
        <linearGradient id="subscription-calendar" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#c8f3ff" stopOpacity=".22" />
          <stop offset=".45" stopColor="#9fd5e5" stopOpacity=".07" />
          <stop offset="1" stopColor="#8eb9c5" stopOpacity=".14" />
        </linearGradient>
        <linearGradient id="subscription-drop" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#bcf6ff" stopOpacity=".8" />
          <stop offset=".5" stopColor="#59cce9" stopOpacity=".4" />
          <stop offset="1" stopColor="#1884aa" stopOpacity=".18" />
        </linearGradient>
        <linearGradient id="subscription-frame" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#304f5e" />
          <stop offset="1" stopColor="#142e3c" />
        </linearGradient>
      </defs>
      <ellipse cx="350" cy="447" rx="145" ry="12" fill="#73d8eb" opacity=".045" />
      <path d="M179 252a178 178 0 0 1 298-107M477 145v-17M477 145h-18" stroke="#73d8eb" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M521 320a178 178 0 0 1-298 107M223 427v17M223 427h18" stroke="#73d8eb" strokeOpacity=".45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="235" y="164" width="230" height="258" rx="17" fill="#07161e" stroke="#6fb7c9" strokeOpacity=".2" />
      <rect x="228" y="156" width="230" height="258" rx="17" fill="url(#subscription-calendar)" stroke="#b9edfb" strokeOpacity=".55" strokeWidth="1.3" />
      <path d="M245 156H441Q458 156 458 173V218H228V173Q228 156 245 156Z" fill="url(#subscription-frame)" fillOpacity=".65" />
      <path d="M228 218H458" stroke="#a7e7f6" strokeOpacity=".25" />
      <path d="M236 201V174Q236 164 247 164H436" stroke="#e2faff" strokeOpacity=".2" strokeLinecap="round" />
      {[280, 406].map(x => <g key={x}>
        <ellipse cx={x} cy="174" rx="10" ry="4" fill="#061720" />
        <rect x={x - 5} y="138" width="10" height="38" rx="5" fill="url(#subscription-frame)" stroke="#b2e3f0" strokeOpacity=".65" />
        <path d={`M${x - 2} 145v24`} stroke="#effdff" strokeOpacity=".45" strokeLinecap="round" />
      </g>)}
      {[0, 1, 2].map(row => [0, 1, 2, 3].map(column => (
        <rect key={`${row}-${column}`} x={255 + column * 46} y={244 + row * 43} width="25" height="25" rx="5" fill="#a6e6f7" fillOpacity={row === 1 && column === 1 ? .2 : .035} stroke="#9bd7e8" strokeOpacity={row === 1 && column === 1 ? .65 : .22} />
      )))}
      <path d="M307 299l5 5 10-12" stroke="#c2effc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M255 379H303M255 388H283" stroke="#a3dbea" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="446" cy="370" r="57" fill="#0a202b" stroke="#6bcae2" strokeOpacity=".45" strokeWidth="1.3" />
      <circle cx="446" cy="370" r="50" stroke="#98dced" strokeOpacity=".12" />
      {world === "water" ? <>
        <path d="M446 330C438 346 422 359 422 375a24 24 0 0 0 48 0c0-16-16-29-24-45Z" fill="url(#subscription-drop)" stroke="#9be6fa" strokeOpacity=".6" strokeWidth="1.1" />
        <path d="M436 357Q428 369 429 377" stroke="#e5fcff" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
      </> : <>
        <path d="M421 355H461V378Q461 395 441 395Q421 395 421 378Z" fill="url(#subscription-drop)" stroke="#9be6fa" strokeOpacity=".7" strokeWidth="1.4" />
        <path d="M461 361H467Q478 361 478 372Q478 383 461 383" stroke="#b2e8fa" strokeWidth="1.6" />
        <path d="M416 401H470" stroke="#9be6fa" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M431 346c-5-7 5-10 0-17M442 346c-5-7 5-10 0-17M453 346c-5-7 5-10 0-17" stroke="#c2effc" strokeOpacity=".65" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M426 363v15" stroke="#e5fcff" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
      </>}
    </svg>
  );
}
