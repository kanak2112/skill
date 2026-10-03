import { describe, expect, it } from 'vitest';
import { PRICING, deliveryWindow, fmtMinutes, inr, orderTotal, streamPlan, validateAddress, makeOrderNumber } from '../data.js';
import { makeSerial, parsePrompt, strokesToPath, traceImage } from '../shapes.js';

const good = { name: 'Asha Rao', phone: '98765 43210', line1: '12B, Lake View Apartments', line2: '', city: 'Pune', state: 'Maharashtra', pin: '411001' };

describe('pricing (INR)', () => {
  it('kit plus shell is ₹48,900 including GST', () => {
    expect(PRICING.kit + PRICING.shell).toBe(48900);
    expect(inr(48900)).toBe('₹48,900');
    expect(inr(123400)).toBe('₹1,23,400');
  });
  it('adds express delivery only when chosen', () => {
    expect(orderTotal('standard')).toBe(48900);
    expect(orderTotal('express')).toBe(49399);
  });
  it('gives a delivery window in days from the order date', () => {
    const from = new Date('2035-03-01T10:00:00Z');
    const [a, b] = deliveryWindow('standard', from);
    expect((a - from) / 864e5).toBe(5);
    expect((b - from) / 864e5).toBe(7);
  });
});

describe('address validation', () => {
  it('accepts a complete Indian address', () => {
    expect(validateAddress(good)).toEqual({});
    expect(validateAddress({ ...good, phone: '+91 98765 43210' })).toEqual({});
  });
  it('flags each invalid field with a fix-it message', () => {
    const e = validateAddress({ ...good, phone: '12345', pin: '011001', state: 'Atlantis', city: ' ' });
    expect(Object.keys(e).sort()).toEqual(['city', 'phone', 'pin', 'state']);
    expect(e.pin).toMatch(/6-digit/);
  });
});

describe('stream planning', () => {
  it('prices per hour and scales rest time by skill', () => {
    const p = streamPlan('master', 120);
    expect(p.cost).toBe(4300);
    expect(p.rest).toBe(360);
    expect(fmtMinutes(p.rest)).toBe('6 h');
    expect(fmtMinutes(90)).toBe('1 h 30 min');
  });
  it('rates long Virtuoso sessions as high strain', () => {
    expect(streamPlan('base', 30).level).toBe('Low');
    expect(streamPlan('virtuoso', 480).level).toBe('High');
  });
});

describe('shell generation', () => {
  it('reads shape, colour and finish from a description', () => {
    expect(parsePrompt('A glossy crimson anger glyph')).toMatchObject({ presetId: 'anger', finishId: 'red', coating: 'gloss' });
    expect(parsePrompt('Cyber cyan lightning bolt')).toMatchObject({ presetId: 'bolt', finishId: 'cyan' });
  });
  it('builds paths from strokes and IDs in the expected formats', () => {
    expect(strokesToPath([])).toBeNull();
    expect(strokesToPath([[[0, 0], [10, 10], [20, 0]]])).toMatch(/^M[\d.]+ [\d.]+ Q/);
    expect(makeSerial('ANG')).toMatch(/^DS28-ANG-\d{3}$/);
    expect(makeOrderNumber()).toMatch(/^NS-\d{6}$/);
  });
  it('traces an outline from an image', () => {
    const n = 10;
    const data = new Uint8ClampedArray(n * n * 4).fill(255);
    for (let y = 3; y < 7; y += 1)
      for (let x = 3; x < 7; x += 1) {
        const i = (y * n + x) * 4;
        data[i + 1] = 42;
        data[i + 2] = 75;
      }
    const r = traceImage(data, n, 60);
    expect(r.coverage).toBeCloseTo(0.16);
    expect(r.finishId).toBe('red');
  });
});

import { hardwareStatus, measureBaseline, recommend } from '../data.js';

describe('hardware status and recommendations', () => {
  it('moves from in transit to delivered to paired', () => {
    expect(hardwareStatus(null)).toBe('NO_ORDER');
    expect(hardwareStatus({ stage: 2 })).toBe('IN_TRANSIT');
    expect(hardwareStatus({ stage: 5 })).toBe('DELIVERED');
    expect(hardwareStatus({ stage: 5, paired: true })).toBe('PAIRED');
  });
  it('measures a stable baseline for the same patch and spot', () => {
    expect(measureBaseline('DS28-ANG-241', 'temple').steadiness).toBe(measureBaseline('DS28-ANG-241', 'temple').steadiness);
  });
  it('recommends Base Motor and short sessions to new users, and explains why', () => {
    const r = recommend({ steadiness: 90, response: 200, endurance: 80 }, [], 'temple');
    expect(r.skillId).toBe('base');
    expect(r.minutes).toBe(60);
    expect(r.checks.master.find((c) => !c.ok).text).toMatch(/5 hours/);
  });
  it('recommends Virtuoso only when every rule passes', () => {
    const r = recommend({ steadiness: 90, response: 200, endurance: 80 }, [{ minutes: 2500 }, { minutes: 10 }, { minutes: 10 }], 'temple');
    expect(r.skillId).toBe('virtuoso');
    expect(r.minutes).toBe(150);
  });
});
