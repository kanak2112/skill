// Virtual clock for frame-by-frame capture. Installed before the page's own scripts.
// Time only moves when the director calls window.__advance(ms), so every frame is rendered
// exactly on schedule however slow the machine is.
(() => {
  let now = 0;
  const base = Date.now();
  let rafs = [];
  let timers = [];
  let nextId = 1;
  // Repeatable randomness, so parallel slices of the film agree on order numbers and profiles.
  let seed = 20351105;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
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

  // Film overlays: a cursor, captions, a vignette, full-screen chapter cards and camera push-ins.
  const css = `
  #film-cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,.18);box-shadow:0 0 0 1px rgba(0,0,0,.5),0 4px 14px rgba(0,0,0,.45);z-index:2147483646;pointer-events:none;transition:transform .15s ease,background .15s ease}
  .fixed.bottom-4[role=status]{display:none!important}
  #film-cursor.down{transform:scale(.72);background:rgba(226,177,104,.55)}
  #film-vignette{position:fixed;inset:0;pointer-events:none;z-index:2147483644;background:radial-gradient(120% 90% at 50% 45%,transparent 62%,rgba(0,0,0,.42) 100%)}
  #film-cap{position:fixed;left:50%;bottom:52px;transform:translateX(-50%);max-width:1120px;width:calc(100% - 160px);text-align:center;z-index:2147483645;pointer-events:none;opacity:0;transition:opacity .45s ease}
  #film-cap span{display:inline;padding:.2em .55em;font:500 27px/1.6 "Google Sans Flex",system-ui,sans-serif;color:#F8FAFC;background:rgba(6,8,13,.88);box-decoration-break:clone;-webkit-box-decoration-break:clone;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.35)}
  #film-card{position:fixed;inset:0;z-index:2147483647;background:#05070b;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .8s ease;font-family:"Google Sans Flex",system-ui,sans-serif;color:#F8FAFC;overflow:hidden}
  #film-card .in{width:min(1120px,82vw);transform-origin:30% 50%}
  #film-card .num{font-size:220px;font-weight:200;line-height:.8;letter-spacing:-.06em;color:transparent;-webkit-text-stroke:1.5px rgba(226,177,104,.55);margin-bottom:28px}
  #film-card .eb{font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#E2B168;display:flex;align-items:center;gap:14px}
  #film-card .eb i{display:inline-block;height:1px;background:#E2B168;width:0;transition:width 1.2s cubic-bezier(.2,.8,.2,1) .2s}
  #film-card.on .eb i{width:56px}
  #film-card .ti{margin-top:20px;font-size:76px;font-weight:500;letter-spacing:-.025em;line-height:1.02;opacity:0;transform:translateY(14px);transition:opacity .9s ease .15s,transform 1.1s cubic-bezier(.2,.8,.2,1) .15s}
  #film-card .bo{margin-top:28px;font-size:29px;line-height:1.5;color:rgba(248,250,252,.76);max-width:36ch;opacity:0;transform:translateY(10px);transition:opacity .9s ease .7s,transform 1.1s cubic-bezier(.2,.8,.2,1) .7s}
  #film-card.on .ti,#film-card.on .bo{opacity:1;transform:none}
  #film-card .glow{position:absolute;inset:-10%;background:radial-gradient(45% 45% at 28% 42%,rgba(226,177,104,.13),transparent 70%)}
  #film-card .grain{position:absolute;inset:0;opacity:.06;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}`;
  const mount = () => {
    if (document.getElementById('film-cursor')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const v = document.createElement('div'); v.id = 'film-vignette'; document.body.appendChild(v);
    const c = document.createElement('div'); c.id = 'film-cursor'; document.body.appendChild(c);
    const cap = document.createElement('div'); cap.id = 'film-cap'; cap.innerHTML = '<span></span>'; document.body.appendChild(cap);
    const card = document.createElement('div'); card.id = 'film-card'; card.innerHTML = '<div class="glow"></div><div class="grain"></div><div class="in"><div class="num"></div><div class="eb"><span></span><i></i></div><div class="ti"></div><div class="bo"></div></div>'; document.body.appendChild(card);
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
  // c: { eyebrow, title, body, num, size, dur }. A new card restarts its own entrance and slow drift.
  window.__card = (c) => {
    mount();
    const el = document.getElementById('film-card');
    const inner = el.querySelector('.in');
    if (c) {
      el.classList.remove('on');
      inner.style.transition = 'none'; inner.style.transform = 'scale(1)';
      el.querySelector('.num').textContent = c.num || '';
      el.querySelector('.num').style.display = c.num ? 'block' : 'none';
      el.querySelector('.eb span').textContent = c.eyebrow || '';
      el.querySelector('.ti').textContent = c.title || '';
      el.querySelector('.bo').textContent = c.body || '';
      el.querySelector('.ti').style.fontSize = (c.size || 76) + 'px';
      void el.offsetWidth;
      inner.style.transition = `transform ${c.dur || 6}s linear`; inner.style.transform = 'scale(1.045)';
      el.classList.add('on');
    }
    el.style.opacity = c ? 1 : 0;
  };
  // Slow camera move on the page itself: scale about a point (CSS pixels), over ms.
  window.__push = (scale = 1, x = innerWidth / 2, y = innerHeight / 2, ms = 1200) => {
    for (const n of document.body.children) {
      if (/^film-/.test(n.id) || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') continue;
      n.style.transformOrigin = `${x}px ${getComputedStyle(n).position === 'fixed' ? y : y + scrollY}px`;
      n.style.transition = `transform ${ms}ms cubic-bezier(.45,0,.25,1)`;
      n.style.transform = scale === 1 ? '' : `scale(${scale})`;
    }
  };
  window.__cursor = (on) => { mount(); document.getElementById('film-cursor').style.display = on ? 'block' : 'none'; };
})();
