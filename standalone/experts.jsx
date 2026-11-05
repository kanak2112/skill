/* ───────────── Knack for Experts: the other side of every skill ─────────────
   Chef Arjun Mehra's account: apply, agree terms, record six months of real service, review,
   publish, then earn from every minute anyone streams his hands. Joined into the app script by
   build.mjs, so it shares the app's helpers (Card, Label, Icon, inr, fmtH, VAULT, worldNow). */

const EXPERT = { name: "Chef Arjun Mehra", initials: "AM", role: "Executive chef", city: "Mumbai", years: 22, age: 51, skillId: "arjun-knife", rate: 1850, share: 0.3 };
const EXPERT_STEPS = [
  { id: "apply", label: "Apply" },
  { id: "terms", label: "Terms" },
  { id: "record", label: "Record" },
  { id: "review", label: "Review" },
  { id: "publish", label: "Publish" },
  { id: "earnings", label: "Earnings" },
];
const EXPERT_CUT = Math.round(EXPERT.rate * EXPERT.share);

/** Counts from 0 to `to` over `ms`, easing out. Runs on animation frames, so it follows the page clock. */
function useCountUp(to, ms = 2400, run = true) {
  const reduce = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [v, setV] = useState(reduce || !run ? (run ? to : 0) : 0);
  useEffect(() => {
    if (!run || reduce) { setV(run ? to : 0); return; }
    const t0 = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const k = Math.min(1, (now - t0) / ms);
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [to, ms, run]);
  return v;
}
/** Milliseconds since the component mounted, on animation frames, capped at `max`. */
function useElapsed(max = 60000) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = requestAnimationFrame(function step(now) { const v = now - t0; setT(Math.min(max, v)); if (v < max) raf = requestAnimationFrame(step); });
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}
const appear = (on, extra = "") => `transition-all duration-700 ease-out ${on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${extra}`;

