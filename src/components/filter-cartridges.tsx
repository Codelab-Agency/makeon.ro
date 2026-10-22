/** Fixed SVG proportions keep the cartridges and their labels crisp at every viewport. */
export default function FilterCartridges() {
  return (
    <svg viewBox="0 0 700 570" fill="none" role="img" aria-label="Două cartușe de filtrare Vero Aqua">
      <defs>
        <linearGradient id="cartridge-body" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#b5c6ca" />
          <stop offset=".18" stopColor="#f5f8f9" />
          <stop offset=".5" stopColor="#ffffff" />
          <stop offset=".82" stopColor="#dce7e9" />
          <stop offset="1" stopColor="#a0b4ba" />
        </linearGradient>
        <linearGradient id="cartridge-cap" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f8fcfd" />
          <stop offset="1" stopColor="#bacdd2" />
        </linearGradient>
      </defs>
      {[{ x: 205, y: 74, label: "CARBON" }, { x: 370, y: 94, label: "MEMBRANĂ UF" }].map(({ x, y, label }) => (
        <g key={label} transform={`translate(${x} ${y})`}>
          <g className="cartridge-float">
          <rect x="47" y="0" width="30" height="30" rx="6" fill="url(#cartridge-body)" stroke="#b1c5cb" />
          <rect x="9" y="25" width="106" height="335" rx="28" fill="url(#cartridge-body)" stroke="#c4d4d8" />
          <rect x="2" y="25" width="120" height="42" rx="14" fill="url(#cartridge-cap)" stroke="#c4d4d8" />
          <path d="M10 60H114M18 326H106" stroke="#95adb5" strokeOpacity=".6" strokeWidth="2" />
          <path className="cartridge-reflection" d="M24 84V304" stroke="white" strokeOpacity=".65" strokeWidth="3" strokeLinecap="round" />
          <rect x="22" y="118" width="80" height="153" rx="8" fill="#edf6f8" stroke="#bdd6dd" />
          <text x="62" y="151" textAnchor="middle" fill="#234854" fontSize="17" fontWeight="600" letterSpacing="3">VERO</text>
          <text x="62" y="170" textAnchor="middle" fill="#36788c" fontSize="11" letterSpacing="4">AQUA</text>
          <path d="M62 188C58 197 48 204 48 214a14 14 0 0 0 28 0c0-10-10-17-14-26Z" stroke="#267f98" strokeWidth="2.5" />
          <text x="62" y="252" textAnchor="middle" fill="#365b68" fontSize="9" fontWeight="600" letterSpacing=".6">{label}</text>
          <rect x="46" y="357" width="32" height="15" rx="4" fill="url(#cartridge-body)" stroke="#afc3c9" />
          </g>
        </g>
      ))}
    </svg>
  );
}
