// "Two Pairs of Hands": a scenario film of the Knack interface, captured frame by frame at 30 fps.
// DRY=1 saves only every 15th frame, for checking the flow quickly.
import { open } from './serve.mjs';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const DIR = new URL('.', import.meta.url).pathname;
const FPS = 30;
const DRY = !!process.env.DRY;
// CLEAN=1 renders the same film without captions or vignette, for footage inside storyboard panels.
const CLEAN = !!process.env.CLEAN;
const OUT = DIR + (DRY ? 'dry/' : CLEAN ? 'frames-clean/' : 'frames/');
// Sharding: SHARD=k of SHARDS=n replays the whole story but saves only frames in its slice,
// so several browsers can render one film in parallel.
const SHARDS = +process.env.SHARDS || 1, SHARD = +process.env.SHARD || 0, TOTAL = +process.env.TOTAL || 12500;
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

// Camera push-ins on whatever a selector points at; unpush before the cursor clicks again.
async function push(sel, scale = 1.12, s = 1.4) {
  const bb = await box(sel);
  await p.evaluate(([sc, x, y, ms]) => window.__push(sc, x, y, ms), [scale, bb.x + bb.width / 2, bb.y + bb.height / 2, s * 1000]);
}
async function unpush(s = 1) { await p.evaluate((ms) => window.__push(1, undefined, undefined, ms), s * 1000); await hold(s); }
const nav = (label) => `nav[aria-label="Main"] button:has-text("${label}")`;

// ── Load and warm up (not recorded) ──
await settle(400);
for (let i = 0; i < 300 && !(await p.evaluate(() => document.querySelector('#root') && document.querySelector('#root').children.length)); i++) await settle(100);
await p.evaluate((clean) => { localStorage.clear(); window.__mountFilm(); window.__card({ eyebrow: '', title: '' }); if (clean) document.getElementById('film-vignette').style.display = 'none'; }, CLEAN);
await settle(900);
await p.keyboard.press('p'); await settle(2500);
for (let i = 0; i < 60; i++) await adv(1000 / FPS);
await p.mouse.move(mouse.x, mouse.y);

// ── Opening ──
await card({ eyebrow: 'Knack · a design fiction', title: 'Two Pairs of Hands', body: 'Mumbai and Pune, 2035.', size: 96, dur: 5 }, 5);
await card({ eyebrow: 'Knack', title: 'Every skill on Knack belongs to someone.', size: 64, dur: 4.5 }, 4.5);

// ══ Part one: Arjun ══
await card({ num: '01', eyebrow: 'Part one · Mumbai, March 2035', title: 'The one who records', size: 84, dur: 4.5 }, 4.5);
await card({ eyebrow: 'Chef Arjun Mehra, 51', title: 'Twenty-two years in commercial kitchens. His wrists are starting to fail him.', body: 'When his hands stop, everything they know stops with them.', size: 58, dur: 7.5 }, 4);
await p.locator(nav('For experts')).first().click();
await hold(3.5);
await uncard(1);

await cap('Knack pays experts to record their hands. Arjun applies.');
await hold(2.6);
await cap('Only verified experts can record. Knack checks his kitchens, his guild level, and his hands.');
await push('text=Hand-health screening', 1.14, 1.6);
await hold(3.4);
await unpush(1);
await click('button:has-text("Continue to terms")', { s: 0.9 });
await cap(null);
await hold(0.8);

await cap('Every hour anyone streams his hands, he keeps 30%: ₹555.');
await push('text=You · 30%', 1.16, 1.5);
await hold(3.6);
await unpush(1);
await cap('He chooses who may never use them.');
const tg = await box('button[aria-label="Not for weapons or combat training"]');
await glide(tg.x + tg.width / 2, tg.y + tg.height / 2, 1);
await hold(2.2);
await cap('And he signs one clause without reading it twice.');
await push('text=Clause 14.2', 1.18, 1.6);
await hold(4.4);
await unpush(1);
await click('button:has-text("Sign with Aadhaar")', { s: 0.9 });
await cap(null);
await hold(2.2);

await cap('For six months, two patches record him through 156 dinner services. He just cooks.');
await hold(5.6);
await cap('Knack is watching his right wrist too.');
await push('text=Right wrist strain', 1.2, 1.4);
await hold(3.2);
await unpush(1);
await cap('1,352 hours of his hands.');
await hold(2.4);
await click('button:has-text("Send to review")', { s: 0.9 });
await cap(null);
await hold(0.6);

await cap('Knack keeps only his best hours.');
await hold(4.4);
await cap('212 hours are cut: tiredness, tremor, mistakes. Most of the tremor came from his right wrist.');
await hold(4.6);
await click('button:has-text("Send for certification")', { s: 0.9 });
await cap(null);
await hold(1.6);
await cap('Certified. His skill is now a product.');
await hold(2.6);
await click('button:has-text("Publish to the vault")', { s: 0.9 });
await hold(1);
await cap('His hands are in the vault.');
await hold(3);
await click('button:has-text("See earnings")', { s: 0.9 });
await cap(null);
await card({ eyebrow: 'October', title: 'Five months later.', size: 72, dur: 3 }, 3);
await uncard(0.6);

