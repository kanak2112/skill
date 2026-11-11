// Footage reel for the 8-minute storyboard: Asha's whole journey through the Knack interface, clean
// (no captions), captured frame by frame at 30 fps. Writes reel-marks.json: the frame range of every
// scene plus the numbers the interface showed, so the storyboard narration can quote them exactly.
// DRY=1 saves only every 15th frame, for checking the flow quickly.
import { open } from './serve.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const DIR = new URL('.', import.meta.url).pathname;
const FPS = 30;
const DRY = !!process.env.DRY;
// CLEAN=1 renders the same film without captions or vignette, for footage inside storyboard panels.
const CLEAN = true;
const OUT = DIR + (DRY ? 'dry-reel/' : 'frames-reel/');
// Sharding: SHARD=k of SHARDS=n replays the whole story but saves only frames in its slice,
// so several browsers can render one film in parallel.
const SHARDS = +process.env.SHARDS || 1, SHARD = +process.env.SHARD || 0, TOTAL = +process.env.TOTAL || 12000;
const FROM = Math.floor((TOTAL * SHARD) / SHARDS), TO = SHARD === SHARDS - 1 ? Infinity : Math.floor((TOTAL * (SHARD + 1)) / SHARDS);
if (SHARD === 0) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const { b, p, errs, ctx } = await open({ width: 1440, height: 810, scale: 4 / 3, init: { path: DIR + 'clock.js' }, waitRoot: false });
const cdp = await ctx.newCDPSession(p);
let frame = 0;
const subs = [];
let capOpen = null;

const adv = (ms) => p.evaluate((ms) => window.__advance(ms), ms);
let REC = true;
async function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    if (!REC) { await adv(1000 / FPS); continue; }
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
  if (!CLEAN) await p.evaluate((t) => window.__cap(t), text || '');
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


const marks = {}, values = {};
let openMark = null;
function mark(name) { if (openMark) marks[openMark].to = frame; openMark = name; if (name) marks[name] = { from: frame }; }
const nav = (label) => `nav[aria-label="Main"] button:has-text("${label}")`;
const text = async (sel) => (await p.locator(sel).first().innerText()).trim();

// ── Load and warm up (not recorded) ──
await settle(400);
for (let i = 0; i < 300 && !(await p.evaluate(() => document.querySelector('#root') && document.querySelector('#root').children.length)); i++) await settle(100);
await p.evaluate(() => { localStorage.clear(); window.__mountFilm(); document.getElementById('film-vignette').style.display = 'none'; });
await settle(900);
await p.keyboard.press('p'); await settle(1500);
await p.mouse.move(mouse.x, mouse.y);

// Arjun's side, set up off camera so his dashboard can receive Asha's session at the end.
REC = false;
await click(nav('For experts')); await settle(6500);
await click('button:has-text("Continue to terms")'); await settle(800);
await click('button:has-text("Sign with Aadhaar")'); await settle(14000);
await click('button:has-text("Send to review")'); await settle(5000);
await click('button:has-text("Send for certification")'); await settle(2500);
await click('button:has-text("Publish to the vault")'); await settle(1000);
await click('button:has-text("See earnings")'); await settle(3000);
await click('button[aria-label="Knack home"]'); await settle(1500);
for (let i = 0; i < 60; i++) await adv(1000 / FPS);
REC = true;

// ── Asha ──
mark('home');
await hold(4);
await click('button:has-text("Get yours now")', { s: 1 });
await hold(1.4);

mark('studio');
await click('#prompt', { s: 0.8 });
await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await tick(3);
await type('A satin saffron tear drop', 2);
await click('button:has-text("Create")', { s: 0.5 });
await hold(2.6);
const stage = await box('canvas');
await glide(stage.x + stage.width * 0.55, stage.y + stage.height * 0.45, 0.6);
await p.mouse.down(); await glide(stage.x + stage.width * 0.36, stage.y + stage.height * 0.47, 1.4); await p.mouse.up();
await hold(1.2);
mark('consent');
await click('button:has-text("Upload your photo")', { s: 0.9 });
await hold(4.5);
await click('button:has-text("Not now")', { s: 0.8 });
await hold(0.6);
await click('button:has-text("Buy now")', { s: 1 });
await hold(0.5);

mark('checkout');
await click('#f-name', { s: 0.8 });
await type('Asha Rao', 2);
await p.fill('#f-phone', '98230 41187'); await p.fill('#f-pin', '411038');
await p.fill('#f-street', '7, Sai Krupa Society, Paud Road'); await p.fill('#f-city', 'Pune');
await p.selectOption('#f-state', 'Maharashtra');
await tick(6); await hold(1.4);
await click('button[role=radio]:has-text("Drone drop")', { s: 0.9 });
await click('button[role=radio]:has-text("e₹ wallet")', { s: 0.8 });
await hold(1.6);
values.total = (await text('button:has-text("Place order")')).replace(/.*·\s*/, '');
await click('button:has-text("Place order")', { s: 0.9 });
await hold(1);

mark('tracking');
for (let i = 0; i < 4; i++) { await key('d'); await hold(1.1); }
await key('d');
await hold(1.2);

mark('pair');
await scrollBy(260, 1.2); await hold(2.4); await scrollBy(-260, 0.8);
await click('button:has-text("Tap your phone")', { s: 0.9 });
await hold(2.2);
mark('calibrate');
const ring = await reveal('button[aria-label^="Press and hold"]', 120);
await glide(ring.x + ring.width / 2, ring.y + ring.height / 2, 0.8);
await p.mouse.down(); await hold(5.4); await p.mouse.up();
await hold(2.4);
await click('button:has-text("Review your data")', { s: 0.9 });

