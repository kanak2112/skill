// "Eight Days": a scenario film of the Knack interface, captured frame by frame at 30 fps.
// DRY=1 saves only every 15th frame, for checking the flow quickly.
import { open } from './serve.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const DIR = new URL('.', import.meta.url).pathname;
const FPS = 30;
const DRY = !!process.env.DRY;
const OUT = DIR + (DRY ? 'dry/' : 'frames/');
// Sharding: SHARD=k of SHARDS=n replays the whole story but saves only frames in its slice,
// so several browsers can render one film in parallel.
const SHARDS = +process.env.SHARDS || 1, SHARD = +process.env.SHARD || 0, TOTAL = +process.env.TOTAL || 5500;
const FROM = Math.floor((TOTAL * SHARD) / SHARDS), TO = SHARD === SHARDS - 1 ? Infinity : Math.floor((TOTAL * (SHARD + 1)) / SHARDS);
if (SHARD === 0) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const { b, p, errs, ctx } = await open({ width: 1440, height: 810, scale: 4 / 3, init: { path: DIR + 'clock.js' }, waitRoot: false });
const cdp = await ctx.newCDPSession(p);
let frame = 0;
const subs = [];
let capOpen = null;

const adv = (ms) => p.evaluate((ms) => window.__advance(ms), ms);
async function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    if (frame >= TO) { await b.close(); console.log('shard', SHARD, 'done at', frame); process.exit(0); }
    await adv(1000 / FPS);
    if (frame >= FROM && (!DRY || frame % 15 === 0)) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
      writeFileSync(`${OUT}${String(frame).padStart(6, '0')}.jpg`, Buffer.from(data, 'base64'));
    }
    frame++;
  }
}
const hold = (s) => tick(Math.round(s * FPS));
async function settle(ms) { for (let t = 0; t < ms; t += 100) await adv(100); }

async function cap(text) {
  if (capOpen) { capOpen.end = frame; subs.push(capOpen); capOpen = null; }
  if (text) capOpen = { start: frame, text };
  await p.evaluate((t) => window.__cap(t), text || '');
}
async function card(c, seconds) {
  await cap(null);
  await p.evaluate((c) => window.__card(c), c);
  if (c) subs.push({ start: frame, end: frame + Math.round(seconds * FPS), text: [c.title, c.body].filter(Boolean).join(' ') });
  await hold(seconds);
}
async function uncard(s = 0.8) { await p.evaluate(() => window.__card(null)); await hold(s); }

let mouse = { x: 720, y: 760 };
async function glide(x, y, s = 0.8) {
  const n = Math.max(1, Math.round(s * FPS)), from = { ...mouse };
  for (let i = 1; i <= n; i++) {
    const k = i / n, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    mouse = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
    await p.mouse.move(mouse.x, mouse.y);
    await tick(1);
  }
}
async function box(sel) {
  const l = p.locator(sel).first();
  const bb = await l.boundingBox();
  if (!bb) throw new Error('not found: ' + sel);
  return bb;
}
async function scrollBy(dy, s = 0.9) {
  const y0 = await p.evaluate(() => window.scrollY);
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const y1 = Math.max(0, Math.min(max, y0 + dy));
  const n = Math.max(1, Math.round(s * FPS));
  for (let i = 1; i <= n; i++) {
    const k = i / n, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await p.evaluate((y) => window.scrollTo(0, y), y0 + (y1 - y0) * e);
    await tick(1);
  }
}
async function reveal(sel, pad = 140) {
  const bb = await box(sel);
  if (bb.y < pad) await scrollBy(bb.y - pad);
  else if (bb.y + bb.height > 810 - pad) await scrollBy(bb.y + bb.height - (810 - pad));
  return box(sel);
}
async function click(sel, { s = 0.7, dx = 0.5, dy = 0.5, pause = 0.25 } = {}) {
  const bb = await reveal(sel);
  await glide(bb.x + bb.width * dx, bb.y + bb.height * dy, s);
  await hold(pause);
  await p.mouse.down(); await tick(3); await p.mouse.up(); await tick(2);
}
async function type(text, perChar = 2) { for (const ch of text) { await p.keyboard.type(ch); await tick(perChar); } }
async function key(k) { await p.keyboard.press(k); await tick(1); }

