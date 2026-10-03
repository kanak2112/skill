/** Neural Stream mark: brass ring around a motor waveform. */
export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="#E2B168" strokeOpacity="0.5" />
      <path d="M8 17h3l2-5 3 9 2.5-7 1.5 3H24" fill="none" stroke="#E2B168" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
