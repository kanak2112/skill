/**
 * Catalogue, pricing (INR, GST included) and order logic for Neural Stream DS-28.
 * All people, prices and clinical figures are fictional.
 */

export const FINISHES = [
  { id: 'red', name: 'Electro-Chromic Red', hex: '#ff2a4b', code: 'ECR' },
  { id: 'cyan', name: 'Cyber Cyan', hex: '#00f0ff', code: 'CYN' },
  { id: 'gold', name: 'Matte Gold', hex: '#ffb703', code: 'GLD' },
  { id: 'slate', name: 'Stealth Slate', hex: '#334155', code: 'SLT' },
];

export const COATINGS = [
  { id: 'gloss', name: 'Glossy' },
  { id: 'satin', name: 'Satin' },
  { id: 'matte', name: 'Matte' },
];

/**
 * Placement sites. `x`, `y`, `size`, `rotate` place the shell on the 200 × 400 try-on figure.
 * Copy is written for buyers; the clinical detail lives in the Web Manual's technical section.
 */
export const NODES = [
  {
    id: 'temple',
    name: 'Temple',
    sku: 'NS-TN-28',
    bestFor: 'Hand and face skills: writing, carving, instruments',
    signal: 'Strongest signal',
    fidelity: 97,
    ohm: 0.82,
    x: 118,
    y: 42,
    size: 22,
    rotate: -10,
    helps: ['Fine finger and hand movement', 'Planning a sequence of movements', 'Timing between both hands'],
    place: ['About two fingers above and slightly in front of the top of your ear', 'Notch pointing toward the outer corner of your eye', 'On clean, dry skin with hair trimmed short'],
    tech: [['Latency', '0.8 ms'], ['Signal-to-noise', '38 dB'], ['Skin contact', '0.82 kΩ']],
  },
  {
    id: 'cervical',
    name: 'Neck',
    sku: 'NS-CR-40',
    bestFor: 'Posture and shoulder skills: lifting, standing work',
    signal: 'Good signal',
    fidelity: 89,
    ohm: 1.14,
    x: 100,
    y: 84,
    size: 20,
    rotate: 0,
    helps: ['Shoulder and upper-back stability', 'Holding posture while standing', 'Carrying and lifting'],
    place: ['Centre of the back of your neck, two finger-widths below the skull', 'Logo upright', 'Keep clear of the sweaty hairline'],
    tech: [['Latency', '1.4 ms'], ['Signal-to-noise', '31 dB'], ['Skin contact', '1.14 kΩ']],
  },
  {
    id: 'forearm',
    name: 'Forearm',
    sku: 'NS-FA-12',
    bestFor: 'Grip and wrist skills: tools, suturing, pinch grip',
    signal: 'Very good signal',
    fidelity: 93,
    ohm: 0.45,
    x: 161,
    y: 200,
    size: 20,
    rotate: 6,
    helps: ['Finger bending and grip strength', 'Steady wrist', 'Thumb-to-finger pinch'],
    place: ['Inner forearm, a hand-width below the elbow crease', 'Long edge in line with the forearm', 'Snug: two fingers should fit under the strap'],
    tech: [['Latency', '1.1 ms'], ['Signal-to-noise', '35 dB'], ['Skin contact', '0.45 kΩ']],
  },
];

/** Hardware pricing in rupees, GST included. Kit + shell = ₹48,900. */
export const PRICING = { kit: 44900, shell: 4000 };

export const DELIVERY = [
  { id: 'standard', name: 'Standard', days: [5, 7], fee: 0, note: 'Free, tracked courier' },
  { id: 'express', name: 'Express', days: [2, 2], fee: 499, note: 'Priority print and dispatch' },
];

/** Skill classes rented after delivery. `rest` is hours of rest per hour streamed. */
export const SKILLS = [
  {
    id: 'base',
    name: 'Base Motor',
    rate: 340,
    rest: 1.5,
    strain: 0.6,
    desc: 'Everyday movement: typing rhythm, walking correction, basic tool grip.',
  },
  {
    id: 'master',
    name: 'Master Craftsman',
    rate: 2150,
    rest: 3,
    strain: 1.4,
    desc: 'Fine hand skills recorded from certified tradespeople: joinery, welding, knot-tying.',
  },
  {
    id: 'virtuoso',
    name: 'Virtuoso',
    rate: 9800,
    rest: 4.5,
    strain: 2.4,
    desc: 'Concert and theatre-grade precision. Needs 40 logged hours and a clinical clearance.',
  },
];

export const ORDER_STAGES = [
  { id: 'placed', label: 'Order placed', detail: 'Payment confirmed' },
  { id: 'printing', label: 'Printing your shell', detail: 'Your custom cover is being 3D printed' },
  { id: 'qc', label: 'Quality check', detail: 'Patch tested and paired to your hardware ID' },
  { id: 'shipped', label: 'Shipped', detail: 'Handed to the courier' },
  { id: 'out', label: 'Out for delivery', detail: 'Arriving today' },
  { id: 'delivered', label: 'Delivered', detail: 'Unbox it and pair your patch' },
];

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

export const findFinish = (id) => FINISHES.find((f) => f.id === id) ?? FINISHES[0];
export function findNode(id) {
  return NODES.find((n) => n.id === id) ?? NODES[0];
}
export const findSkill = (id) => SKILLS.find((s) => s.id === id) ?? SKILLS[0];
export const findDelivery = (id) => DELIVERY.find((d) => d.id === id) ?? DELIVERY[0];

/** ₹ with Indian digit grouping (₹48,900, ₹1,23,400). */
export const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function orderTotal(deliveryId) {
  return PRICING.kit + PRICING.shell + findDelivery(deliveryId).fee;
}

