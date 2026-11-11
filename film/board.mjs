// Renders the storyboard film: storyboard.html, frame by frame at 30 fps, 1920×1080.
// The page draws itself for any time via window.__setTime, so no clock tricks are needed.
// Screen panels read frames-clean/ (CLEAN=1 node direct.mjs). SHARD/SHARDS split the work.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright');
const DIR = new URL('.', import.meta.url).pathname;
const OUT = DIR + (process.env.OUT || 'board-frames') + '/';
const SHARDS = +process.env.SHARDS || 1, SHARD = +process.env.SHARD || 0, ONLY = process.env.ONLY;
if (SHARD === 0 && !ONLY) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(`http://localhost:${process.env.PORT || 5302}/storyboard.html${process.env.SRC ? `?src=${process.env.SRC}` : ''}`, { waitUntil: 'load' });
await p.evaluate(async () => {
  await Promise.all(['400 40px Bangers', '700 20px "Comic Neue"', '400 20px "Comic Neue"', '500 20px "Google Sans Flex"'].map((f) => document.fonts.load(f, 'ABC ₹')));
  await document.fonts.ready;
});
const total = await p.evaluate(() => window.__total);
const N = Math.ceil(total * 30);
const from = Math.floor((N * SHARD) / SHARDS), to = Math.floor((N * (SHARD + 1)) / SHARDS);
const list = ONLY ? ONLY.split(',').map(Number) : Array.from({ length: to - from }, (_, i) => from + i);
const cdp = await p.context().newCDPSession(p);
for (const f of list) {
  await p.evaluate((t) => window.__setTime(t), f / 30);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  writeFileSync(`${OUT}${String(f).padStart(6, '0')}.jpg`, Buffer.from(data, 'base64'));
}
console.log('shard', SHARD, 'frames', list.length, 'of', N, 'seconds', total.toFixed(1));
if (errs.length) console.log(errs.slice(0, 10).join('\n'));
await b.close();