mark('data');
await hold(2.6);
await scrollBy(520, 1.3);
const emp = 'button[aria-label="Use Employer wellness programme"]';
await click(emp, { s: 0.9 }); await hold(2.4);
await click('button[aria-label="Use ABHA health record"]', { s: 0.7 }); await hold(2.4);
await click('button[aria-label="Use ABHA health record"]', { s: 0.5 }); await hold(0.8);
await click(emp, { s: 0.5 }); await hold(2.2);
await click('button:has-text("Use this profile")', { s: 0.9 });

mark('vault');
await hold(0.6);
const vb = await box('#vault');
await scrollBy(vb.y - 70, 1.1);
const car = await box('#vault [aria-roledescription="Skill carousel"]');
await glide(car.x + car.width * 0.7, car.y + car.height * 0.5, 0.8);
await p.mouse.down(); await glide(car.x + car.width * 0.32, car.y + car.height * 0.52, 1); await p.mouse.up();
await hold(1);
await glide(car.x + car.width * 0.3, car.y + car.height * 0.5, 0.3);
await p.mouse.down(); await glide(car.x + car.width * 0.7, car.y + car.height * 0.48, 1); await p.mouse.up();
await hold(1.6);
await click('#vault [aria-roledescription="Skill carousel"]', { s: 0.8, dy: 0.45 });
await hold(4);
await click('#vault [role=dialog] button:has-text("Add to my first month")', { s: 0.9 });
await hold(0.8);
await click('#vault button:has-text("See my personalised plan")', { s: 1 });

mark('plan');
await hold(2);
await scrollBy(330, 1.2);
await hold(3.4);
await click('button[aria-label^="More "]', { s: 0.8 }); await hold(1.6);
await click('button[aria-label^="Fewer "]', { s: 0.5 }); await hold(1);
await click('button:has-text("Continue to payment")', { s: 1 });

mark('pay');
const ack = await reveal('#risk-ack', 200);
await hold(4);
await glide(ack.x + ack.width / 2, ack.y + ack.height / 2, 0.9);
await p.mouse.down(); await tick(3); await p.mouse.up(); await tick(2);
await hold(0.8);
values.plan = (await text('button:has-text("Pay ₹")')).replace(/^Pay\s*/, '');
await click('button:has-text("Pay ₹")', { s: 0.9 });
await hold(1.4);

mark('map');
await hold(4.4);
await click('button:has-text("Next")', { s: 0.9 });
mark('safety');
await hold(2.2);
await click('button:has-text("Shaky hands after a session")', { s: 0.9 }); await hold(2.4);
mark('lockout');
await click('#drm-toggle', { s: 0.9 });
await hold(6);
await click('button:has-text("End practice run")', { s: 0.9 });
await hold(1);
await click('button:has-text("Next")', { s: 0.9 });
mark('hardware');
await hold(1.6);
await click('[aria-label="Sensor ring"]', { s: 0.9 }); await hold(2.2);
await click('[aria-label="Sweat seal"]', { s: 0.6 }); await hold(2);
await click('button:has-text("Finish")', { s: 0.9 });
await hold(1);

mark('session');
await click('button:text-is("Start")', { s: 1 });
values.mins = await p.evaluate(() => JSON.parse(localStorage.getItem('knack-2035')).order.session.mins);
await hold(6);
mark(null);
let left = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('knack-2035')).order; return o.session.ends - worldNow(); });
await p.evaluate((ms) => window.__advance(ms), Math.max(0, left + 2000));
await settle(500);
mark('debrief1');
await hold(10);
values.kept = (await text('text=/^Keep the \\d+% for good$/')).match(/\d+/)[0];
values.price = (await text('button:has-text("Keep it ·")')).replace(/.*·\s*/, '');
await click('button:has-text("Keep it ·")', { s: 1 }); await hold(2.4);
await click('button:has-text("Cancel")', { s: 0.6 }); await hold(0.6);
await click('button:has-text("Let it fade")', { s: 0.8 });
await hold(1.2);

mark('rest');
await hold(3.6);
await key('f'); await hold(1.2);
mark(null);
// Two more sessions off camera, so the third debrief shows the drift in her own steadiness.
REC = false;
for (let k = 0; k < 2; k++) {
  await click('button:text-is("Start")', { s: 0.3 });
  left = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('knack-2035')).order; return o.session.ends - worldNow(); });
  await p.evaluate((ms) => window.__advance(ms), Math.max(0, left + 2000));
  await settle(k === 0 ? 12000 : 600);
  if (k === 0) { await click('button:has-text("Let it fade")', { s: 0.3 }); await settle(600); await p.keyboard.press('f'); await settle(600); }
}
REC = true;
mark('debrief3');
await hold(10);
values.steady = await text('text=/^\\d+% → \\d+%$/');
await click('button:has-text("Let it fade")', { s: 0.8 });
await hold(1.2);
mark('profile');
await hold(3);

mark('ping');
await click(nav('For experts'), { s: 1 });
await hold(9);
values.ping = (await text('[role=status] .text-ok')).replace('+', '');
mark(null);

writeFileSync(DIR + 'reel-marks.json', JSON.stringify({ frames: frame, marks, values }, null, 2));
console.log('frames', frame, JSON.stringify(values));
console.log(errs.join('\n'));
await b.close();
