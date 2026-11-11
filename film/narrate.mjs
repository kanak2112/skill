// Reads the narration lines from storyboard10.html (or the timeline, with TIMELINE=1) and prints JSON.
import { createRequire } from 'node:module';
const { chromium } = createRequire(process.env.NODE_PATH + '/')('playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 810 } });
await p.goto(`http://localhost:${process.env.PORT || 5302}/${process.env.PAGE || 'storyboard10.html'}`); await p.evaluate(() => window.__ready);
console.log(JSON.stringify(await p.evaluate(() => ({ total: window.__total, say: window.__say, timeline: window.__timeline }))));
await b.close();
