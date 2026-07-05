// ============================================================
// [Q]uantelix Brand — Logo Components
// ============================================================

export function QuantelixLogo({ className = "", size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const dimensions = {
    sm: { width: 130, height: 30 },
    default: { width: 260, height: 60 },
    lg: { width: 390, height: 90 },
  };
  const d = dimensions[size];

  return (
    <svg viewBox="0 0 520 120" className={className} width={d.width} height={d.height} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Bracket icon */}
      <g strokeWidth="4" fill="none">
        <path d="M15,0 L5,0 C2,0 0,2 0,5 L0,65 C0,68 2,70 5,70 L15,70" stroke="#22d3ee" />
        <path d="M65,0 L75,0 C78,0 80,2 80,5 L80,65 C80,68 78,70 75,70 L65,70" stroke="#c084fc" transform="translate(110,0) scale(-1,1) translate(-110,0)" />
        <circle cx="40" cy="35" r="20" stroke="url(#brandGrad)" strokeWidth="6" />
        <path d="M52,47 L64,60" stroke="url(#brandGrad)" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Text */}
      <g transform="translate(120, 72)" fill="#e6edf3" fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial">
        <text x="0" y="0" fontSize="36" fontWeight="bold" letterSpacing="-1">uantelix</text>
        <text x="146" y="-20" fontSize="10" fill="#8b949e">TM</text>
        <text x="3" y="24" fontSize="9.5" fontWeight="600" fill="#8b949e" letterSpacing="2">
          AGENTIC AI. <tspan fill="#a855f7">INTELLIGENCE THAT ACTS</tspan>
        </text>
      </g>
    </svg>
  );
}

export function QuantelixIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 80 80" className={className} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <g transform="translate(5, 5)" strokeWidth="5" fill="none">
        <path d="M15,0 L5,0 C2,0 0,2 0,5 L0,65 C0,68 2,70 5,70 L15,70" stroke="#22d3ee" />
        <path d="M65,0 L75,0 C78,0 80,2 80,5 L80,65 C80,68 78,70 75,70 L65,70" stroke="#c084fc" transform="translate(80,35) scale(-1,1) translate(-80,-35)" />
        <circle cx="40" cy="35" r="20" stroke="url(#iconGrad)" strokeWidth="6" />
        <path d="M52,47 L64,60" stroke="url(#iconGrad)" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
