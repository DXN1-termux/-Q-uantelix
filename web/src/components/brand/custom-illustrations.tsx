// ============================================================
// [Q]uantelix Brand — Custom Illustrations
// Fully custom SVG illustrations — no emoji
// ============================================================

export function EmptyStateIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} width="200" height="160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ie1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <g strokeWidth="3" fill="none" opacity="0.35">
        <path d="M45,30 L35,30 C32,30 30,32 30,35 L30,85 C30,88 32,90 35,90 L45,90" stroke="#22d3ee" />
        <path d="M75,30 L85,30 C88,30 90,32 90,35 L90,85 C90,88 88,90 85,90 L75,90" stroke="#c084fc" />
        <circle cx="60" cy="60" r="15" stroke="url(#ie1)" strokeWidth="3.5" />
        <path d="M70,70 L78,78" stroke="url(#ie1)" strokeWidth="3" strokeLinecap="round" />
      </g>
      {[30,50,110,140,160,170,20].map((x, i) => (
        <circle key={i} cx={x} cy={[120,130,115,125,118,135,140][i]} r={i < 2 ? 2 : i < 5 ? 1.5 : 1} fill="#30363d" />
      ))}
      <circle cx="160" cy="30" r="8" fill="none" stroke="#30363d" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
    </svg>
  );
}

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <g transform="translate(40,40)">
        <circle cx="0" cy="0" r="25" fill="none" stroke="#21262d" strokeWidth="4" />
        <circle cx="0" cy="0" r="25" fill="none" stroke="url(#spinnerGrad)" strokeWidth="4"
          strokeDasharray="39.27 157.08" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </g>
      <circle cx="40" cy="40" r="4" fill="url(#spinnerGrad)" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function ErrorIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} width="160" height="120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="errGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f85149" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <g strokeWidth="3" fill="none" opacity="0.4">
        <path d="M45,20 L35,20 C32,20 30,22 30,25 L30,70 C30,73 32,75 35,75 L45,75" stroke="#f85149" opacity="0.6" />
        <path d="M75,20 L85,20 C88,20 90,22 90,25 L90,70 C90,73 88,75 85,75 L75,75" stroke="#c084fc" opacity="0.6" />
        <circle cx="60" cy="48" r="15" stroke="url(#errGrad)" strokeWidth="3.5" />
      </g>
      <g stroke="#f85149" strokeWidth="3" strokeLinecap="round" opacity="0.5">
        <line x1="55" y1="43" x2="65" y2="53" />
        <line x1="65" y1="43" x2="55" y2="53" />
      </g>
      <circle cx="60" cy="48" r="22" fill="none" stroke="#f85149" strokeWidth="1" opacity="0.2">
        <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function ThinkingAgent({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="thinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <g strokeWidth="2.5" fill="none">
        <path d="M8,5 L5,5 C3.5,5 2.5,6 2.5,7.5 L2.5,22.5 C2.5,24 3.5,25 5,25 L8,25" stroke="#22d3ee" />
        <path d="M17,5 L20,5 C21.5,5 22.5,6 22.5,7.5 L22.5,22.5 C22.5,24 21.5,25 20,25 L17,25" stroke="#c084fc" />
        <circle cx="12.5" cy="15" r="5" stroke="url(#thinkGrad)" />
      </g>
      <circle cx="12.5" cy="15" r="5" fill="url(#thinkGrad)" opacity="0.1">
        <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.1;0.05;0.1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function ToolIcon({ name = "" }: { name?: string }) {
  const icons: Record<string, React.ReactNode> = {};
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <g stroke="#8b949e" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {name.includes("code") || name.includes("file") ? (
          <>
            <path d="M2,4 L6,8 L2,12" />
            <line x1="8" y1="12" x2="14" y2="12" />
          </>
        ) : name.includes("terminal") || name.includes("command") ? (
          <>
            <path d="M3,5 L6,8 L3,11" />
            <line x1="8" y1="11" x2="13" y2="11" />
          </>
        ) : name.includes("web") || name.includes("search") ? (
          <>
            <circle cx="7" cy="7" r="3.5" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" />
          </>
        ) : name.includes("git") ? (
          <>
            <circle cx="5" cy="4" r="1.5" />
            <circle cx="11" cy="4" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <line x1="6.5" y1="4" x2="9.5" y2="4" />
            <line x1="5" y1="5.5" x2="5" y2="10.5" />
          </>
        ) : name.includes("docker") ? (
          <>
            <rect x="2" y="6" width="3" height="3" rx="0.5" />
            <rect x="6" y="6" width="3" height="3" rx="0.5" />
            <rect x="6" y="10" width="3" height="3" rx="0.5" />
            <rect x="10" y="6" width="3" height="3" rx="0.5" />
          </>
        ) : (
          <>
            <circle cx="8" cy="8" r="4.5" />
            <line x1="11" y1="11" x2="14" y2="14" />
          </>
        )}
      </g>
    </svg>
  );
}