await cap('Every minute someone streams his hands, he is paid. ₹3,10,245 in October.');
await push('text=Earned in October', 1.14, 1.6);
await hold(3.8);
await unpush(1);
await cap('Right now, his hands are working in kitchens across India.');
await push('text=Where his hands are working right now', 1.12, 1.6);
await hold(4.2);
await unpush(1);
await cap('He no longer works full services.');
await hold(2.6);
await click('button:has-text("What changed in August?")', { s: 0.9 });
await cap('In August, Knack launched a cheaper knife skill: ₹340 an hour.');
await hold(3.4);
await cap('It was built from 3,100 sessions. 412 of those hours were his.');
await push('text=Kitchen Knife Fundamentals', 1.14, 1.6);
await hold(4);
await unpush(1);
await cap('Clause 14.2. His own hands are being used to replace him.');
await hold(4.6);
await cap(null);

// ══ Part two: Asha ══
await card({ num: '02', eyebrow: 'Part two · Pune, November 2035', title: 'The one who rents', size: 84, dur: 4.5 }, 4.5);
await card({ eyebrow: 'Asha Rao, 34', title: 'She has cooked at home all her life.', body: 'On Monday she starts a trial shift in a restaurant kitchen. She has never held a knife the way chefs do.', size: 64, dur: 7 }, 3.4);
await p.locator('button[aria-label="Knack home"]').first().click();
await hold(3.4);
await uncard(1.2);

await cap('Her cousin sends her a link: a skin patch that lets you rent an expert’s hands, by the hour.');
await hold(4.4);
await click('button:has-text("Get yours now")', { s: 1 });
await cap(null);
await hold(1.4);
await cap('She designs the shell it wears.');
await click('#prompt', { s: 0.8 });
await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await tick(3);
await type('A satin saffron tear drop', 2);
await click('button:has-text("Create")', { s: 0.5 });
await hold(2.4);
await click('button:has-text("Buy now")', { s: 1 });
await cap(null);
await hold(0.4);

await cap('₹48,900 for the patch. It is hers to keep. The skills are not.');
await click('#f-name', { s: 0.8 });
await type('Asha Rao', 2);
await p.fill('#f-phone', '98230 41187'); await p.fill('#f-pin', '411038');
await p.fill('#f-street', '7, Sai Krupa Society, Paud Road'); await p.fill('#f-city', 'Pune');
await p.selectOption('#f-state', 'Maharashtra');
await tick(6);
await hold(1.6);
await cap('She has eight days. She pays extra for a drone drop.');
await click('button[role=radio]:has-text("Drone drop")', { s: 0.9 });
await hold(1);
await click('button:has-text("Place order")', { s: 0.9 });
await cap('Her shell is printed overnight.');
for (let i = 0; i < 4; i++) { await key('d'); await hold(0.7); }
await card({ eyebrow: 'Day 2 · 7:10 am', title: 'The drone lands on the terrace.', size: 64, dur: 3 }, 3);
await key('d');
await settle(300);
await uncard(0.8);

await cap('She taps her phone on the box lid. The patch knows it is hers.');
await click('button:has-text("Tap your phone")', { s: 0.9 });
await hold(2);
await cap('A small test pulse. The patch learns how her muscles answer.');
const ring = await reveal('button[aria-label^="Press and hold"]', 120);
await glide(ring.x + ring.width / 2, ring.y + ring.height / 2, 0.8);
await p.mouse.down(); await hold(5.4); await p.mouse.up();
await hold(1);
await click('button:has-text("Review your data")', { s: 0.9 });
await cap('Knack already has a profile of her: her health record, her smart ring…');
await hold(2.6);
await scrollBy(520, 1.3);
await cap('…and her new employer, who pays 20% of her plan and will see every hour she streams. She leaves it on.');
const emp = await reveal('button[aria-label="Use Employer wellness programme"]', 160);
await glide(emp.x + emp.width / 2, emp.y + emp.height / 2, 1);
await hold(4.4);
await click('button:has-text("Use this profile")', { s: 0.9 });
await cap(null);
await hold(1);

await cap('In the vault, she finds a knife skill recorded in Mumbai.');
await hold(0.6);
const vb = await box('#vault');
await scrollBy(vb.y - 70, 1.1);
const car = await box('#vault [aria-roledescription="Skill carousel"]');
await glide(car.x + car.width * 0.7, car.y + car.height * 0.5, 0.8);
await p.mouse.down();
await glide(car.x + car.width * 0.32, car.y + car.height * 0.52, 1);
await p.mouse.up();
await hold(1);
await glide(car.x + car.width * 0.3, car.y + car.height * 0.5, 0.3);
await p.mouse.down();
await glide(car.x + car.width * 0.7, car.y + car.height * 0.48, 1);
await p.mouse.up();
await hold(1.4);
await click('#vault [aria-roledescription="Skill carousel"]', { s: 0.8, dy: 0.45 });
await hold(1);
await cap('She has never met him. She chooses his hands.');
await hold(3.6);
await click('#vault [role=dialog] button:has-text("Add to my first month")', { s: 0.9 });
await hold(0.8);
await click('#vault button:has-text("See my personalised plan")', { s: 1 });
await cap('Her plan is built from her body: short sessions, long rests.');
await hold(3);
await click('button:has-text("Continue to payment")', { s: 1 });
await cap('She confirms she knows what streaming does to her, and pays.');
const ack = await reveal('#risk-ack', 200);
await hold(2.2);
await glide(ack.x + ack.width / 2, ack.y + ack.height / 2, 0.9);
await p.mouse.down(); await tick(3); await p.mouse.up(); await tick(2);
await hold(0.6);
await click('button:has-text("Pay ₹")', { s: 0.9 });
await hold(1.2);
await cap('She skips the safety guide. Nine in ten people do.');
await hold(1.4);
await click('button:has-text("Skip the guides")', { s: 1 });
await hold(1);
await cap(null);

