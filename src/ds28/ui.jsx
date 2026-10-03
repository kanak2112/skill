/** Small shared building blocks so every screen uses the same card, label and section rhythm. */
export const Card = ({ as: Tag = 'section', className = '', children, ...rest }) => (
  <Tag className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`} {...rest}>
    {children}
  </Tag>
);

export const Label = ({ children, className = '' }) => <p className={`text-section text-muted ${className}`}>{children}</p>;

export const Title = ({ children, className = '' }) => (
  <h2 className={`text-[22px] font-medium leading-tight tracking-[-0.015em] ${className}`} style={{ fontVariationSettings: "'opsz' 24" }}>
    {children}
  </h2>
);

export const PageHead = ({ step, title, children }) => (
  <header className="mb-6">
    {step && <p className="text-section text-accent">{step}</p>}
    <h1 className="mt-1 text-balance text-[clamp(26px,3.4vw,34px)] font-medium leading-tight tracking-[-0.02em]" style={{ fontVariationSettings: "'opsz' 36" }}>
      {title}
    </h1>
    {children && <p className="mt-2 max-w-[62ch] text-body text-muted">{children}</p>}
  </header>
);

/** Locked feature placeholder: says what it is, why it is locked, and what unlocks it. */
export const Locked = ({ icon = 'lock', title, children, action }) => (
  <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line bg-canvas p-5">
    <span className="grid h-10 w-10 place-items-center rounded-full border border-line text-muted">
      <span className="icon" style={{ fontSize: 20 }} aria-hidden="true">{icon}</span>
    </span>
    <p className="text-title text-ink">{title}</p>
    <p className="max-w-[56ch] text-body text-muted">{children}</p>
    {action}
  </div>
);
