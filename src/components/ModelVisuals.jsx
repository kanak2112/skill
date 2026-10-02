import Icon from './Icon.jsx';

/** Provenance badge: Human expert / Composite / Synthetic model. Full pill, sentence case. */
export function TypeBadge({ label, className = '' }) {
  return <span className={`tag bg-canvas/75 text-ink ring-1 ring-ink/15 backdrop-blur-sm ${className}`}>{label}</span>;
}

export function VerifiedCrest({ size = 16, className = '' }) {
  return <Icon name="verified" size={size} className={`text-accent ${className}`} label="Verified expert" />;
}

/** Expert signature watermark for human-expert models. */
export function SignatureWatermark({ name, className = '' }) {
  const short = name.replace(/^(Chef|Dr\.|Adv\.)\s+/, '');
  return (
    <div className={`pointer-events-none select-none text-ink/35 ${className}`} aria-hidden="true">
      <span className="block -skew-x-12 whitespace-nowrap text-[17px] font-light tracking-tight">{short}</span>
      <svg viewBox="0 0 120 14" className="-mt-1 h-3 w-24" fill="none">
        <path d="M2 9 C 30 2, 50 14, 76 7 S 110 3, 118 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
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

/** Node-network overlay for combined models. */
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
          stroke="rgba(241,245,249,0.22)"
          strokeWidth="0.4"
        />
      ))}
      {NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#F1F5F9" className="animate-node-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
    </svg>
  );
}

/** Wireframe grid overlay for AI-generated models. */
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
      stroke="rgba(241,245,249,0.12)"
      strokeWidth="0.4"
      aria-hidden="true"
    >
      {lines}
    </svg>
  );
}

/** Slow light sweep used as the AI-generated tile border. */
export function ShimmerBorder({ children, className = '', radius = 'rounded-xl' }) {
  return (
    <div className={`relative overflow-hidden p-px ${radius} ${className}`}>
      <div
        className="absolute -inset-1/2 animate-shimmer"
        style={{
          background:
            'conic-gradient(from 0deg, #222A38, rgba(241,245,249,0.5) 8%, rgba(226,177,104,0.3) 13%, #222A38 24%, #222A38 58%, rgba(241,245,249,0.3) 68%, #222A38 78%)',
        }}
        aria-hidden="true"
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
