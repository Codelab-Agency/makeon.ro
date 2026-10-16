/** Decorative glassware scene; its CSS loops follow the card's visibility state. */
export default function WaterPour() {
  return (
    <svg className="water-pour" viewBox="0 0 700 570" fill="none" role="img" aria-label="O carafă toarnă apă într-un pahar">
      <defs>
        <linearGradient id="pour-glass" x1="0" y1="0" x2="1" y2=".3">
          <stop stopColor="#c4f5ff" stopOpacity=".28" />
          <stop offset=".22" stopColor="#b0e9f8" stopOpacity=".04" />
          <stop offset=".65" stopColor="#e8fbff" stopOpacity=".09" />
          <stop offset="1" stopColor="#88ddf2" stopOpacity=".32" />
        </linearGradient>
        <linearGradient id="pour-water" x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#a2eaff" stopOpacity=".45" />
          <stop offset="1" stopColor="#1599c2" stopOpacity=".2" />
        </linearGradient>
        <linearGradient id="pour-edge" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e0faff" stopOpacity=".85" />
          <stop offset=".45" stopColor="#69cee8" stopOpacity=".3" />
          <stop offset="1" stopColor="#b4eeff" stopOpacity=".7" />
        </linearGradient>
      </defs>
      <ellipse cx="345" cy="459" rx="208" ry="22" fill="#58cdeb" opacity=".05" />
      <g transform="rotate(28 210 250)">
        <g className="pour-carafe">
          <path d="M170 105H252L244 121L239 155Q239 175 258 208Q275 239 278 276L282 354Q284 391 248 395H150Q116 393 121 356L131 269Q135 235 150 205Q165 174 165 154L166 122Z" fill="url(#pour-glass)" stroke="url(#pour-edge)" strokeWidth="2" />
          <path d="M135 257Q202 271 275 257L280 353Q282 387 248 390H151Q122 388 126 357Z" fill="url(#pour-water)" />
          <path d="M135 257Q202 271 275 257" stroke="#9de8fa" strokeOpacity=".6" strokeWidth="2" />
          <path d="M175 126L174 154Q174 180 159 213Q145 241 142 275L133 350" stroke="#e4fbff" strokeOpacity=".58" strokeWidth="4" strokeLinecap="round" />
          <path d="M261 287L266 352Q268 378 246 381" stroke="#a3e7fa" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
          <path d="M169 105Q211 96 252 105" stroke="#e0faff" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      <path d="M391 280L404 424Q406 442 447 442Q487 442 489 424L502 280" fill="url(#pour-glass)" stroke="url(#pour-edge)" strokeWidth="2" />
      <path d="M397 345Q447 358 496 345L489 422Q487 436 447 436Q408 436 405 422Z" fill="url(#pour-water)" />
      <ellipse cx="447" cy="280" rx="55.5" ry="10" stroke="#c8f4ff" strokeOpacity=".7" strokeWidth="2" />
      <ellipse cx="447" cy="345" rx="49" ry="9" stroke="#9ceaff" strokeOpacity=".55" />
      <path d="M404 298L414 415" stroke="#d9f8ff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
      <path d="M487 302L478 412" stroke="#7eddf5" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
      <path d="M319 143C365 153 408 214 433 340" stroke="#75dfff" strokeOpacity=".12" strokeWidth="12" strokeLinecap="round" />
      <path d="M319 143C365 153 408 214 433 340" stroke="#91e6ff" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
      <path className="pour-stream" d="M319 143C365 153 408 214 433 340" stroke="#effdff" strokeOpacity=".8" strokeWidth="1.5" strokeDasharray="12 22" strokeLinecap="round" />
      <ellipse className="pour-ripple" cx="435" cy="345" rx="19" ry="4" stroke="#c0f4ff" strokeOpacity=".65" />
    </svg>
  );
}
