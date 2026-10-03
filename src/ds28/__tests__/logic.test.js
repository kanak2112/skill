import { describe, expect, it } from 'vitest';
import { PRICING, cooldownHours, formatHours, planPrice, planLabel, SKILLS } from '../data.js';
import { analyzePersona, evolvePersona, TRAITS } from '../persona.js';
import { makeSerial, parsePrompt, strokesToPath, traceImage } from '../shapes.js';

describe('pricing', () => {
  it('hardware totals $340', () => {
    expect(PRICING.core + PRICING.shell).toBe(340);
  });
  it('prices rentals per hour and subscriptions per month', () => {
    expect(planPrice({ skillId: 'surgeon', billing: 'rental', hours: 3 })).toBe(360);
    expect(planPrice({ skillId: 'heavy', billing: 'monthly', hours: 3 })).toBe(899);
    expect(SKILLS.map((s) => [s.rate, s.monthly])).toEqual([[48, 199], [120, 499], [250, 899]]);
    expect(planLabel({ skillId: 'craftsman', billing: 'rental', hours: 2 })).toBe('Master Craftsman · 2 h rental');
  });
  it('scales cooldown with override and never drops below an hour', () => {
    expect(cooldownHours(6, 90)).toBeCloseTo(8.1);
    expect(cooldownHours(0.1, 75)).toBe(1);
    expect(formatHours(8.1)).toBe('8h 06m');
    expect(formatHours(3)).toBe('3h');
  });
});

describe('persona profiler', () => {
  it('returns null for empty input', () => {
    expect(analyzePersona('   ')).toBeNull();
  });
  it('detects archetypes from keywords and is deterministic', () => {
    const a = analyzePersona('software engineer who reads AI research papers at university');
    expect(a.primary).toBe('Logical Strategist');
    expect(a.secondary).toBe('Academic Explorer');
    expect(analyzePersona('software engineer who reads AI research papers at university')).toEqual(a);
  });
  it('keeps traits within 0–100 after evolution', () => {
    const p = analyzePersona('athlete gym runner climber');
    const e = evolvePersona(p, 'heavy');
    expect(e.title).toBe('High-Load Industrial Operative');
    for (const t of TRAITS) {
      expect(e.traits[t.id]).toBeGreaterThanOrEqual(p.traits[t.id]);
      expect(e.traits[t.id]).toBeLessThanOrEqual(100);
    }
    expect(e.gain).toBeGreaterThan(0);
  });
});

describe('shape generation', () => {
  it('parses the sample voice prompt', () => {
    const r = parsePrompt('A glossy crimson anger glyph');
    expect(r).toMatchObject({ presetId: 'anger', finishId: 'red', coating: 'gloss' });
    expect(parsePrompt('Cyber cyan lightning bolt')).toMatchObject({ presetId: 'bolt', finishId: 'cyan' });
  });
  it('builds a path from strokes and serials in the DS28-XXX-000 format', () => {
    expect(strokesToPath([])).toBeNull();
    expect(strokesToPath([[[0, 0], [10, 10], [20, 0]]])).toMatch(/^M[\d.]+ [\d.]+ Q/);
    expect(makeSerial('ANG')).toMatch(/^DS28-ANG-\d{3}$/);
  });
  it('traces an opaque square on a white background', () => {
    const n = 10;
    const data = new Uint8ClampedArray(n * n * 4).fill(255);
    for (let y = 3; y < 7; y += 1)
      for (let x = 3; x < 7; x += 1) {
        const i = (y * n + x) * 4;
        data[i] = 255; data[i + 1] = 42; data[i + 2] = 75;
      }
    const r = traceImage(data, n, 60);
    expect(r.coverage).toBeCloseTo(0.16);
    expect(r.finishId).toBe('red');
    expect(r.d).toContain('M');
  });
});
