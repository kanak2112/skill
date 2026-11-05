/**
 * Rebuilds Knack.html in place: the skill-vault bundle (esbuild), its scoped Tailwind CSS and the
 * app script (manual-app.jsx). The head scan and library tags already in Knack.html are kept.
 * Run from the repo root: node standalone/build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, 'Knack.html');

const shims = {
  name: 'standalone-shims',
  setup(b) {
    b.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'shim' }));
    b.onLoad({ filter: /.*/, namespace: 'shim' }, () => ({ contents: 'module.exports = window.React;', loader: 'js' }));
    b.onResolve({ filter: /components\/Icon\.jsx$/ }, () => ({ path: resolve(here, 'vault-icon.jsx') }));
    // Movement skills only: every import of the catalogue gets the filtered copy, except the copy itself.
    b.onResolve({ filter: /data\/catalog\.js$/ }, (args) => (args.importer.endsWith('vault-catalog.js') ? undefined : { path: resolve(here, 'vault-catalog.js') }));
  },
};
const bundle = await build({
  entryPoints: [resolve(here, 'vault-entry.jsx')], bundle: true, write: false, format: 'iife', minify: true,
  jsx: 'transform', jsxFactory: '__R.createElement', jsxFragment: '__R.Fragment', banner: { js: 'var __R = window.React;' },
  plugins: [shims], target: 'es2019', legalComments: 'none',
});
const vaultJs = bundle.outputFiles[0].text.trim();
const css = execFileSync('npx', ['tailwindcss', '-c', 'vault.tailwind.config.js', '-i', 'vault.css', '--minify'], { cwd: here, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
const APP_MARK = '/* ───────────── App ───────────── */';
const app = readFileSync(resolve(here, 'manual-app.jsx'), 'utf8').replace(APP_MARK, () => readFileSync(resolve(here, 'experts.jsx'), 'utf8') + '\n' + APP_MARK);

let html = readFileSync(out, 'utf8');
const swap = (startMark, endMark, body, label) => {
  const a = html.indexOf(startMark);
  if (a < 0) throw new Error(`marker not found: ${label}`);
  const b = html.indexOf(endMark, a + startMark.length);
  html = html.slice(0, a + startMark.length) + body + html.slice(b);
};
swap('<style>/* Skill vault (cylindrical carousel) from the main prototype, scoped to #vault */\n', '</style>', css + '\n', 'vault css');
swap('<script>/* skill vault */', '</script>', vaultJs, 'vault js');
swap('<script type="text/babel" data-presets="react">', '</script>', '\n' + app + '\n', 'app');
writeFileSync(out, html);
console.log(`Knack.html: ${(html.length / 1024).toFixed(0)} KB`);
