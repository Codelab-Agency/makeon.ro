/** A compact filtration overview; labels stay in HTML so they remain legible on phones. */
export default function WaterFiltration() {
  return (
    <div className="water-filtration">
      <h3>Filtrare în 4 etape.</h3>
      <p>Un drum simplu spre apa din paharul tău.</p>
      <div className="water-filtration-diagram">
      <svg viewBox="0 0 600 340" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="filtration-shell" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#c3e9ed" stopOpacity=".12" />
            <stop offset=".45" stopColor="#ecfcff" stopOpacity=".28" />
            <stop offset="1" stopColor="#c3e9ed" stopOpacity=".08" />
          </linearGradient>
          <linearGradient id="filtration-water" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#73d8eb" stopOpacity=".15" />
            <stop offset="1" stopColor="#73d8eb" />
          </linearGradient>
        </defs>
        <ellipse cx="280" cy="243" rx="232" ry="17" fill="#73d8eb" opacity=".04" />
        {[35, 165, 295, 425].map((x, index) => (
          <g key={x}>
            <rect x={x + 14} y="51" width="32" height="19" rx="5" fill="#19333e" stroke="#73d8eb" strokeOpacity=".5" />
            <rect x={x} y="68" width="60" height="155" rx="23" fill="#0b1c24" stroke="#73d8eb" strokeOpacity=".55" />
            <rect x={x + 8} y="82" width="44" height="124" rx="16" fill="url(#filtration-shell)" />
            {index === 0 ? Array.from({ length: 16 }, (_, i) => (
              <circle key={i} cx={x + 17 + (i % 3) * 13} cy={99 + Math.floor(i / 3) * 18} r="2" fill="#a1d8df" opacity=".55" />
            )) : index === 1 ? Array.from({ length: 6 }, (_, i) => (
              <path key={i} d={`M${x + 16} ${101 + i * 17}h28`} stroke="#73d8eb" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" />
            )) : Array.from({ length: index === 2 ? 5 : 9 }, (_, i) => (
              <path key={i} d={`M${x + 16 + i * (index === 2 ? 7 : 3.5)} 98v90`} stroke="#a1d8df" strokeOpacity=".5" />
            ))}
          </g>
        ))}
        <g transform="translate(60 0)">
          <path d="M476 114L481 211Q500 222 521 211L527 114" fill="#d6faff" fillOpacity=".06" stroke="#b2e9f0" strokeOpacity=".7" strokeWidth="2" />
          <path d="M481 155Q502 163 523 155L520 209Q501 218 483 209Z" fill="#73d8eb" fillOpacity=".28" />
          <ellipse cx="501.5" cy="114" rx="25.5" ry="5" stroke="#b2e9f0" strokeOpacity=".7" strokeWidth="2" />
        </g>
        {/* Draw the stream last so it remains visible through each filter housing. */}
        <path d="M15 142H500Q515 142 515 127V107Q515 92 530 92H546Q561 92 561 107V152" stroke="#73d8eb" strokeOpacity=".15" strokeWidth="12" strokeLinecap="round" />
        <path d="M15 142H500Q515 142 515 127V107Q515 92 530 92H546Q561 92 561 107V152" stroke="url(#filtration-water)" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 142H500Q515 142 515 127V107Q515 92 530 92H546Q561 92 561 107V152" stroke="#c9f8ff" strokeWidth="1.5" strokeDasharray="3 16" strokeLinecap="round" />
      </svg>
      <ul className="water-filtration-stages">
        {[["Sediment"], ["Cărbune", "activ"], ["Carbon", "block"], ["Membrană", "UF"]].map((lines, index) => (
          <li key={lines[0]} style={{ left: `${((65 + index * 130) / 600) * 100}%` }}>
            {lines.map(line => <span key={line}>{line}</span>)}
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
