import PatchSVG from './PatchSVG.jsx';
import { NODES } from '../data.js';

const BODY =
  'M100 92 C120 92 138 94 146 102 C156 110 160 130 162 160 L168 215 C170 235 172 250 170 262 C166 270 158 268 158 260 ' +
  'L154 222 C152 205 148 185 144 168 L142 150 C140 170 138 190 136 205 C134 220 138 232 140 245 L136 330 C135 360 134 380 132 392 ' +
  'L110 392 L104 270 Q100 260 96 270 L90 392 L68 392 C66 380 65 360 64 330 L60 245 C62 232 66 220 64 205 C62 190 60 170 58 150 ' +
  'L56 168 C52 185 48 205 46 222 L42 260 C42 268 34 270 30 262 C28 250 30 235 32 215 L38 160 C40 130 44 110 54 102 C62 94 80 92 100 92 Z';

const ZOOM = 2.1;

/** Front-view silhouette with interactive placement nodes and the live patch overlay. */
export default function BodyPreview({ shape, color, coating, nodeId, onNode, zoom = false, glow = 0.7 }) {
  const node = NODES.find((n) => n.id === nodeId) ?? NODES[0];
  // Zoom keeps the selected node at the viewport centre.
  const view = zoom
    ? `translate(${100 - node.x * ZOOM}px, ${200 - node.y * ZOOM - 20}px) scale(${ZOOM})`
    : 'translate(0px, 0px) scale(1)';

  return (
    <svg viewBox="0 0 200 400" className="body-svg" role="img" aria-label={`Try-on preview, patch on ${node.name}`}>
      <defs>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2030" />
          <stop offset="1" stopColor="#0d1018" />
        </linearGradient>
        <pattern id="bodyGrid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" fill="none" stroke="#2a3246" strokeWidth="0.3" />
        </pattern>
        <clipPath id="bodyClip">
          <path d={BODY} />
          <ellipse cx="100" cy="46" rx="21" ry="27" />
          <path d="M90 66 L110 66 L112 96 L88 96 Z" />
        </clipPath>
      </defs>

      <g style={{ transform: view, transformOrigin: '0 0', transition: 'transform 700ms cubic-bezier(.2,.8,.2,1)' }}>
        <g clipPath="url(#bodyClip)">
          <rect width="200" height="400" fill="url(#bodyFill)" />
          <rect width="200" height="400" fill="url(#bodyGrid)" />
          {/* Topology contours */}
          {[60, 120, 180, 240, 300, 360].map((y) => (
            <ellipse key={y} cx="100" cy={y} rx="80" ry="7" fill="none" stroke="#2f3a52" strokeWidth="0.5" />
          ))}
        </g>
        <g fill="none" stroke="#3a4560" strokeWidth="0.8">
          <path d={BODY} />
          <ellipse cx="100" cy="46" rx="21" ry="27" />
          <path d="M91 70 L89 94 M109 70 L111 94" />
        </g>
        {/* Face hints */}
        <g stroke="#3a4560" strokeWidth="0.6" fill="none">
          <path d="M90 42 h6 M104 42 h6 M97 56 q3 2 6 0" />
        </g>

        {NODES.map((n) => {
          const on = n.id === node.id;
          return (
            <g
              key={n.id}
              className="body-node"
              onClick={() => onNode?.(n.id)}
              role="button"
              tabIndex={-1}
              aria-label={n.name}
            >
              <circle cx={n.x} cy={n.y} r={on ? 15 : 7} fill="none" stroke={on ? color : '#00f0ff'} strokeOpacity={on ? 0.5 : 0.7} strokeWidth="0.6" className="node-ring" />
              {!on && <circle cx={n.x} cy={n.y} r="2.2" fill="#00f0ff" />}
              <circle cx={n.x} cy={n.y} r="12" fill="transparent" />
            </g>
          );
        })}

        <g
          style={{
            transform: `translate(${node.x}px, ${node.y}px) rotate(${node.rotate}deg)`,
            transition: 'transform 650ms cubic-bezier(.2,.8,.2,1)',
          }}
        >
          <g key={node.id} className="patch-pop">
            <PatchSVG
              shape={shape}
              color={color}
              coating={coating}
              glow={glow}
              x={-node.size / 2}
              y={-node.size / 2}
              width={node.size}
              height={node.size}
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
