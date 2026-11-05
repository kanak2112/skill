// Opens standalone/Knack.html in headless Chromium, answering its CDN requests from local copies
// (see film/README.md for fetching them), so the film renders without network access.
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const L = (process.env.KNACK_LIBS || resolve(HERE, '.libs')) + '/';
const css = execFileSync(resolve(HERE, '../node_modules/.bin/tailwindcss'), ['-c', 'tw.config.cjs', '-i', 'tw.css', '--minify'], { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const map = {
  'react.production.min.js': 'react-18.3.1/package/umd/react.production.min.js',
  'react-dom.production.min.js': 'react-dom-18.3.1/package/umd/react-dom.production.min.js',
  'lucide-react.min.js': 'lucide-react-0.263.1/package/dist/umd/lucide-react.min.js',
  'three.min.js': 'three-0.147.0/package/build/three.min.js',
  'GLTFLoader.js': 'three-0.147.0/package/examples/js/loaders/GLTFLoader.js',
  'OrbitControls.js': 'three-0.147.0/package/examples/js/controls/OrbitControls.js',
  'DecalGeometry.js': 'three-0.147.0/package/examples/js/geometries/DecalGeometry.js',
  'RoomEnvironment.js': 'three-0.147.0/package/examples/js/environments/RoomEnvironment.js',
  'babel.min.js': 'babel-standalone-7.24.7/package/babel.min.js',
};
export async function open({ width = 1360, height = 900, mobile = false, url = 'http://localhost:5301/Knack.html', init, scale = 1, waitRoot = true } = {}) {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: scale });
  if (init) await ctx.addInitScript(init);
  await ctx.route(/^https:\/\//, (r) => {
    const u = r.request().url();
    if (u.startsWith('https://cdn.tailwindcss.com')) return r.fulfill({ contentType: 'text/javascript', body: `window.tailwind={};document.head.insertAdjacentHTML('beforeend','<style>'+${JSON.stringify(css)}+'</style>')` });
    const k = Object.keys(map).find((k) => u.endsWith(k));
    if (k) return r.fulfill({ contentType: 'text/javascript', body: readFileSync(L + map[k]) });
    if (u.includes('fonts.googleapis.com') && u.includes('Google+Sans+Flex')) return r.fulfill({ contentType: 'text/css', body: "@font-face{font-family:'Google Sans Flex';font-style:normal;font-display:swap;font-weight:100 1000;font-stretch:25% 151%;src:url(https://local.font/gsf.woff2) format('woff2')}" });
    if (u === 'https://local.font/gsf.woff2') return r.fulfill({ contentType: 'font/woff2', body: readFileSync(L + 'gsf/package/files/google-sans-flex-latin-full-normal.woff2') });
    return r.fulfill({ status: 200, contentType: 'text/css', body: '' });
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push('CON ' + m.text()));
  await p.goto(url, { waitUntil: 'load', timeout: 90000 });
  if (waitRoot) await p.waitForFunction(() => document.querySelector('#root') && document.querySelector('#root').children.length, null, { timeout: 60000 });
  return { b, p, errs, ctx };
}
export const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
