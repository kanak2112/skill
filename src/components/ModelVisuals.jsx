import { BadgeCheck, Cpu, Layers, User } from 'lucide-react';

const BADGE_STYLE = {
  personal: { cls: 'bg-cyan/15 text-cyan ring-1 ring-cyan/40', icon: User },
  composite: { cls: 'bg-accent/15 text-[#7DD3FC] ring-1 ring-accent/40', icon: Layers },
  synthetic: { cls: 'bg-ink/10 text-ink ring-1 ring-ink/30', icon: Cpu },
};

export function TypeBadge({ type, label, size = 'sm' }) {
  const { cls, icon: Icon } = BADGE_STYLE[type];
  const sz = size === 'sm' ? 'gap-1 px-1.5 py-0.5 text-[10px]' : 'gap-1.5 px-2 py-1 text-[12px]';
  return (
    <span className={`inline-flex items-center rounded-md font-medium backdrop-blur-sm ${sz} ${cls}`}>
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  );
}

export function VerifiedCrest({ className = 'h-5 w-5' }) {
  return (
    <BadgeCheck className={`${className} fill-gold text-canvas`} strokeWidth={2} aria-label="Verified expert" role="img" />
  );
}

export function NoOwnerTag() {
  return (
    <span className="inline-flex items-center rounded-md bg-canvas/70 px-1.5 py-0.5 text-[9px] font-medium text-ink ring-1 ring-ink/25 backdrop-blur-sm">
      No human owner
    </span>
  );
}

/** Expert signature watermark for personal models. */
export function SignatureWatermark({ name, className = '' }) {
  const short = name.replace(/^(Chef|Dr\.|Adv\.)\s+/, '');
  return (
    <div className={`pointer-events-none select-none text-ink/40 ${className}`} aria-hidden="true">
      <span className="block -skew-x-12 whitespace-nowrap text-[17px] font-light tracking-tight">{short}</span>
      <svg viewBox="0 0 120 14" className="-mt-1 h-3 w-24" fill="none">
        <path d="M2 9 C 30 2, 50 14, 76 7 S 110 3, 118 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

const NODES = [
  [18, 22],
  [52, 14],
  [82, 30],
  [30, 52],
  [70, 58],
  [14, 82],
  [50, 86],
  [86, 78],
];
const EDGES = [
  [0, 1],
  [1, 2],
  [0, 3],
  [1, 3],
  [1, 4],
  [2, 4],
  [3, 5],
  [3, 6],
  [4, 6],
  [4, 7],
  [6, 7],
  [5, 6],
];

/** Node-network overlay for composite models. */
export function NodeNetwork({ className = '' }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`pointer-events-none ${className}`} aria-hidden="true">
      {EDGES.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={NODES[a][0]}
          y1={NODES[a][1]}
          x2={NODES[b][0]}
          y2={NODES[b][1]}
          stroke="rgba(125,211,252,0.35)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {NODES.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="1.6"
          fill="#7DD3FC"
          className="animate-node-pulse"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </svg>
  );
}

/** Wireframe grid overlay for synthetic models. */
export function Wireframe({ className = '' }) {
  const lines = [];
  for (let i = 0; i <= 10; i++) {
    lines.push(<line key={`v${i}`} x1={50 + (i - 5) * 4} y1="38" x2={50 + (i - 5) * 22} y2="100" />);
  }
  [40, 44, 50, 58, 68, 82, 100].forEach((y) => lines.push(<line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} />));
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none ${className}`}
      stroke="rgba(248,250,252,0.16)"
      strokeWidth="0.5"
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
    >
      {lines}
    </svg>
  );
}

/** Rotating light sweep used as the synthetic tile border. */
export function ShimmerBorder({ children, className = '', radius = 'rounded-xl' }) {
  return (
    <div className={`relative overflow-hidden p-[1.5px] ${radius} ${className}`}>
      <div
        className="absolute -inset-1/2 animate-shimmer"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(148,163,184,0.15), rgba(248,250,252,0.85) 10%, rgba(34,211,238,0.5) 16%, rgba(148,163,184,0.15) 28%, rgba(148,163,184,0.15) 60%, rgba(248,250,252,0.6) 70%, rgba(148,163,184,0.15) 80%)',
        }}
        aria-hidden="true"
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