/** Earliest and latest delivery dates from an order time. */
export function deliveryWindow(deliveryId, from = new Date()) {
  const d = findDelivery(deliveryId);
  const add = (n) => new Date(from.getTime() + n * 864e5);
  return [add(d.days[0]), add(d.days[1])];
}

export const shortDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** Address validation. Returns { field: message } for every problem; empty object means valid. */
export function validateAddress(a) {
  const e = {};
  if (!a.name?.trim() || a.name.trim().length < 2) e.name = 'Enter the name of the person receiving the parcel.';
  const phone = (a.phone ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(phone)) e.phone = 'Enter a 10-digit Indian mobile number, for example 98765 43210.';
  if (!a.line1?.trim() || a.line1.trim().length < 5) e.line1 = 'Enter your house or flat number and street.';
  if (!a.city?.trim()) e.city = 'Enter your city or town.';
  if (!INDIAN_STATES.includes(a.state)) e.state = 'Choose your state or union territory.';
  if (!/^[1-9]\d{5}$/.test((a.pin ?? '').trim())) e.pin = 'Enter a 6-digit PIN code. It cannot start with 0.';
  return e;
}

/** Rest time and strain for a planned stream. */
export function streamPlan(skillId, minutes) {
  const s = findSkill(skillId);
  const rest = minutes * s.rest;
  const score = Math.min(100, Math.round((minutes / 480) * 55 * s.strain + (s.strain > 2 ? 12 : 0)));
  const level = score < 34 ? 'Low' : score < 67 ? 'Medium' : 'High';
  return { cost: (s.rate * minutes) / 60, rest, score, level };
}

export function fmtMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

/** Order numbers look like NS-482913; hardware IDs like DS28-ANG-241. */
export function makeOrderNumber() {
  return `NS-${String(100000 + Math.floor(Math.random() * 900000))}`;
}

/* ───────── Hardware status, baseline and recommendations ───────── */

/** IN_TRANSIT until the courier delivers, DELIVERED once it arrives, PAIRED once the ID is entered. */
export function hardwareStatus(order) {
  if (!order) return 'NO_ORDER';
  if (order.paired) return 'PAIRED';
  return order.stage >= ORDER_STAGES.length - 1 ? 'DELIVERED' : 'IN_TRANSIT';
}

const hashStr = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);

/**
 * Baseline the patch records during calibration: how steady you hold still, how quickly your
 * muscles respond, and how long they keep a clean signal before tiring. Prototype values are
 * derived from the hardware ID and wearing spot so they stay the same for the same patch.
 */
export function measureBaseline(serial, nodeId, at = new Date()) {
  const h = hashStr(`${serial}:${nodeId}`);
  const pick = (shift, min, span) => min + ((h >>> shift) % (span + 1));
  return {
    measuredAt: at.toISOString(),
    nodeId,
    steadiness: pick(0, 58, 34), // % of the hold with tremor below threshold
    response: pick(5, 180, 90), // ms from intent to muscle response
    endurance: pick(11, 35, 85), // minutes before signal fatigue
  };
}

export const loggedMinutes = (history = []) => history.reduce((a, s) => a + s.minutes, 0);

const NODE_FIT = { base: ['temple', 'cervical', 'forearm'], master: ['temple', 'forearm'], virtuoso: ['temple'] };

/**
 * Recommend a skill and session length from the measured baseline and stream history.
 * Every rule is returned with its result so the screen can show exactly why.
 */
export function recommend(baseline, history = [], nodeId = 'temple') {
  const mins = loggedMinutes(history);
  const sessions = history.length;
  const checks = {
    base: [{ ok: true, text: 'Open to everyone' }, { ok: NODE_FIT.base.includes(nodeId), text: 'Works at any wearing spot' }],
    master: [
      { ok: mins >= 300, text: `5 hours of streaming logged (you have ${fmtMinutes(mins || 0) || '0 min'})` },
      { ok: baseline.steadiness >= 70, text: `Steadiness of 70% or more (yours: ${baseline.steadiness}%)` },
      { ok: NODE_FIT.master.includes(nodeId), text: `Worn on temple or forearm (yours: ${findNode(nodeId).name.toLowerCase()})` },
    ],
    virtuoso: [
      { ok: mins >= 2400, text: `40 hours of streaming logged (you have ${fmtMinutes(mins || 0) || '0 min'})` },
      { ok: baseline.steadiness >= 82, text: `Steadiness of 82% or more (yours: ${baseline.steadiness}%)` },
      { ok: baseline.response <= 220, text: `Response of 220 ms or faster (yours: ${baseline.response} ms)` },
      { ok: nodeId === 'temple', text: 'Worn on the temple' },
    ],
  };
  const ready = Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, v.every((c) => c.ok)]));
  const skillId = ready.virtuoso ? 'virtuoso' : ready.master ? 'master' : 'base';

  // Session length: stay inside your measured endurance, and keep the first three sessions short.
  const capByEndurance = Math.max(30, Math.floor((baseline.endurance * 2) / 15) * 15);
  const firstSessions = sessions < 3;
  const minutes = Math.min(firstSessions ? 60 : 240, capByEndurance);
  const lengthReasons = [
    { ok: true, text: `Up to twice your signal endurance of ${baseline.endurance} min, rounded down: ${fmtMinutes(capByEndurance)}` },
    { ok: !firstSessions, text: firstSessions ? `First three sessions are capped at 1 h (${sessions} done so far)` : 'Past your first three sessions' },
  ];
  return { skillId, minutes, checks, ready, lengthReasons, loggedMinutes: mins, sessions };
}