// ── Load and warm up (not recorded) ──
await settle(400);
for (let i = 0; i < 300 && !(await p.evaluate(() => document.querySelector('#root') && document.querySelector('#root').children.length)); i++) await settle(100);
await p.evaluate(() => { localStorage.clear(); window.__mountFilm(); window.__card({ eyebrow: '', title: '' }); });
await settle(900);
await p.keyboard.press('p'); await settle(2500);
for (let i = 0; i < 80; i++) await adv(1000 / FPS); // let the head load and settle
await p.mouse.move(mouse.x, mouse.y);

// ── 0. Titles ──
await card({ eyebrow: 'Knack · a design fiction', title: 'Eight Days', body: 'Pune, November 2035.' }, 4);
await card({ eyebrow: 'Day 1', title: 'Asha Rao is 34. She has cooked at home all her life.', body: 'On Monday she starts a trial shift in a restaurant kitchen. She has never held a knife the way chefs do.', small: true }, 6.5);

// ── 1. The offer ──
await uncard(1.2);
await cap('Her cousin sends her a link: a skin patch that lets you rent an expert’s hands, by the hour.');
await hold(4.6);
await cap('It sits on the temple, and reads the signals your brain sends to your muscles.');
await hold(3.6);
await click('button:has-text("Get yours now")', { s: 1 });
await cap(null);
await hold(1.6);

// ── 2. The shell ──
await cap('First, the patch needs a shell. Asha describes hers.');
await hold(1.5);
await click('#prompt', { s: 0.8 });
await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await tick(4);
await type('A satin saffron tear drop', 2);
await click('button:has-text("Create")', { s: 0.5 });
await hold(2.2);
await cap('It is printed for her, and she can see it on a model of a head before she pays.');
const stage = await box('canvas');
await glide(stage.x + stage.width * 0.55, stage.y + stage.height * 0.45, 0.8);
await p.mouse.down();
await glide(stage.x + stage.width * 0.35, stage.y + stage.height * 0.47, 1.6);
await p.mouse.up();
await hold(2.4);
await click('button:has-text("Buy now")', { s: 1 });
await cap(null);
await hold(0.6);

// ── 3. Checkout ──
await cap('₹48,900 for the patch and her shell. The patch is hers to keep. The skills are not.');
await click('#f-name', { s: 0.8 });
await type('Asha Rao', 2);
await p.fill('#f-phone', '98230 41187'); await p.fill('#f-pin', '411038');
await p.fill('#f-street', '7, Sai Krupa Society, Paud Road'); await p.fill('#f-city', 'Pune');
await p.selectOption('#f-state', 'Maharashtra');
await tick(8);
await hold(2.5);
await cap('She has eight days. She pays extra for a drone drop tomorrow.');
await click('button[role=radio]:has-text("Drone drop")', { s: 0.9 });
await hold(1.6);
await click('button:has-text("Place order")', { s: 0.9 });
await cap(null);
await hold(1.2);
await cap('Her shell is printed overnight.');
for (let i = 0; i < 4; i++) { await key('d'); await hold(0.85); }
await card({ eyebrow: 'Day 2 · 7:10 am', title: 'The drone lands on the terrace.', small: true }, 3.2);
await key('d');
await settle(300);
await uncard(1);

// ── 4. Pairing and calibration ──
await cap('She taps her phone on the box lid. The patch knows it is hers.');
await click('button:has-text("Tap your phone")', { s: 1 });
await hold(2.2);
await cap('A small test pulse. A faint tingle. The patch measures how her muscles answer.');
const ring = await reveal('button[aria-label^="Press and hold"]', 120);
await glide(ring.x + ring.width / 2, ring.y + ring.height / 2, 0.9);
await p.mouse.down(); await hold(5.4); await p.mouse.up();
await hold(1.6);
await click('button:has-text("Review your data")', { s: 1 });
await cap(null);
await hold(0.8);

// ── 5. What they already knew ──
await cap('Then a surprise. Knack already has a profile of her.');
await hold(3.2);
await scrollBy(520, 1.4);
await cap('From a phone test, her health record, her smart ring…');
await hold(3.4);
await cap('…and her new employer, who offers to pay 20% of her plan.');
const emp = await reveal('button[aria-label="Use Employer wellness programme"]', 160);
await glide(emp.x + emp.width / 2, emp.y + emp.height / 2, 1);
await hold(2.6);
await cap('In return, the restaurant will see every hour she streams. Money is tight. She leaves it on.');
await hold(4.6);
await click('button:has-text("Use this profile")', { s: 1 });
await cap(null);
await hold(1.2);