function ExpertHeader({ step, setStep, reach }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border border-brass/50 bg-[radial-gradient(circle_at_30%_30%,rgba(226,177,104,.35),rgba(22,31,46,1)_70%)] text-[17px] font-medium text-brass">
          {EXPERT.initials}
          <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-slate0"><Icon name="BadgeCheck" size={16} className="text-brass" /></span>
        </div>
        <div>
          <Label>Knack for Experts</Label>
          <div className="mt-1 text-[22px] font-medium tracking-tight">{EXPERT.name}</div>
          <div className="text-[13px] text-mute">{EXPERT.role} · {EXPERT.city} · {EXPERT.years} years in commercial kitchens</div>
        </div>
      </div>
      <ol className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Expert steps">
        {EXPERT_STEPS.map((s, i) => {
          const idx = EXPERT_STEPS.findIndex((x) => x.id === step), on = s.id === step, done = i < idx;
          return (
            <li key={s.id} className="shrink-0">
              <button disabled={!reach(i)} onClick={() => setStep(s.id)} aria-current={on ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-40 ${on ? "border-brass/60 bg-card text-ink" : done ? "border-line text-ink/80" : "border-line text-mute"}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${done ? "bg-ok/20 text-ok" : on ? "bg-brass text-slate0" : "border border-line"}`}>{done ? <Icon name="Check" size={12} /> : i + 1}</span>{s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* 1 · Apply: Knack checks the person before it records their hands. */
const CHECKS = [
  { icon: "ChefHat", t: "Work history", d: "3 kitchens confirmed: Saffron Room, Colaba · Hotel Marine Crest · Ember & Salt, Bandra" },
  { icon: "Award", t: "Skill Guild of India", d: "Level 5 · knife work and butchery" },
  { icon: "Hand", t: "Hand-health screening", d: "Grip 91% · steadiness 88% · early arthritis in the right wrist (allowed)" },
  { icon: "Fingerprint", t: "Identity", d: "Aadhaar e-KYC verified" },
];
function ExpertApply({ onNext }) {
  const t = useElapsed(9000);
  const doneAt = (i) => 900 + i * 1100;
  const all = t > doneAt(CHECKS.length - 1) + 400;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="relative overflow-hidden p-6 sm:p-8 lg:col-span-2">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/10 blur-3xl" />
        <Label>Why experts record</Label>
        <h2 className="mt-3 text-[30px] font-medium leading-[1.08] tracking-tight sm:text-[36px]">Your hands keep working after you stop.</h2>
        <ul className="mt-6 grid gap-4 text-[15px] text-ink/80">
          {[["Coins", "Paid for every minute anyone streams your skill, for as long as it's in the vault."], ["Lock", "You choose who may never use your hands."], ["Clock", "You just work. The patch records during the shifts you choose."]].map(([i, x]) => (
            <li key={x} className="flex gap-3"><Icon name={i} size={18} className="mt-0.5 shrink-0 text-brass" />{x}</li>
          ))}
        </ul>
        <blockquote className="mt-10 border-l-2 border-brass/60 pl-4 text-[19px] font-light italic leading-snug text-ink/90">“When my hands stop, everything they know stops with them.”<footer className="mt-2 text-[13px] not-italic text-mute">Arjun, on why he applied</footer></blockquote>
      </Card>
      <Card className="p-6 sm:p-8 lg:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div><Label>Application</Label><h2 className="mt-2 text-2xl font-medium tracking-tight">Checking you before we record you</h2></div>
          <div className={`rounded-full border px-3 py-1 text-[12px] transition-all duration-500 ${all ? "scale-100 border-ok/50 bg-ok/10 text-ok opacity-100" : "scale-90 border-line text-mute opacity-70"}`}>{all ? "Approved" : "In review"}</div>
        </div>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {CHECKS.map((c, i) => {
            const done = t > doneAt(i), busy = !done && t > doneAt(i) - 1000;
            return (
              <li key={c.t} className="flex items-start gap-4 py-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${done ? "border-ok/50 bg-ok/10 text-ok" : "border-line text-mute"}`}>
                  {done ? <Icon name="Check" size={18} /> : busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brass" /> : <Icon name={c.icon} size={17} />}
                </span>
                <div className="min-w-0">
                  <div className="text-[16px] font-medium">{c.t}</div>
                  <div className={`text-[14px] transition-opacity duration-500 ${done ? "text-ink/75 opacity-100" : "text-mute opacity-60"}`}>{done ? c.d : busy ? "Checking…" : "Waiting"}</div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 ${appear(all)}`}>
          <p className="text-[14px] text-ink/75">Approved to record <span className="text-ink">knife work</span>.</p>
          <button className="btn-primary !px-5 !py-3" onClick={onNext} disabled={!all}>Continue to terms<Icon name="ArrowRight" size={16} /></button>
        </div>
      </Card>
    </div>
  );
}

/* 2 · Terms: the split, the limits, and the clause that matters. */
function ExpertTerms({ expert, setExpert, onNext }) {
  const [signing, setSigning] = useState(false);
  const limits = { minors: true, weapons: true, police: false, ...(expert.limits || {}) };
  const set = (k) => setExpert((e) => ({ ...e, limits: { ...limits, [k]: !limits[k] } }));
  const sign = () => { setSigning(true); setTimeout(() => { setExpert((e) => ({ ...e, signed: true })); onNext(); }, 1600); };
  const Row = ({ k, t, d }) => (
    <li className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1"><div className="text-[15px]">{t}</div>{d && <div className="text-[13px] text-mute">{d}</div>}</div>
      <button role="switch" aria-checked={limits[k]} aria-label={t} onClick={() => set(k)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${limits[k] ? "border-brass bg-brass/80" : "border-line bg-slate0"}`}>
        <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-ink transition-all ${limits[k] ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </li>
  );
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="p-6 sm:p-8 lg:col-span-3">
        <Label>Every hour someone streams your hands</Label>
        <div className="mt-3 text-[48px] font-light leading-none tracking-tight tnum sm:text-[64px]">{inr(EXPERT.rate)}</div>
        <div className="mt-6 flex h-16 overflow-hidden rounded-xl border border-line">
          <div className="flex flex-col justify-center bg-brass px-4 text-slate0" style={{ width: `${EXPERT.share * 100}%` }}>
            <div className="text-[12px] font-medium opacity-80">You · 30%</div><div className="text-[20px] font-medium tnum">{inr(EXPERT_CUT)}</div>
          </div>
          <div className="flex flex-1 flex-col justify-center bg-slate0 px-4">
            <div className="text-[12px] text-mute">Knack · 70%</div><div className="text-[20px] font-medium tnum text-ink/80">{inr(EXPERT.rate - EXPERT_CUT)}</div>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-mute">Knack's share pays for certification, the vault, safety monitoring and the 24/7 clinical line.</p>
        <div className="mt-6 rounded-xl border border-warn/40 bg-warn/5 p-4">
          <div className="flex items-center gap-2 text-[15px] font-medium"><Icon name="FileWarning" size={18} className="text-warn" />Clause 14.2</div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/85">Knack may combine your recordings with recordings from other experts to build new skills. You are paid for your share of any composite skill, pro rata.</p>
          <p className="mt-2 text-[12.5px] text-mute">Required on the Standard plan. Opting out lowers your share to 12%.</p>
        </div>
      </Card>
      <Card className="flex flex-col p-6 sm:p-8 lg:col-span-2">
        <Label>Who may never use your hands</Label>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          <Row k="minors" t="No one under 18" />
          <Row k="weapons" t="Not for weapons or combat training" />
          <Row k="police" t="Not for police or military use" d="Off by default: public-sector buyers pay 40% more" />
          <li className="flex items-center gap-4 py-3.5 opacity-80">
            <div className="min-w-0 flex-1"><div className="text-[15px]">Use in composite skills</div><div className="text-[13px] text-mute">See clause 14.2</div></div>
            <span className="flex items-center gap-1.5 text-[12px] text-mute"><Icon name="Lock" size={13} />Always on</span>
          </li>
        </ul>
        <div className="mt-auto pt-6">
          <button className="btn-primary w-full !py-3.5 !text-[15px]" onClick={sign} disabled={signing}>
            {signing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate0/30 border-t-slate0" />Signing with Aadhaar…</> : <><Icon name="PenLine" size={16} />Sign with Aadhaar e-Sign</>}
          </button>
          <p className="mt-2 text-center text-[12px] text-mute">You can stop recording at any time. Published skills stay in the vault for 10 years.</p>
        </div>
      </Card>
    </div>
  );
}

/* 3 · Record: six months of real service, two patches, nothing to do but cook. */
const HOURS_RECORDED = 1352;
function Trace({ seed, color, t, live }) {
  const W = 600, H = 120, N = 120;
  const pts = Array.from({ length: N }, (_, i) => {
    const x = (i / (N - 1)) * W, p = t / 380 + i * 0.22 + seed;
    const burst = Math.max(0, Math.sin(p * 0.55 + seed)) ** 6;
    const y = H / 2 + (Math.sin(p * 1.7) * 9 + Math.sin(p * 4.1 + seed) * 6 + Math.sin(p * 9.3) * 3) * (0.35 + burst * 2.6) * (live ? 1 : 0.15);
    return [x, Math.max(4, Math.min(H - 4, y))];
  });
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full" aria-hidden="true">
      <defs><linearGradient id={`tr${seed}`} x1="0" x2="1"><stop offset="0" stopColor={color} stopOpacity="0" /><stop offset=".25" stopColor={color} stopOpacity=".9" /><stop offset="1" stopColor={color} /></linearGradient></defs>
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="#243044" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke={`url(#tr${seed})`} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
      <circle cx={pts[N - 1][0] - 2} cy={pts[N - 1][1]} r="4" fill={color} />
    </svg>
  );
}
const CUTS = ["Brunoise · onions", "Chiffonade · basil", "Julienne · carrots", "Supreme · oranges", "Butterfly · prawns", "Mince · garlic"];
function ExpertRecord({ onNext }) {
  const t = useElapsed(20000);
  const hours = useCountUp(HOURS_RECORDED, 11000);
  const done = hours >= HOURS_RECORDED - 0.5;
  const service = Math.min(156, 1 + Math.floor((hours / HOURS_RECORDED) * 155));
  const cut = CUTS[Math.floor(t / 2200) % CUTS.length];
  const wrist = 22 + 52 * Math.pow(hours / HOURS_RECORDED, 2.2);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="relative overflow-hidden p-6 sm:p-8 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`flex items-center gap-2 text-[13px] font-medium tracking-wide ${done ? "text-ok" : "text-crit"}`}>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${done ? "bg-ok" : "bg-crit animate-pulse"}`} />{done ? "RECORDING COMPLETE" : `RECORDING · SERVICE ${service} OF 156`}
          </span>
          <span className="text-[13px] text-mute">Ember & Salt, Bandra · dinner service</span>
        </div>
        <div className="mt-5 flex items-end gap-3">
          <div className="text-[64px] font-light leading-none tracking-tight tnum sm:text-[96px]">{Math.round(hours).toLocaleString("en-IN")}</div>
          <div className="pb-2 text-[17px] text-ink/70">hours of his hands</div>
        </div>
        <div className="mt-6 grid gap-1">
          <div className="flex justify-between text-[12px] text-mute"><span>Temple patch · planning and timing</span><span className="text-brass">{done ? "done" : "live"}</span></div>
          <Trace seed={1.3} color="#E2B168" t={t} live={!done} />
          <div className="mt-2 flex justify-between text-[12px] text-mute"><span>Forearm patch · grip and wrist</span><span className="text-[#5BBFBA]">{done ? "done" : "live"}</span></div>
          <Trace seed={4.7} color="#5BBFBA" t={t} live={!done} />
        </div>
        <p className="mt-4 text-[14px] text-ink/75">{done ? "Six months of real service, recorded." : <>Hearing now: <span className="text-ink">{cut}</span> · {(5.6 + Math.sin(t / 900) * 0.6).toFixed(1)} cuts a second</>}</p>
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
          {[["Cuts recorded", `${(hours * 1580 / 1e6).toFixed(2)} M`], ["Knives", "4"], ["Dishes", Math.round(hours * 0.31).toLocaleString("en-IN")]].map(([k, v]) => (
            <div key={k}><div className="text-[12.5px] text-mute">{k}</div><div className="mt-1 text-[22px] font-medium tnum">{v}</div></div>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col p-6 sm:p-8 lg:col-span-2">
        <Label>Six months · 156 services</Label>
        <div className="mt-4 flex gap-2">
          <div className="grid grid-rows-7 gap-[3px] text-[10px] leading-[16px] text-mute">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="h-4">{d}</span>)}</div>
          <div className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px]">
            {Array.from({ length: 26 * 7 }, (_, i) => {
              const week = Math.floor(i / 7), day = i % 7, rest = day === 1;
              const lit = !rest && (week + day / 7) / 26 <= hours / HOURS_RECORDED;
              const heat = 0.3 + (((i * 37) % 13) / 13) * 0.7;
              return <div key={i} className="h-4 rounded-[3px] transition-colors duration-300" style={{ background: rest ? "transparent" : lit ? `rgba(226,177,104,${heat})` : "#0B0F17", boxShadow: rest ? "none" : "inset 0 0 0 1px #243044" }} />;
            })}
          </div>
        </div>
        <div className="mt-2 flex justify-between pl-4 text-[11px] text-mute"><span>March</span><span>August</span></div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[["Temple", "Planning and timing"], ["Forearm", "Grip and wrist"]].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-slate0 p-3">
              <div className="flex items-center gap-2 text-[14px]"><span className="h-2 w-2 rounded-full bg-brass" />{k} patch</div>
              <div className="mt-1 text-[12.5px] text-mute">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-line bg-slate0 p-3">
          <div className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2"><Icon name="Activity" size={14} className="text-warn" />Right wrist strain</span><span className="tnum" style={{ color: wrist > 60 ? "#F87171" : wrist > 40 ? "#F5B84B" : "#94A3B8" }}>{Math.round(wrist)}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full" style={{ width: `${wrist}%`, background: wrist > 60 ? "#F87171" : wrist > 40 ? "#F5B84B" : "#94A3B8" }} /></div>
          <div className="mt-1.5 text-[12px] text-mute">{wrist > 60 ? "Rising. Knack will mark hours with tremor for removal." : "Within his normal range."}</div>
        </div>
        <p className="mt-4 text-[13px] text-mute">The patches record only during the shifts he chooses. Nothing about his customers or kitchen is kept.</p>
        <button className="btn-primary mt-auto !py-3" onClick={onNext} disabled={!done}>{done ? "Send to review" : "Recording…"}<Icon name="ArrowRight" size={16} /></button>
      </Card>
    </div>
  );
}

/* 4 · Review: Knack keeps the best hours, not all of them. */
const REMOVED = [["Tiredness", 118, "#F5B84B"], ["Tremor", 61, "#F87171"], ["Mistakes", 33, "#94A3B8"]];
function ExpertReview({ onNext }) {
  const t = useElapsed(8000);
  const sweep = Math.min(1, t / 3200);
  const segs = useMemo(() => Array.from({ length: 169 }, (_, i) => {
    const h = (i * 2654435761) >>> 0;
    const r = h % 100;
    const late = i / 169 > 0.7 ? 6 : 0;
    return r < 9 + late ? 0 : r < 13 + late ? 1 : r < 15 + late ? 2 : -1;
  }), []);
  const kept = useCountUp(1140, 2600, sweep >= 1);
  return (
    <div className="grid gap-4">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Label>Review</Label>
            <h2 className="mt-3 text-[34px] font-medium leading-tight tracking-tight sm:text-[46px]">Kept <span className="text-brass tnum">{Math.round(kept).toLocaleString("en-IN")}</span> hours. Removed 212.</h2>
            <p className="mt-2 text-[15px] text-ink/70">The vault only gets his best hours. Anything a buyer's hands shouldn't learn is cut.</p>
          </div>
        </div>
        <div className="relative mt-7">
          <div className="flex h-20 gap-[2px]">
            {segs.map((s, i) => {
              const shown = i / segs.length <= sweep;
              return <div key={i} className="flex-1 rounded-[2px] transition-all duration-300" style={{ background: !shown ? "#161F2E" : s < 0 ? "#E2B168" : REMOVED[s][2], opacity: !shown ? 1 : s < 0 ? 0.9 : 1, transform: shown && s >= 0 ? "scaleY(.55)" : "none" }} />;
            })}
          </div>
          <div className="pointer-events-none absolute -top-2 bottom-[-8px] w-px bg-ink/80 shadow-[0_0_12px_rgba(248,250,252,.8)]" style={{ left: `${sweep * 100}%`, opacity: sweep < 1 ? 1 : 0, transition: "opacity .5s" }} />
          <div className="mt-2 flex justify-between text-[12px] text-mute"><span>March</span><span>August</span></div>
        </div>
        <div className={`mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4 ${appear(sweep >= 1)}`}>
          <div className="rounded-xl border border-line bg-slate0 p-4"><div className="flex items-center gap-2 text-[13px] text-mute"><span className="h-2 w-2 rounded-full bg-brass" />Kept</div><div className="mt-1 text-[24px] font-medium tnum">1,140 h</div></div>
          {REMOVED.map(([k, h, c]) => (
            <div key={k} className="rounded-xl border border-line bg-slate0 p-4"><div className="flex items-center gap-2 text-[13px] text-mute"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{k}</div><div className="mt-1 text-[24px] font-medium tnum">{h} h</div></div>
          ))}
        </div>
        <p className={`mt-4 text-[14px] text-ink/70 ${appear(sweep >= 1)}`}>Most of the tremor came in the last month, from his right wrist.</p>
      </Card>
      <div className={`flex justify-end ${appear(sweep >= 1)}`}>
        <button className="btn-primary !px-5 !py-3" onClick={onNext}>Send for certification<Icon name="ArrowRight" size={16} /></button>
      </div>
    </div>
  );
}

/* 5 · Publish: his skill becomes a product. */
function ExpertPublish({ expert, setExpert, onNext }) {
  const t = useElapsed(6000);
  const stamped = t > 1300;
  const F = VAULT().Footage;
  const live = !!expert.published;
  const [burst, setBurst] = useState(false);
  const publish = () => { setBurst(true); setExpert((e) => ({ ...e, published: true })); };
  return (
    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
      <div className={`relative ${burst ? "knack-burst" : ""}`}>
        <div className="pointer-events-none absolute -inset-10 rounded-[40px] bg-[radial-gradient(closest-side,rgba(226,177,104,.22),transparent)] transition-opacity duration-1000" style={{ opacity: live ? 1 : 0.35 }} />
        <div className="relative overflow-hidden rounded-2xl border border-brass/40 bg-card shadow-[0_30px_80px_rgba(0,0,0,.55)]">
          <div className="relative h-56 sm:h-64">
            {F && <F scene="knife" variant={0} offset={0.2} speed={1} className="h-full w-full" />}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-slate0/80 px-2.5 py-1 text-[11px] text-ink ring-1 ring-ink/15">Human expert</span>
            <div className={`absolute right-5 top-5 grid h-24 w-24 place-items-center rounded-full border-2 border-brass text-center text-brass transition-all duration-500 ${stamped ? "rotate-[-12deg] scale-100 opacity-100" : "rotate-[20deg] scale-150 opacity-0"}`} style={{ background: "rgba(11,15,23,.7)" }}>
              <div className="text-[9px] font-medium leading-tight tracking-[.14em]">CERTIFIED<br /><span className="text-[11px] tracking-normal">CL3-2035</span><br />0092</div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2"><h2 className="text-[24px] font-medium tracking-tight">Culinary Knife Techniques v2.1</h2><Icon name="BadgeCheck" size={20} className="text-brass" /></div>
            <div className="mt-1 text-[14px] text-mute">{EXPERT.name} · 1,140 hours of real service</div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[["Price", `${inr(EXPERT.rate)}/h`], ["You earn", `${inr(EXPERT_CUT)}/h`], ["Licence", "CL3-2035-0092"]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-slate0 p-2.5"><div className="text-[12px] text-mute">{k}</div><div className="mt-0.5 truncate text-[15px] tnum">{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <Label>Certification passed</Label>
        <h2 className="mt-3 text-[36px] font-medium leading-[1.06] tracking-tight sm:text-[52px]">{live ? "His hands are in the vault." : "Ready to publish."}</h2>
        <p className="mt-4 max-w-[46ch] text-[16px] text-ink/75">{live ? "From today, anyone in India with a Knack patch can rent them by the hour." : "Once published, his skill can be streamed by anyone who passes the limits he set."}</p>
        {live ? (
          <button className="btn-primary mt-7 !px-6 !py-3.5 !text-[15px]" onClick={onNext}>See earnings<Icon name="ArrowRight" size={16} /></button>
        ) : (
          <button className="btn-primary mt-7 !px-6 !py-3.5 !text-[15px] shadow-[0_0_40px_rgba(226,177,104,.35)]" onClick={publish}><Icon name="Rocket" size={16} />Publish to the vault</button>
        )}
      </div>
    </div>
  );
}

/* 6 · Earnings: every minute, everywhere, and what clause 14.2 did. */
const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const HIS_HOURS = [40, 190, 420, 610, 590, 559];
const COMPOSITE_HOURS = [0, 0, 0, 260, 1350, 2980];
const CITIES = [["Mumbai", 72.88, 19.08], ["Pune", 73.86, 18.52], ["Delhi", 77.21, 28.61], ["Bengaluru", 77.59, 12.97], ["Kochi", 76.27, 9.93], ["Kolkata", 88.36, 22.57], ["Hyderabad", 78.49, 17.39], ["Chennai", 80.27, 13.08], ["Jaipur", 75.79, 26.91], ["Ahmedabad", 72.57, 23.02], ["Panaji", 73.83, 15.49], ["Lucknow", 80.95, 26.85], ["Chandigarh", 76.78, 30.73], ["Guwahati", 91.74, 26.14], ["Indore", 75.86, 22.72], ["Nagpur", 79.09, 21.15], ["Visakhapatnam", 83.22, 17.69], ["Thiruvananthapuram", 76.94, 8.52]];
const FEED = [["A line cook in Kochi", 120], ["A caterer in Jaipur", 60], ["A culinary student in Delhi", 90], ["A home cook in Bengaluru", 60], ["A hotel trainee in Panaji", 120], ["A tiffin service in Nagpur", 45], ["A cook in Kolkata", 60]];

function HandsMap({ t, highlight }) {
  const W = 420, H = 460;
  const xy = (lon, lat) => [((lon - 68) / 26) * (W - 60) + 30, ((34 - lat) / 27) * (H - 40) + 20];
  const [ox, oy] = xy(72.88, 19.08);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Cities where his skill is being streamed right now">
      <defs>
        <radialGradient id="mapglow"><stop offset="0" stopColor="#E2B168" stopOpacity=".35" /><stop offset="1" stopColor="#E2B168" stopOpacity="0" /></radialGradient>
        <pattern id="mapdots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#243044" /></pattern>
      </defs>
      <rect width={W} height={H} fill="url(#mapdots)" opacity=".7" />
      {CITIES.slice(1).map(([n, lon, lat], i) => {
        const [x, y] = xy(lon, lat), mx = (ox + x) / 2, my = Math.min(oy, y) - 40 - (i % 3) * 14;
        const len = 600, k = Math.min(1, Math.max(0, (t - 400 - i * 140) / 1300));
        const hot = highlight && n === highlight;
        return (
          <g key={n}>
            <path d={`M${ox} ${oy} Q${mx} ${my} ${x} ${y}`} fill="none" stroke={hot ? "#4ADE80" : "#E2B168"} strokeOpacity={hot ? 0.9 : 0.35} strokeWidth={hot ? 1.8 : 1} strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
            <circle cx={x} cy={y} r={hot ? 5 : 3} fill={hot ? "#4ADE80" : "#E2B168"} opacity={k} />
            {k >= 1 && <circle cx={x} cy={y} r={4 + ((t / 30 + i * 13) % 18)} fill="none" stroke={hot ? "#4ADE80" : "#E2B168"} opacity={Math.max(0, 0.5 - ((t / 30 + i * 13) % 18) / 36)} />}
            {(hot || ["Delhi", "Kolkata", "Bengaluru", "Kochi", "Guwahati", "Pune"].includes(n)) && <text x={x + 8} y={y + 4} fontSize="11" fill={hot ? "#4ADE80" : "#94A3B8"} opacity={k}>{n}</text>}
          </g>
        );
      })}
      <circle cx={ox} cy={oy} r="40" fill="url(#mapglow)" />
      <circle cx={ox} cy={oy} r="6" fill="#E2B168" />
      <text x={ox - 44} y={oy + 26} fontSize="12" fill="#E2B168">Mumbai · his kitchen</text>
    </svg>
  );
}

function ExpertEarnings({ order, expert, setExpert }) {
  const t = useElapsed(120000);
  const total = HIS_HOURS[5] * EXPERT_CUT;
  const earned = useCountUp(total, 2600);
  const [reveal, setReveal] = useState(false);
  const [scale, setScale] = useState(700);
  useEffect(() => {
    const target = reveal ? 3200 : 700, from = scale, t0 = performance.now();
    let raf = requestAnimationFrame(function step(now) { const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 3); setScale(from + (target - from) * e); if (k < 1) raf = requestAnimationFrame(step); });
    return () => cancelAnimationFrame(raf);
  }, [reveal]);
  // A real stream of his skill from this browser's own order shows up here as it happens.
  const theirs = ((order && order.history) || []).filter((h) => h.id === EXPERT.skillId);
  const latest = theirs[theirs.length - 1];
  const ping = latest && expert.pinged !== latest.at ? latest : null;
  const [banner, setBanner] = useState(null);
  useEffect(() => {
    if (!ping) return;
    const amount = Math.round((ping.minutes / 60) * EXPERT_CUT);
    const show = setTimeout(() => setBanner({ city: order.address.city, minutes: ping.minutes, amount }), 1600);
    const mark = setTimeout(() => setExpert((e) => ({ ...e, pinged: ping.at })), 1700);
    return () => { clearTimeout(show); clearTimeout(mark); };
  }, [ping && ping.at]);
  useEffect(() => { if (!banner) return; const id = setTimeout(() => setBanner(null), 9000); return () => clearTimeout(id); }, [banner]);

  const feed = useMemo(() => {
    const n = Math.floor(t / 2600);
    const base = Array.from({ length: 5 }, (_, i) => FEED[(n + i) % FEED.length]);
    return banner ? [[`A cook in ${banner.city}`, banner.minutes, true], ...base.slice(0, 4)] : base;
  }, [Math.floor(t / 2600), !!banner]);

  const W = 640, H = 230, pad = 30;
  const x = (i) => pad + (i / (MONTHS.length - 1)) * (W - pad * 2);
  const y = (v) => H - 26 - (v / scale) * (H - 46);
  const line = (vals) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <div className="grid gap-4">
      {banner && ReactDOM.createPortal(
        <div className="fixed right-4 top-4 z-[60] w-[min(380px,calc(100vw-32px))] rounded-2xl border border-line bg-card/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,.6)] backdrop-blur knack-drop" role="status">
          <div className="flex items-center gap-2 text-[12px] text-mute"><span className="grid h-5 w-5 place-items-center rounded-md bg-brass text-[10px] font-semibold text-slate0">k</span>Knack · now</div>
          <div className="mt-2 text-[22px] font-medium text-ok tnum">+{inr(banner.amount)}</div>
          <div className="text-[14px] text-ink/85">A cook in {banner.city} streamed your knife skills for {fmtH(banner.minutes)}.</div>
        </div>, document.body)}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="relative overflow-hidden p-6 sm:p-8 lg:col-span-3">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brass/10 blur-3xl" />
          <Label>Earned in October</Label>
          <div className="mt-3 text-[56px] font-light leading-none tracking-tight text-brass tnum sm:text-[84px]">{inr(earned)}</div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[["Rentals so far", "14,200"], ["Hours in October", `${HIS_HOURS[5]} h`], ["Your share", "30%"]].map(([k, v]) => (
              <div key={k} className="border-t border-line pt-3"><div className="text-[12.5px] text-mute">{k}</div><div className="mt-1 text-[22px] font-medium tnum">{v}</div></div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[15px] font-medium">Knife-skill hours streamed on Knack</div>
            <button className="btn-ghost !py-1.5" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}><Icon name={reveal ? "EyeOff" : "Eye"} size={14} />{reveal ? "Hide composite skills" : "What changed in August?"}</button>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Monthly hours of his skill compared with the composite skill">
            {[0, 0.5, 1].map((k) => <line key={k} x1={pad} x2={W - pad} y1={H - 26 - k * (H - 46)} y2={H - 26 - k * (H - 46)} stroke="#243044" />)}
            {MONTHS.map((m, i) => <text key={m} x={x(i)} y={H - 6} textAnchor="middle" fontSize="12" fill="#94A3B8">{m}</text>)}
            <path d={`${line(HIS_HOURS)} L${x(5)} ${H - 26} L${x(0)} ${H - 26} Z`} fill="rgba(226,177,104,.12)" />
            <path d={line(HIS_HOURS)} fill="none" stroke="#E2B168" strokeWidth="2.5" />
            {HIS_HOURS.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#E2B168" />)}
            <g style={{ opacity: reveal ? 1 : 0, transition: "opacity .8s" }}>
              <path d={line(COMPOSITE_HOURS)} fill="none" stroke="#F87171" strokeWidth="2.5" strokeDasharray="1 0" />
              {COMPOSITE_HOURS.map((v, i) => i >= 3 && <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#F87171" />)}
              <line x1={x(3)} x2={x(3)} y1={pad - 10} y2={H - 26} stroke="#F87171" strokeDasharray="3 4" opacity=".6" />
              <text x={x(3) + 6} y={pad} fontSize="12" fill="#F87171">Composite launched · 14 Aug</text>
            </g>
          </svg>
          <div className={`mt-3 grid gap-2 text-[13px] sm:grid-cols-2 ${appear(reveal)}`}>
            <div className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brass" /><span><span className="text-ink">His skill</span> · ₹1,850/h · {HIS_HOURS[5]} h in October, falling</span></div>
            <div className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-crit" /><span><span className="text-ink">Kitchen Knife Fundamentals</span> · composite · ₹340/h · built from 3,100 sessions, including 412 of his hours. His share in October: ₹6,820.</span></div>
          </div>
        </Card>
        <Card className="flex flex-col p-6 sm:p-8 lg:col-span-2">
          <Label>Where his hands are working right now</Label>
          <div className="mt-3 aspect-[42/46] w-full"><HandsMap t={t} highlight={banner ? banner.city : null} /></div>
          <ul className="mt-4 grid gap-2">
            {feed.map(([who, mins, hot], i) => (
              <li key={who + i} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[13px] transition-colors ${hot ? "border-ok/50 bg-ok/10" : "border-line"}`}>
                <span className="min-w-0 truncate text-ink/85">{who} · {fmtH(mins)}</span><span className={`tnum ${hot ? "text-ok" : "text-mute"}`}>+{inr((mins / 60) * EXPERT_CUT)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Experts({ expert, setExpert, order }) {
  const step = expert.step || "apply";
  const idx = EXPERT_STEPS.findIndex((s) => s.id === step);
  const go = (id) => { setExpert((e) => ({ ...e, step: id })); window.scrollTo({ top: 0 }); };
  const next = () => go(EXPERT_STEPS[Math.min(EXPERT_STEPS.length - 1, idx + 1)].id);
  const reach = (i) => i <= idx || (i === EXPERT_STEPS.length - 1 && expert.published) || (expert.published && i < EXPERT_STEPS.length);
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <ExpertHeader step={step} setStep={go} reach={reach} />
      <div className="mt-6 fade-in" key={step}>
        {step === "apply" && <ExpertApply onNext={next} />}
        {step === "terms" && <ExpertTerms expert={expert} setExpert={setExpert} onNext={next} />}
        {step === "record" && <ExpertRecord onNext={next} />}
        {step === "review" && <ExpertReview onNext={next} />}
        {step === "publish" && <ExpertPublish expert={expert} setExpert={setExpert} onNext={next} />}
        {step === "earnings" && <ExpertEarnings order={order} expert={expert} setExpert={setExpert} />}
      </div>
    </main>
  );
}

document.head.insertAdjacentHTML("beforeend", `<style>
@keyframes knackDrop { from { opacity: 0; transform: translateY(-18px) scale(.98) } to { opacity: 1; transform: none } }
.knack-drop { animation: knackDrop .55s cubic-bezier(.2,.8,.2,1) both }
@keyframes knackBurst { 0% { transform: scale(1) } 25% { transform: scale(1.035) } 100% { transform: scale(1) } }
.knack-burst { animation: knackBurst 1s ease-out both }
</style>`);
