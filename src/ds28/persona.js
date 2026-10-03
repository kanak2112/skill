/**
 * On-device persona profiler. It reads only the text the user types (a handle or a short
 * self-description); nothing is fetched or sent anywhere. Archetypes come from keyword
 * signals, with a stable hash as tie-breaker so the same input always gives the same result.
 */
import { findSkill } from './data.js';

export const TRAITS = [
  { id: 'precision', label: 'Precision' },
  { id: 'strength', label: 'Strength' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'composure', label: 'Composure' },
  { id: 'focus', label: 'Focus' },
  { id: 'creativity', label: 'Creativity' },
];

export const ARCHETYPES = [
  {
    id: 'strategist',
    title: 'Logical Strategist',
    words: ['code', 'coder', 'engineer', 'developer', 'software', 'data', 'math', 'logic', 'chess', 'systems', 'ai', 'ml', 'programmer', 'analyst'],
    base: { precision: 52, strength: 28, endurance: 34, composure: 58, focus: 72, creativity: 46 },
  },
  {
    id: 'academic',
    title: 'Academic Explorer',
    words: ['research', 'researcher', 'phd', 'student', 'professor', 'science', 'scientist', 'study', 'university', 'learning', 'reader', 'books', 'history'],
    base: { precision: 44, strength: 24, endurance: 38, composure: 52, focus: 68, creativity: 58 },
  },
  {
    id: 'maker',
    title: 'Creative Maker',
    words: ['art', 'artist', 'design', 'designer', 'music', 'musician', 'paint', 'photo', 'photographer', 'film', 'writer', 'craft', 'fashion', 'illustrator'],
    base: { precision: 48, strength: 26, endurance: 36, composure: 40, focus: 50, creativity: 82 },
  },
  {
    id: 'kinetic',
    title: 'Kinetic Competitor',
    words: ['gym', 'athlete', 'runner', 'climber', 'sport', 'sports', 'football', 'fitness', 'lifting', 'cyclist', 'boxing', 'hiking', 'soccer'],
    base: { precision: 40, strength: 66, endurance: 72, composure: 46, focus: 50, creativity: 34 },
  },
  {
    id: 'carer',
    title: 'Clinical Carer',
    words: ['nurse', 'doctor', 'medic', 'medicine', 'health', 'care', 'therapist', 'paramedic', 'vet', 'clinic', 'hospital'],
    base: { precision: 56, strength: 36, endurance: 54, composure: 70, focus: 60, creativity: 38 },
  },
  {
    id: 'operator',
    title: 'Pragmatic Operator',
    words: ['founder', 'manager', 'startup', 'business', 'sales', 'marketing', 'ops', 'operations', 'lead', 'ceo', 'product', 'finance'],
    base: { precision: 38, strength: 40, endurance: 50, composure: 62, focus: 58, creativity: 50 },
  },
];

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 17);
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

/** Analyse a handle or bio. Returns null for empty input. */
export function analyzePersona(input) {
  const text = input.trim();
  if (!text) return null;
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const scored = ARCHETYPES.map((a, i) => ({
    a,
    hits: words.filter((w) => a.words.includes(w)),
    tie: (hash(text) + i * 7) % ARCHETYPES.length,
  })).sort((x, y) => y.hits.length - x.hits.length || x.tie - y.tie);

  const [first, second] = scored;
  const h = hash(text);
  // Small deterministic variation so two people with the same archetype differ a little.
  const traits = Object.fromEntries(
    Object.entries(first.a.base).map(([k, v], i) => {
      const blend = second.hits.length ? (second.a.base[k] - v) * 0.3 : 0;
      return [k, clamp(v + blend + (((h >> (i * 3)) & 15) - 7))];
    }),
  );

  return {
    input: text,
    handle: text.startsWith('@') ? text.split(/\s/)[0] : null,
    primary: first.a.title,
    secondary: second.a.title,
    title: `${first.a.title} / ${second.a.title}`,
    signals: [...new Set([...first.hits, ...second.hits])].slice(0, 6),
    inferred: first.hits.length === 0,
    traits,
  };
}

/** Apply a skill's boost to a trait profile. Rentals give the full boost only while streaming. */
export function evolvePersona(persona, skillId) {
  const skill = findSkill(skillId);
  const traits = Object.fromEntries(
    Object.entries(persona.traits).map(([k, v]) => [k, clamp(v + (skill.boost[k] ?? 0))]),
  );
  const before = Object.values(persona.traits).reduce((a, b) => a + b, 0);
  const after = Object.values(traits).reduce((a, b) => a + b, 0);
  return { title: skill.evolves, note: skill.evolvesNote, traits, gain: Math.round(((after - before) / before) * 100) };
}

export const SAMPLE_PERSONAS = [
  '@nova.codes · software engineer, chess on weekends, reading about AI research',
  'Illustrator and amateur woodworker who wants steadier hands',
  'ICU nurse, night shifts, trail runner',
];