// ── 6. Choosing hands ──
await cap('The vault: skills recorded from real people, who are paid for every minute you use them.');
await hold(0.6);
const vb = await box('#vault');
await scrollBy(vb.y - 70, 1.1);
const car = await box('#vault [aria-roledescription="Skill carousel"]');
await glide(car.x + car.width * 0.7, car.y + car.height * 0.5, 0.9);
await p.mouse.down();
await glide(car.x + car.width * 0.3, car.y + car.height * 0.52, 1.1);
await p.mouse.up();
await hold(1.4);
await glide(car.x + car.width * 0.3, car.y + car.height * 0.5, 0.3);
await p.mouse.down();
await glide(car.x + car.width * 0.72, car.y + car.height * 0.48, 1.1);
await p.mouse.up();
await hold(1.8);
await click('#vault [aria-roledescription="Skill carousel"]', { s: 0.8, dy: 0.45 });
await hold(1.4);
await cap('Chef Arjun Mehra. Twenty-two years in commercial kitchens. ₹1,850 an hour.');
await hold(3.6);
await click('#vault [role=dialog] button:has-text("Add to my first month")', { s: 0.9 });
await hold(1.2);
await click('#vault button:has-text("See my personalised plan")', { s: 1 });
await cap(null);
await hold(1);

// ── 7. Plan and payment ──
await cap('Her plan is built from her body, not her deadline: short sessions, long rests.');
await hold(3.6);
await click('button:has-text("Continue to payment")', { s: 1 });
await cap('Before she can pay, she has to confirm she knows what streaming does to her.');
await hold(1.2);
const ack = await reveal('#risk-ack', 200);
await hold(2.6);
await glide(ack.x + ack.width / 2, ack.y + ack.height / 2, 0.9);
await hold(0.4);
await p.mouse.down(); await tick(3); await p.mouse.up(); await tick(2);
await hold(1);
await click('button:has-text("Pay ₹")', { s: 0.9 });
await cap(null);
await hold(1.6);
await cap('The safety guide is optional. Nine in ten people skip it. So does Asha.');
await hold(1.6);
await click('button:has-text("Skip the guides")', { s: 1 });
await hold(1.4);
await cap(null);

// ── 8. The session ──
await card({ eyebrow: 'Day 8 · 6:40 am', title: 'Her trial shift starts at ten.', small: true }, 3.4);
await uncard(1);
await click('button:text-is("Start")', { s: 1 });
await cap('For one hour, her hands move like his.');
await hold(4.2);
await card({ eyebrow: 'One hour later', title: '', small: true }, 2.2);
const mins = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('knack-2035')).order; return (o.session.ends - worldNow()) / 1000; });
await p.evaluate((ms) => window.__advance(ms), Math.max(0, mins * 1000 + 2000));
await settle(500);
await p.evaluate(() => window.__card(null));
await cap(null);
await hold(9.6);

// ── 9. What stays ──
const price = (await p.locator('button:has-text("Keep it ·")').first().innerText()).replace(/.*·\s*/, '');
const kept = (await p.locator('text=/^Keep the \\d+% for good$/').first().innerText()).match(/\d+/)[0];
await cap(`Keeping the ${kept}% that stays would cost ${price}.`);
const keep = await box('button:has-text("Keep it ·")');
await glide(keep.x + keep.width / 2, keep.y + keep.height / 2, 1.1);
await hold(3.6);
await cap('She lets it fade.');
await click('button:has-text("Let it fade")', { s: 0.8 });
await hold(1.4);
await cap(null);

// ── 10. Ending ──
await card({ eyebrow: 'Day 8 · 4:15 pm', title: 'Asha gets the job.', body: 'Her employer can see every hour she streams. Her own hands, without the patch, are a little less steady than they were a week ago.', small: true }, 7.5);
await card({ eyebrow: 'Knack', title: 'Who owns a skill once it has been in your hands?', small: true }, 5.5);
await card({ eyebrow: 'Knack · a design fiction set in 2035', title: 'Get the knack.', body: 'Not a real product.' }, 4.5);
await cap(null);

// Subtitles for a voiceover or captions file.
const t = (f) => { const s = f / FPS, h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = (s % 60).toFixed(3).padStart(6, '0'); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.replace('.', ',')}`; };
writeFileSync(DIR + 'eight-days.srt', subs.filter((x) => x.text).map((x, i) => `${i + 1}\n${t(x.start + 14)} --> ${t(x.end)}\n${x.text}\n`).join('\n'));
console.log('frames', frame, 'seconds', (frame / FPS).toFixed(1));
console.log(errs.join('\n'));
await b.close();
