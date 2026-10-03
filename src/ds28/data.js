/** Catalogue data for the Neural Stream DS-28 storefront and Web Manual. All values are fictional. */

export const FINISHES = [
  { id: 'red', name: 'Electro-Chromic Red', hex: '#ff2a4b', ui: '#ff2a4b', code: 'ECR' },
  { id: 'cyan', name: 'Cyber Cyan', hex: '#00f0ff', ui: '#00f0ff', code: 'CYN' },
  { id: 'gold', name: 'Matte Gold', hex: '#ffb703', ui: '#ffb703', code: 'GLD' },
  // Slate is too dark to carry UI text on the #06070a canvas, so the console uses a lifted tint.
  { id: 'slate', name: 'Stealth Slate', hex: '#334155', ui: '#8fa3bf', code: 'SLT' },
];

export const COATINGS = [
  { id: 'gloss', name: 'Glossy metallic' },
  { id: 'satin', name: 'Satin' },
  { id: 'matte', name: 'Matte' },
];

/**
 * Placement nodes on the try-on silhouette (200 × 400 user units).
 * `size` is the rendered patch width at that node; `rotate` follows the local anatomy.
 */
export const NODES = [
  {
    id: 'temple',
    name: 'Temple Node',
    short: 'Temple',
    ohm: 0.82,
    latency: 4.2,
    depth: '1.8 mm',
    target: 'Temporalis / trigeminal V2 branch',
    x: 118,
    y: 42,
    size: 22,
    rotate: -10,
  },
  {
    id: 'cervical',
    name: 'Cervical Neck',
    short: 'Cervical',
    ohm: 1.14,
    latency: 5.6,
    depth: '2.4 mm',
    target: 'Sternocleidomastoid / C3–C5 rootlets',
    x: 100,
    y: 84,
    size: 20,
    rotate: 0,
  },
  {
    id: 'forearm',
    name: 'Forearm Flexor',
    short: 'Forearm',
    ohm: 0.45,
    latency: 2.9,
    depth: '1.2 mm',
    target: 'Flexor digitorum superficialis',
    x: 161,
    y: 200,
    size: 20,
    rotate: 6,
  },
];

export const SKILLS = [
  {
    id: 'craftsman',
    name: 'Master Craftsman',
    override: 75,
    rate: 48,
    monthly: 199,
    evolves: 'Master Artisan',
    evolvesNote: 'sub-millimetre precision',
    blurb: 'Joinery, carving and fine hand-tool control. Shared agency: you steer, the stream steadies.',
    boost: { precision: 34, creativity: 16, composure: 10, focus: 8 },
  },
  {
    id: 'surgeon',
    name: 'Virtuoso Surgeon',
    override: 90,
    rate: 120,
    monthly: 499,
    evolves: 'Bio-Mechanical Virtuoso',
    evolvesNote: 'suppressed tremor noise',
    blurb: 'Sub-millimetre suturing and instrument tremor suppression. Licensed theatres only.',
    boost: { precision: 44, composure: 34, focus: 22 },
  },
  {
    id: 'heavy',
    name: 'Autonomous Heavy',
    override: 98,
    rate: 250,
    monthly: 899,
    evolves: 'High-Load Industrial Operative',
    evolvesNote: 'full-body load control',
    blurb: 'Full-body load handling and rigging. Near-total motor override; you ride along.',
    boost: { strength: 52, endurance: 42, composure: 6, precision: 10 },
  },
];

/** Hours a monthly subscription includes before the fair-use cap. */
export const MONTHLY_HOURS = 40;

/** Price of a plan as billed at checkout: prepaid hours for rentals, first month for subscriptions. */
export function planPrice(plan) {
  const skill = findSkill(plan.skillId);
  return plan.billing === 'monthly' ? skill.monthly : skill.rate * plan.hours;
}

export function planLabel(plan) {
  const skill = findSkill(plan.skillId);
  return plan.billing === 'monthly'
    ? `${skill.name} · Monthly subscription`
    : `${skill.name} · ${plan.hours} h rental`;
}

export const PRICING = { core: 280, shell: 60 };

export const findFinish = (id) => FINISHES.find((f) => f.id === id) ?? FINISHES[0];
export const findNode = (id) => NODES.find((n) => n.id === id) ?? NODES[0];
export const findSkill = (id) => SKILLS.find((s) => s.id === id) ?? SKILLS[0];

/** Mandatory biological cooldown: 1.5 × stream time, weighted by how much motor control was overridden. */
export function cooldownHours(hours, override) {
  return Math.max(1, hours * (override / 100) * 1.5);
}

export function formatHours(h) {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return mm ? `${hh}h ${String(mm).padStart(2, '0')}m` : `${hh}h`;
}

export const usd = (n) => `$${n.toLocaleString('en-US')}`;
