// Virtual clock for frame-by-frame capture. Installed before the page's own scripts.
// Time only moves when the director calls window.__advance(ms), so every frame is rendered
// exactly on schedule however slow the machine is.
(() => {
  let now = 0;
  const base = Date.now();
  let rafs = [];
  let timers = [];
  let nextId = 1;
  performance.now = () => now;
  const RealDate = Date;
  Date.now = () => base + now;
  window.requestAnimationFrame = (fn) => { const id = nextId++; rafs.push({ id, fn }); return id; };
  window.cancelAnimationFrame = (id) => { rafs = rafs.filter((r) => r.id !== id); };
  window.setTimeout = (fn, ms = 0, ...args) => { const id = nextId++; timers.push({ id, at: now + Math.max(0, +ms || 0), fn, args }); return id; };
  window.setInterval = (fn, ms = 0, ...args) => { const id = nextId++; const every = Math.max(1, +ms || 1); timers.push({ id, at: now + every, every, fn, args }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers = timers.filter((t) => t.id !== id); };
  // App scrolls jump; the director animates scrolling itself.
  const realScrollTo = window.scrollTo.bind(window);
  window.scrollTo = (a, b) => (typeof a === 'object' ? realScrollTo(a.left || 0, a.top || 0) : realScrollTo(a, b));
  Element.prototype.scrollIntoView = function () {};

  window.__advance = (ms) => {
    const target = now + ms;
    for (let guard = 0; guard < 200000; guard++) {
      let due = null;
      for (const t of timers) if (t.at <= target && (!due || t.at < due.at)) due = t;
      if (!due) break;
      now = Math.max(now, due.at);
      if (due.every) due.at += due.every; else timers = timers.filter((t) => t !== due);
      try { typeof due.fn === 'function' ? due.fn(...due.args) : 0; } catch (e) { console.error(e); }
    }
    now = target;
    const list = rafs; rafs = [];
    for (const r of list) { try { r.fn(now); } catch (e) { console.error(e); } }
    for (const a of document.getAnimations()) {
      if (a.__v === undefined) { a.__v = now; a.pause(); }
      const t = now - a.__v;
      const end = a.effect && a.effect.getComputedTiming().endTime;
      if (Number.isFinite(end) && t >= end) { try { a.finish(); } catch {} } else a.currentTime = t;
    }
  };
  window.__now = () => now;

  // Film overlays: a cursor, captions and full-screen chapter cards.
  const css = `
  #film-cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,.18);box-shadow:0 0 0 1px rgba(0,0,0,.5),0 4px 14px rgba(0,0,0,.45);z-index:2147483646;pointer-events:none;transition:transform .15s ease,background .15s ease}
  .fixed.bottom-4[role=status]{display:none!important}
  #film-cursor.down{transform:scale(.72);background:rgba(226,177,104,.55)}
  #film-cap{position:fixed;left:50%;bottom:56px;transform:translateX(-50%);max-width:1120px;width:calc(100% - 160px);text-align:center;z-index:2147483645;pointer-events:none;opacity:0;transition:opacity .45s ease}
  #film-cap span{display:inline;padding:.18em .5em;line-height:1.6;font:500 27px/1.55 "Google Sans Flex",system-ui,sans-serif;color:#F8FAFC;background:rgba(6,8,13,.86);box-decoration-break:clone;-webkit-box-decoration-break:clone;border-radius:8px}
  #film-card{position:fixed;inset:0;z-index:2147483647;background:#06080d;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .7s ease;font-family:"Google Sans Flex",system-ui,sans-serif;color:#F8FAFC}
  #film-card .in{width:min(1040px,80vw)}
  #film-card .eb{font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:#E2B168}
  #film-card .ti{margin-top:18px;font-size:72px;font-weight:500;letter-spacing:-.02em;line-height:1.04}
  #film-card .bo{margin-top:26px;font-size:28px;line-height:1.5;color:rgba(248,250,252,.78);max-width:34ch}
  #film-card .glow{position:absolute;inset:0;background:radial-gradient(55% 50% at 30% 40%,rgba(226,177,104,.10),transparent 70%)}`;
  const mount = () => {
    if (document.getElementById('film-cursor')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const c = document.createElement('div'); c.id = 'film-cursor'; document.body.appendChild(c);
    const cap = document.createElement('div'); cap.id = 'film-cap'; cap.innerHTML = '<span></span>'; document.body.appendChild(cap);
    const card = document.createElement('div'); card.id = 'film-card'; card.innerHTML = '<div class="glow"></div><div class="in"><div class="eb"></div><div class="ti"></div><div class="bo"></div></div>'; document.body.appendChild(card);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('pointerdown', () => c.classList.add('down'), true);
    addEventListener('pointerup', () => c.classList.remove('down'), true);
  };
  window.__mountFilm = mount;
  let capText = '';
  window.__cap = (text) => {
    mount();
    const el = document.getElementById('film-cap');
    if (text === capText) return;
    capText = text;
    el.style.opacity = 0;
    setTimeout(() => { if (capText !== text) return; el.firstChild.textContent = text || ''; el.style.opacity = text ? 1 : 0; }, 450);
  };
  window.__card = (c) => {
    mount();
    const el = document.getElementById('film-card');
    if (c) {
      el.querySelector('.eb').textContent = c.eyebrow || '';
      el.querySelector('.ti').textContent = c.title || '';
      el.querySelector('.bo').textContent = c.body || '';
      el.querySelector('.ti').style.fontSize = c.small ? '52px' : '72px';
    }
    el.style.opacity = c ? 1 : 0;
  };
  window.__cursor = (on) => { mount(); document.getElementById('film-cursor').style.display = on ? 'block' : 'none'; };
})();
