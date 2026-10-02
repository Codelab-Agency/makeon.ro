export default function AmbientOrbit() {
  return (
    <div className="ambient-orbit" aria-hidden="true">
      <svg viewBox="0 0 400 400" fill="none">
        <circle cx="200" cy="200" r="178" />
        <circle cx="200" cy="200" r="146" strokeDasharray="2 10" />
        <circle cx="200" cy="200" r="112" />
        <path d="M200 12v16M200 372v16M12 200h16M372 200h16" />
        <circle className="orbit-point" cx="200" cy="22" r="3" />
        <circle className="orbit-point" cx="54" cy="200" r="2" />
      </svg>
    </div>
  );
}