await card({ eyebrow: 'Day 8 · 6:40 am', title: 'Her trial shift starts at ten.', size: 64, dur: 3.4 }, 3.4);
await uncard(0.8);
await click('button:text-is("Start")', { s: 1 });
const mins = await p.evaluate(() => JSON.parse(localStorage.getItem('knack-2035')).order.session.mins);
const span = mins === 60 ? 'one hour' : mins % 60 === 0 ? `${mins / 60} hours` : mins > 60 ? `${Math.floor(mins / 60)} hour ${mins % 60} minutes` : `${mins} minutes`;
await cap(`For ${span}, her hands move like his.`);
await hold(4.4);
await card({ eyebrow: `${span[0].toUpperCase() + span.slice(1)} later`, title: '', size: 64, dur: 2 }, 2);
const left = await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('knack-2035')).order; return o.session.ends - worldNow(); });
await p.evaluate((ms) => window.__advance(ms), Math.max(0, left + 2000));
await settle(500);
await p.evaluate(() => { window.__card(null); window.__capPos('top'); });
await cap(null);
await hold(1.2);
await p.evaluate(() => window.__push(1.05, innerWidth * 0.3, innerHeight * 0.5, 6000));
await hold(7);
await unpush(1.2);
await hold(1.2);

const price = (await p.locator('button:has-text("Keep it ·")').first().innerText()).replace(/.*·\s*/, '');
const kept = (await p.locator('text=/^Keep the \\d+% for good$/').first().innerText()).match(/\d+/)[0];
const toArjun = '₹' + Math.round(+price.replace(/\D/g, '') * 0.3).toLocaleString('en-IN');
await cap(`Keeping the ${kept}% that stays would cost ${price}. ${toArjun} of it would go to Arjun.`);
const keep = await box('button:has-text("Keep it ·")');
await glide(keep.x + keep.width / 2, keep.y + keep.height / 2, 1.1);
await hold(4);
await cap('She lets it fade.');
await click('button:has-text("Let it fade")', { s: 0.8 });
await hold(1.2);
await cap(null);
await hold(0.5);
await p.evaluate(() => window.__capPos('bottom'));

// ══ Part three: both sides of one hour ══
await card({ num: '03', eyebrow: 'Part three · Mumbai, the same hour', title: 'Both sides of one session', size: 84, dur: 4.5 }, 4.2);
await p.locator(nav('For experts')).first().click();
await tick(2);
await uncard(1);
await hold(1);
await cap('In Mumbai, Arjun’s phone lights up.');
await hold(0.4);
const pay = (await p.locator('[role=status] .text-ok').first().innerText()).replace('+', '');
await push('[role=status]', 1.3, 1.4);
await hold(3.6);
await unpush(1);
await cap('A cook in Pune. He will never know her name.');
await push('text=Where his hands are working right now', 1.1, 1.4);
await hold(3.4);
await unpush(1);
await cap(null);

await card({ eyebrow: 'Pune · 4:15 pm', title: 'Asha gets the job.', body: 'Her employer can see every hour she streams. Her own hands, without the patch, are a little less steady than they were a week ago.', size: 72, dur: 7.5 }, 7.5);
await card({ eyebrow: 'Mumbai · that night', title: `Arjun earns ${pay} for ${span} he didn’t work.`, body: 'His right wrist aches. The skill built from his hours costs less than he does.', size: 60, dur: 7.5 }, 7.5);
await card({ eyebrow: 'Knack', title: 'Who owns a skill once it has been in your hands?', size: 68, dur: 6 }, 6);
await card({ eyebrow: 'Knack · a design fiction set in 2035', title: 'Get the knack.', body: 'Not a real product.', size: 104, dur: 5.5 }, 5.5);
await cap(null);

// Subtitles for a voiceover or captions file.
const t = (f) => { const s = f / FPS, h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = (s % 60).toFixed(3).padStart(6, '0'); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.replace('.', ',')}`; };
writeFileSync(DIR + 'two-pairs-of-hands.srt', subs.filter((x) => x.text).map((x, i) => `${i + 1}\n${t(x.start + 14)} --> ${t(x.end)}\n${x.text}\n`).join('\n'));
console.log('frames', frame, 'seconds', (frame / FPS).toFixed(1));
console.log(errs.join('\n'));
await b.close();
