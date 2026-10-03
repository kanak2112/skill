export default function Logo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2 L29 9.5 V22.5 L16 30 L3 22.5 V9.5 Z" fill="none" stroke="#1d2333" strokeWidth="1.5" />
      <path d="M16 6 L25.5 11.5 V20.5 L16 26 L6.5 20.5 V11.5 Z" fill="none" stroke="#00f0ff" strokeWidth="1.2" />
      <path d="M11 19 L14 13 L17 18 L20 12 L22 15" fill="none" stroke="#ff2a4b" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}
