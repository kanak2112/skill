const { useState, useEffect, useRef, useCallback, useMemo } = React;
const L = window.LucideReact || {};
const Icon = ({ name, size = 18, className = "" }) => {
  const C = L[name];
  return C ? <C size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
           : <span style={{ width: size, height: size, display: "inline-block" }} aria-hidden="true" />;
};

/* ───────────── Shared data ───────────── */
const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmtH = (mins) => {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
};
const shortDate = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const hashStr = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);

function poly(sides, r, rot = 0) {
  const p = [];
  for (let i = 0; i < sides; i++) { const a = (Math.PI * 2 / sides) * i + rot; p.push(`${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`); }
  return `M${p.join(" L")} Z`;
}
function star(points = 5, o = 44, i = 19) {
  const p = [];
  for (let k = 0; k < points * 2; k++) { const r = k % 2 ? i : o, a = (Math.PI / points) * k - Math.PI / 2; p.push(`${(50 + r * Math.cos(a)).toFixed(1)} ${(52 + r * Math.sin(a)).toFixed(1)}`); }
  return `M${p.join(" L")} Z`;
}
const SHAPES = [
  { id: "heart", name: "Heart", code: "LUV", mode: "fill", d: "M50 88 C22 66 8 48 8 32 A21 21 0 0 1 50 24 A21 21 0 0 1 92 32 C92 48 78 66 50 88 Z" },
  { id: "tear", name: "Tear drop", code: "TRS", mode: "fill", d: "M50 6 C50 6 82 44 82 63 A32 32 0 0 1 18 63 C18 44 50 6 50 6 Z" },
  { id: "anger", name: "Anger glyph", code: "ANG", mode: "stroke", width: 12, cap: "butt", d: "M40 12 Q38 38 12 40 M60 12 Q62 38 88 40 M12 60 Q38 62 40 88 M88 60 Q62 62 60 88" },
  { id: "bolt", name: "Lightning bolt", code: "VLT", mode: "fill", d: "M58 6 L20 56 H46 L38 94 L80 40 H54 Z" },
  { id: "hex", name: "Hexagon", code: "HEX", mode: "fill", d: poly(6, 42, Math.PI / 6) },
  { id: "star", name: "Star", code: "STR", mode: "fill", d: star() },
  { id: "crescent", name: "Crescent", code: "LUN", mode: "fill", d: "M62 8 A42 42 0 1 0 92 70 A33 33 0 1 1 62 8 Z" },
  { id: "chevron", name: "Wings", code: "CHV", mode: "fill", d: "M6 26 L50 56 L94 26 L94 50 L50 82 L6 50 Z" },
];
const FINISHES = [
  { id: "red", name: "Electro-Chromic Red", hex: "#ff2a4b" },
  { id: "cyan", name: "Cyber Cyan", hex: "#00f0ff" },
  { id: "gold", name: "Matte Gold", hex: "#ffb703" },
  { id: "slate", name: "Stealth Slate", hex: "#5b6b82" },
];
const COATINGS = [
  { id: "gloss", name: "Glossy", rough: 0.16, metal: 0.6, coat: 1 },
  { id: "satin", name: "Satin", rough: 0.42, metal: 0.35, coat: 0.3 },
  { id: "matte", name: "Matte", rough: 0.85, metal: 0.05, coat: 0 },
];
const findShape = (id) => SHAPES.find((s) => s.id === id) || SHAPES[0];
const findFinish = (id) => FINISHES.find((f) => f.id === id) || FINISHES[0];

/* Prompt → shape, colour, finish. Words the parser doesn't know leave the setting unchanged. */
const WORDS = {
  shape: [["heart", ["heart", "love"]], ["tear", ["tear", "teardrop", "drop", "droplet"]], ["anger", ["anger", "angry", "rage", "glyph"]], ["bolt", ["bolt", "lightning", "spark", "electric"]], ["hex", ["hex", "hexagon", "honeycomb"]], ["star", ["star"]], ["crescent", ["moon", "crescent"]], ["chevron", ["wing", "wings", "chevron"]]],
  color: [["red", ["red", "crimson", "ruby", "scarlet"]], ["cyan", ["cyan", "blue", "teal", "aqua"]], ["gold", ["gold", "golden", "yellow", "amber"]], ["slate", ["slate", "stealth", "grey", "gray", "black", "silver"]]],
  coat: [["gloss", ["glossy", "gloss", "shiny", "metallic", "chrome", "polished"]], ["satin", ["satin", "pearl", "silk"]], ["matte", ["matte", "flat", "brushed"]]],
};
function parsePrompt(text) {
  const w = text.toLowerCase().match(/[a-z]+/g) || [];
  const hit = (table) => (table.find(([, keys]) => w.some((x) => keys.includes(x))) || [])[0];
  return { shapeId: hit(WORDS.shape), finishId: hit(WORDS.color), coating: hit(WORDS.coat) };
}

/* Freehand strokes (0–100 pad space) → centred, smoothed wire shape. */
function strokesToPath(strokes) {
  const all = strokes.flat();
  if (!all.length) return null;
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const w = Math.max(...xs) - minX, h = Math.max(...ys) - minY;
  const s = 72 / Math.max(w, h, 1), ox = 50 - (w * s) / 2, oy = 50 - (h * s) / 2;
  const f = (p) => [(p[0] - minX) * s + ox, (p[1] - minY) * s + oy];
  const n = (v) => v.toFixed(1);
  return strokes.map((raw) => {
    const pts = raw.map(f);
    if (pts.length === 1) return `M${n(pts[0][0])} ${n(pts[0][1])} l0.1 0`;
    let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) d += ` Q${n(pts[i][0])} ${n(pts[i][1])} ${n((pts[i][0] + pts[i + 1][0]) / 2)} ${n((pts[i][1] + pts[i + 1][1]) / 2)}`;
    const l = pts[pts.length - 1];
    return `${d} L${n(l[0])} ${n(l[1])}`;
  }).join(" ");
}

const NODES = {
  temple: {
    name: "Temple", x: 128, y: 62, strength: "Best",
    bestFor: "Hand and face skills: writing, carving, instruments",
    helps: ["Fine finger and hand movement", "Planning a sequence of movements", "Timing between both hands"],
    place: ["Two fingers above and slightly in front of the top of your ear", "Notch pointing to the outer corner of your eye", "Clean, dry skin with hair trimmed short"],
  },
  neck: {
    name: "Neck", x: 112, y: 128, strength: "Good",
    bestFor: "Posture and shoulder skills: lifting, standing work",
    helps: ["Shoulder and upper-back stability", "Holding posture while standing", "Carrying and lifting"],
    place: ["Centre of the back of your neck, two finger-widths below the skull", "Logo upright", "Clear of the sweaty hairline"],
  },
  forearm: {
    name: "Forearm", x: 196, y: 262, strength: "Very good",
    bestFor: "Grip and wrist skills: tools, suturing, pinch grip",
    helps: ["Finger bending and grip strength", "A steady wrist", "Thumb-to-finger pinch"],
    place: ["Inner forearm, a hand-width below the elbow crease", "Long edge in line with your forearm", "Snug: two fingers fit under the strap"],
  },
};

const PRICING = { kit: 44900, shell: 4000 };
const DELIVERY = [
  { id: "standard", name: "Standard", days: [5, 7], fee: 0, note: "Free · tracked courier" },
  { id: "express", name: "Express", days: [2, 2], fee: 499, note: "Priority print and dispatch" },
];
const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const STAGES = [
  { id: "placed", label: "Order placed", detail: "Payment confirmed" },
  { id: "printing", label: "Printing your shell", detail: "Your design is being 3D printed" },
  { id: "qc", label: "Quality check", detail: "Patch tested and matched to your patch ID" },
  { id: "shipped", label: "Shipped", detail: "With the courier" },
  { id: "out", label: "Out for delivery", detail: "Arriving today" },
  { id: "delivered", label: "Delivered", detail: "Unbox it and pair your patch" },
];
const deliveryWindow = (id, from) => {
  const d = DELIVERY.find((x) => x.id === id) || DELIVERY[0];
  return d.days.map((n) => new Date(from.getTime() + n * 864e5));
};

function validateAddress(a) {
  const e = {};
  if (!a.name.trim() || a.name.trim().length < 2) e.name = "Enter the name of the person receiving the parcel.";
  const phone = a.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) e.phone = "Enter a 10-digit Indian mobile number, for example 98765 43210.";
  if (a.street.trim().length < 5) e.street = "Enter your house or flat number and street.";
  if (!a.city.trim()) e.city = "Enter your city or town.";
  if (!STATES.includes(a.state)) e.state = "Choose your state or union territory.";
  if (!/^[1-9]\d{5}$/.test(a.pin.trim())) e.pin = "Enter a 6-digit PIN code. It can't start with 0.";
  return e;
}

/* Skill classes from the original manual, plus monthly plans (20 stream hours each). */
const CLASSES = {
  base:     { name: "Base Motor",       mult: 1.5, risk: 0.6, fee: 340,  monthly: 4900,   desc: "Everyday movement: typing rhythm, walking correction, basic tool grip. From the Neural Stream™ Commons library." },
  master:   { name: "Master Craftsman", mult: 3.0, risk: 1.4, fee: 2150, monthly: 29900,  desc: "Fine hand skills recorded from certified tradespeople: joinery, welding, knot-tying. The artisan is paid per minute." },
  virtuoso: { name: "Virtuoso",         mult: 4.5, risk: 2.4, fee: 9800, monthly: 149000, desc: "Concert and theatre-grade precision. Needs 40 logged hours and a current clinical clearance." },
};
const PLAN_HOURS = 20;

/* Baseline the patch records during calibration. Prototype values come from the patch ID and
   wearing spot, so the same patch always measures the same. */
function measureBaseline(serial, node) {
  const h = hashStr(`${serial}:${node}`);
  const pick = (shift, min, span) => min + ((h >>> shift) % (span + 1));
  return { at: new Date().toISOString(), node, steadiness: pick(0, 58, 34), response: pick(5, 180, 90), endurance: pick(11, 35, 85) };
}
const logged = (history = []) => history.reduce((a, s) => a + s.minutes, 0);

/* ───────────── Small shared pieces ───────────── */
const Card = ({ children, className = "" }) => (
  <section className={`min-w-0 rounded-2xl border border-line bg-card ${className}`}>{children}</section>
);
const Label = ({ children, className = "" }) => <div className={`label ${className}`}>{children}</div>;

/** 2D shell render used for thumbnails, the map and the exploded view. */
function Shell({ shape, color, coating = "gloss", size, className = "", ...rest }) {
  const id = useMemo(() => `s${Math.random().toString(36).slice(2, 8)}`, []);
  const gloss = coating === "gloss" ? 1.2 : coating === "satin" ? 0.6 : 0.25;
  const paint = shape.mode === "stroke"
    ? { fill: "none", stroke: `url(#g${id})`, strokeWidth: shape.width || 9, strokeLinecap: shape.cap || "round", strokeLinejoin: "round" }
    : { fill: `url(#g${id})` };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={{ overflow: "visible", filter: `drop-shadow(0 0 6px ${color}66)` }} aria-hidden="true" {...rest}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={coating === "matte" ? 0.35 : 0.9} />
          <stop offset="0.3" stopColor={color} />
          <stop offset="1" stopColor="#0B0F17" />
        </linearGradient>
        <filter id={`b${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="4" specularConstant={gloss} specularExponent="22" lightingColor="#fff" result="spec">
            <fePointLight x="18" y="-24" z="70" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="s" />
          <feComposite in="SourceGraphic" in2="s" operator="arithmetic" k2="1" k3="1" />
        </filter>
      </defs>
      <path d={shape.d} {...paint} filter={`url(#b${id})`} />
    </svg>
  );
}

/* ───────────── 3D head (Three.js r147) ───────────── */
function shellCanvas(shape, color, coating) {
  const size = 512, c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const path = new Path2D(shape.d);
  ctx.scale(size / 100, size / 100);
  const g = ctx.createLinearGradient(0, 0, 100, 100);
  g.addColorStop(0, coating === "matte" ? color : "#ffffff");
  g.addColorStop(0.3, color);
  g.addColorStop(1, "#0b0f17");
  ctx.shadowColor = color;
  ctx.shadowBlur = coating === "matte" ? 2 : 6;
  if (shape.mode === "stroke") {
    ctx.lineWidth = shape.width || 9; ctx.lineCap = shape.cap || "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = g; ctx.stroke(path);
  } else { ctx.fillStyle = g; ctx.fill(path); }
  if (coating !== "matte") {
    ctx.shadowBlur = 0; ctx.globalCompositeOperation = "source-atop";
    ctx.strokeStyle = `rgba(255,255,255,${coating === "gloss" ? 0.6 : 0.3})`; ctx.lineWidth = 1.2;
    ctx.translate(-0.8, -0.8); ctx.stroke(path);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  return tex;
}
/** The bare DS-28 patch: a small rounded rectangle, graphite body with a brass rim. */
function patchCanvas() {
  const size = 512, c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.scale(size / 100, size / 100);
  const rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect ? p.roundRect(x, y, w, h, r) : (p.moveTo(x + r, y), p.arcTo(x + w, y, x + w, y + h, r), p.arcTo(x + w, y + h, x, y + h, r), p.arcTo(x, y + h, x, y, r), p.arcTo(x, y, x + w, y, r), p.closePath()); return p; };
  const body = rr(18, 31, 64, 38, 12);
  const g = ctx.createLinearGradient(0, 31, 0, 69);
  g.addColorStop(0, "#4a5466"); g.addColorStop(0.5, "#252c38"); g.addColorStop(1, "#11151c");
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 3;
  ctx.fillStyle = g; ctx.fill(body);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#E2B168"; ctx.lineWidth = 2.2; ctx.stroke(rr(19.2, 32.2, 61.6, 35.6, 11));
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 0.8; ctx.stroke(rr(22, 34.5, 56, 15, 8));
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  return tex;
}
const b64ToBuffer = (b64) => {
  const bin = atob(b64), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
};

/* Camera framings. `dir` is where the camera sits relative to the target; `dist` scales the base distance.
   Temple and neck aim straight at the shell; forearm pulls back to show the raised arm. */
const FRAMES = {
  hero:    { target: [0, 0.1, 0],     dist: 1.05, dir: [-0.62, 0.1, 0.78] },
  temple:  { target: [0, 0.16, 0],    dist: 1.0,  dir: "spot" },
  neck:    { target: [0, 0.1, 0],     dist: 1.0,  dir: "spot" },
  forearm: { target: [0.04, -0.1, 0.14], dist: 1.6, dir: [0.25, 0.22, 1] },
  face:    { target: [0, 0.18, 0],    dist: 0.82, dir: [-0.42, 0.06, 1] },
};

/**
 * Live WebGL canvas: a scanned head with orbit controls (drag to turn 360°, scroll or pinch to zoom),
 * plus a raised forearm for the forearm placement. The shell is projected onto the skin as a decal.
 * A portrait photo, if given, is projected onto the face from the front and blended into the skin,
 * so the shell can be previewed on the buyer's own face.
 * Head scan "Lee Perry-Smith" by Infinite-Realities, CC BY 3.0.
 */
function HeadStage({ shape, color, coating, node, autoTurn, photo, frame, hero = false }) {
  const mount = useRef(null);
  const api = useRef({});
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const el = mount.current;
    if (!window.THREE || !THREE.GLTFLoader || !window.__HEAD) { setStatus("error"); return; }
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { setStatus("error"); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute("aria-label", "3D model wearing your shell. Drag to turn, scroll or pinch to zoom.");
    renderer.domElement.setAttribute("role", "img");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 100);
    const rig = new THREE.Group();
    const key = new THREE.DirectionalLight("#ffe7cf", 2.4); key.position.set(-3, 4, 5);
    const rim = new THREE.DirectionalLight("#e2b168", 4); rim.position.set(4, 2, -5);
    const fill = new THREE.DirectionalLight("#8fb2ff", 0.5); fill.position.set(-5, -1, 1);
    rig.add(key, rim, fill);
    scene.add(rig, new THREE.HemisphereLight("#c9d6ff", "#140c08", 0.3));
    const glow = new THREE.PointLight("#ff2a4b", 0, 0.35, 2);
    scene.add(glow);

    const target = new THREE.Vector3(0, 0.12, 0);
    const baseDist = () => 2.2 * Math.max(1, 0.95 / camera.aspect);
    camera.position.set(-Math.sin(0.9) * 2.2, 0.24, Math.cos(0.9) * 2.2);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = false; controls.rotateSpeed = 0.7;
    controls.minPolarAngle = Math.PI * 0.25; controls.maxPolarAngle = Math.PI * 0.68;
    controls.autoRotateSpeed = -1.2;
    let pausedUntil = 0, tween = null, frameName = null, frameScale = 1;
    // In the hero the head never stops turning: dragging just adds to the spin.
    const isHero = () => !!(api.current.props && api.current.props.hero);
    controls.addEventListener("start", () => { tween = null; if (!isHero()) pausedUntil = Infinity; });
    controls.addEventListener("end", () => { pausedUntil = isHero() ? 0 : performance.now() + 3000; });

    const setLimits = () => {
      const d = baseDist() * frameScale;
      controls.minDistance = d * 0.5; controls.maxDistance = d * 1.6;
    };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      setLimits();
      const off = camera.position.clone().sub(controls.target).setLength(baseDist() * frameScale);
      camera.position.copy(controls.target).add(off);
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    let head = null, arm = null, decal = null, spots = {}, current = null, morphStart = 0, raf = 0, disposed = false;
    const material = new THREE.MeshPhysicalMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.5 });

    // Photo projection uniforms: x, y = photo centre, z = photo width, w = photo height (head units).
    const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank.needsUpdate = true;
    const photoU = { uPhoto: { value: blank }, uPhotoOn: { value: 0 }, uXf: { value: new THREE.Vector4(0, 0.17, 0.62, 0.78) }, uUnit: { value: 1 } };

    // Move the camera (and what it looks at) to a framing, over 0.9 s.
    const goTo = (name, spot) => {
      const f = FRAMES[name] || FRAMES.temple;
      frameName = name; frameScale = f.dist; setLimits();
      const t = new THREE.Vector3(...f.target);
      let dir;
      if (f.dir === "spot" && spot) { dir = spot.normal.clone(); dir.y = 0.12; }
      else dir = new THREE.Vector3(...(Array.isArray(f.dir) ? f.dir : [-0.6, 0.1, 0.8]));
      dir.normalize();
      tween = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toTarget: t, toPos: t.clone().add(dir.multiplyScalar(baseDist() * f.dist)), t0: performance.now() };
      pausedUntil = isHero() ? 0 : performance.now() + 6000;
    };
    api.current.goTo = goTo;

    const findSpot = (mesh, from, dir, roll, size) => {
      mesh.updateMatrixWorld(true);
      const hit = new THREE.Raycaster(from, dir.normalize()).intersectObject(mesh, false)[0];
      if (!hit) return null;
      const n = hit.face.normal.clone().transformDirection(mesh.matrixWorld);
      const helper = new THREE.Object3D();
      helper.position.copy(hit.point); helper.lookAt(hit.point.clone().add(n)); helper.rotateZ(roll);
      const geo = new THREE.DecalGeometry(mesh, hit.point, helper.rotation, new THREE.Vector3(size, size, size * 0.55));
      geo.translate(-hit.point.x, -hit.point.y, -hit.point.z);
      return { point: hit.point.clone(), normal: n, geo };
    };

    const apply = () => {
      const p = api.current.props;
      if (!head || !p) return;
      const spot = p.hero ? spots.patch : spots[p.node];
      if (!spot) return;
      if (!decal) { decal = new THREE.Mesh(spot.geo, material); scene.add(decal); }
      decal.geometry = spot.geo;
      decal.position.copy(spot.point);
      arm.visible = p.node === "forearm";
      const c = p.hero ? { rough: 0.3, metal: 0.55, coat: 1 } : COATINGS.find((x) => x.id === p.coating) || COATINGS[0];
      if (material.map) material.map.dispose();
      const tex = p.hero ? patchCanvas() : shellCanvas(p.shape, p.color, p.coating);
      const tint = p.hero ? "#E2B168" : p.color;
      material.map = tex; material.emissiveMap = tex;
      material.emissive.set(tint);
      material.roughness = c.rough; material.metalness = c.metal; material.clearcoat = c.coat; material.clearcoatRoughness = 0.1;
      material.needsUpdate = true;
      glow.color.set(tint);
      glow.position.copy(spot.point.clone().add(spot.normal.clone().multiplyScalar(0.05)));
      morphStart = performance.now();
      const want = p.frame || p.node;
      const key = p.hero ? "patch" : p.node;
      if (current !== key || frameName !== want) { current = key; goTo(want, spot); }
    };
    api.current.apply = apply;

    const setPhoto = (ph) => {
      if (!ph) { photoU.uPhotoOn.value = 0; return; }
      const w = ph.size, h = ph.size * ph.aspect;
      photoU.uXf.value.set(ph.x, ph.y, w, h);
      if (api.current.photoUrl !== ph.url) {
        api.current.photoUrl = ph.url;
        new THREE.TextureLoader().load(ph.url, (tx) => {
          if (photoU.uPhoto.value !== blank) photoU.uPhoto.value.dispose();
          photoU.uPhoto.value = tx; photoU.uPhotoOn.value = 1;
        });
      } else photoU.uPhotoOn.value = 1;
    };
    api.current.setPhoto = setPhoto;

    const head64 = window.__HEAD;
    new THREE.GLTFLoader().parse(b64ToBuffer(head64.model), "", (gltf) => {
      if (disposed) return;
      const tl = new THREE.TextureLoader();
      const col = tl.load(head64.color); col.encoding = THREE.sRGBEncoding;
      const nrm = tl.load(head64.normal);
      head = gltf.scene.getObjectByProperty("type", "Mesh");
      const skin = { roughness: 0.52, metalness: 0, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffd7c2"), envMapIntensity: 0.35 };
      head.material = new THREE.MeshPhysicalMaterial({ map: col, normalMap: nrm, normalScale: new THREE.Vector2(0.8, 0.8), ...skin });
      // Blend the uploaded photo onto the front of the face: planar projection from the front,
      // faded out towards the sides, hairline and jaw so it sits on the skin like a texture.
      head.material.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, photoU);
        sh.vertexShader = sh.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjN;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;\nvObjN = normal;");
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", "#include <common>\nuniform sampler2D uPhoto;\nuniform float uPhotoOn;\nuniform vec4 uXf;\nuniform float uUnit;\nvarying vec3 vObjPos;\nvarying vec3 vObjN;")
          .replace("#include <map_fragment>", `#include <map_fragment>
            if (uPhotoOn > 0.5) {
              vec3 p = vObjPos / uUnit;
              vec2 puv = vec2((p.x - uXf.x) / uXf.z + 0.5, (p.y - uXf.y) / uXf.w + 0.5);
              float inside = step(0.0, puv.x) * step(puv.x, 1.0) * step(0.0, puv.y) * step(puv.y, 1.0);
              float facing = smoothstep(0.2, 0.65, normalize(vObjN).z);
              float face = 1.0 - smoothstep(0.72, 1.0, length(vec2(p.x / 0.165, (p.y - 0.17) / 0.24)));
              vec3 photoLin = pow(texture2D(uPhoto, puv).rgb, vec3(2.2));
              diffuseColor.rgb = mix(diffuseColor.rgb, photoLin, inside * facing * face);
            }`);
      };
      head.geometry.computeBoundingBox();
      const box = head.geometry.boundingBox, size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
      head.geometry.translate(-center.x, -center.y, -center.z);
      head.geometry.computeBoundingBox();
      photoU.uUnit.value = size.y;
      head.scale.setScalar(1 / size.y); head.position.set(0, 0, 0); head.rotation.set(0, 0, 0);
      scene.add(head); head.updateMatrixWorld(true);

      // Raised forearm in front of the chest, inner side facing the viewer, with a simple hand.
      const prof = [];
      const L = 0.34;
      prof.push(new THREE.Vector2(0.0001, -0.012));
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const r = 0.05 + 0.008 * Math.sin(Math.min(1, t / 0.45) * Math.PI) - 0.016 * Math.max(0, (t - 0.35) / 0.65);
        prof.push(new THREE.Vector2(r, t * L));
      }
      prof.push(new THREE.Vector2(0.0001, L + 0.01));
      const fore = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), new THREE.MeshPhysicalMaterial({ color: "#d7a68d", ...skin }));
      fore.scale.set(1, 1, 0.78);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), fore.material);
      hand.scale.set(0.042, 0.075, 0.028); hand.position.set(0, L + 0.06, 0.004);
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 16), fore.material);
      elbow.scale.set(1, 1, 0.78);
      arm = new THREE.Group();
      arm.add(fore, hand, elbow);
      arm.position.set(0.22, -0.46, 0.26);
      arm.rotation.set(-0.1, 0.25, 0.95);
      arm.visible = false;
      scene.add(arm);
      arm.updateMatrixWorld(true);

      const cast = (o, d) => new THREE.Raycaster(o, d.normalize()).intersectObject(head, false)[0];
      const browY = 0.255;
      const front = cast(new THREE.Vector3(0, browY, 3), new THREE.Vector3(0, 0, -1));
      const back = cast(new THREE.Vector3(0, browY, -3), new THREE.Vector3(0, 0, 1));
      const zT = front && back ? front.point.z - (front.point.z - back.point.z) * 0.17 : 0.1;
      spots.temple = findSpot(head, new THREE.Vector3(-3, browY - 0.02, zT), new THREE.Vector3(1, 0, 0), -0.25, 0.13);
      // The bare patch sits a little further back, in the hollow between the eye and the ear.
      const zP = front && back ? front.point.z - (front.point.z - back.point.z) * 0.25 : 0.05;
      spots.patch = findSpot(head, new THREE.Vector3(-3, browY - 0.005, zP), new THREE.Vector3(1, 0, 0), -0.12, 0.1);
      spots.neck = findSpot(head, new THREE.Vector3(0, 0.02, -3), new THREE.Vector3(0, 0, 1), 0, 0.13);
      const mid = new THREE.Vector3(0, L * 0.55, 0).applyMatrix4(fore.matrixWorld);
      spots.forearm = findSpot(fore, mid.clone().add(new THREE.Vector3(0, 0, 2)), new THREE.Vector3(0, 0, -1), 0.95 - Math.PI / 2, 0.1);
      setStatus("ready");
      apply();
      setPhoto(api.current.photo);
    }, () => { if (!disposed) setStatus("error"); });

    const toCam = new THREE.Vector3();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const overshoot = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
    const frameLoop = (now) => {
      raf = requestAnimationFrame(frameLoop);
      if (tween) {
        const t = ease(Math.min(1, (now - tween.t0) / 900));
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, t);
        camera.position.lerpVectors(tween.fromPos, tween.toPos, t);
        if (t >= 1) tween = null;
      }
      controls.autoRotate = !!(api.current.props && api.current.props.autoTurn) && !tween && now > pausedUntil;
      controls.update();
      rig.quaternion.copy(camera.quaternion);
      if (decal && current) {
        const spot = spots[current];
        toCam.copy(camera.position).sub(spot.point).normalize();
        const facing = spot.normal.dot(toCam);
        const t = Math.min(1, (now - morphStart) / 600);
        decal.scale.setScalar(0.35 + 0.65 * overshoot(t));
        material.opacity = Math.min(1, t * 2.2);
        const heroMode = isHero();
        material.emissiveIntensity = heroMode ? 0.35 + Math.max(0, facing) * 0.25 : 0.3 + Math.max(0, facing) * 0.3 + (1 - t) * 1.2;
        glow.intensity = Math.max(0, facing) * (heroMode ? 0.03 : 0.05 + (1 - t) * 0.35);
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frameLoop);

    return () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); });
      Object.values(spots).forEach((s) => s && s.geo.dispose());
      if (photoU.uPhoto.value) photoU.uPhoto.value.dispose();
      pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    api.current.props = { shape, color, coating, node, autoTurn, frame, hero };
    if (api.current.apply) api.current.apply();
  }, [shape, color, coating, node, autoTurn, frame, hero]);

  useEffect(() => {
    api.current.photo = photo;
    if (api.current.setPhoto) api.current.setPhoto(photo);
  }, [photo]);

  return (
    <div ref={mount} className="absolute inset-0 cursor-grab active:cursor-grabbing [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full">
      {status === "loading" && <div className="absolute inset-0 grid place-items-center"><span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-brass" /></div>}
      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center text-center p-6">
          <div>
            <Shell shape={shape} color={color} coating={coating} size={140} className="mx-auto" />
            <p className="mt-4 text-[13px] text-mute">The 3D preview needs WebGL. Your shell is shown flat instead.</p>
          </div>
        </div>
      )}
    </div>
  );
}


/* ───────────── Header ───────────── */
function statusOf(order) {
  if (!order) return "NO_ORDER";
  if (order.paired) return "PAIRED";
  return order.stage >= STAGES.length - 1 ? "DELIVERED" : "IN_TRANSIT";
}
function Header({ view, setView, order, overlay }) {
  const status = statusOf(order);
  const node = order ? NODES[order.design.node] : null;
  const VIEWS = [["studio", "Shape Studio"], ["checkout", "Checkout"], ["manual", "Web Manual"]];
  let pill = null;
  if (status === "PAIRED") pill = <span className="flex items-center gap-2 rounded-full border border-ok/30 bg-ok/10 px-3 py-1.5 text-ok"><span className="pulse h-2 w-2 rounded-full bg-ok inline-block"></span>Patch connected · {node.name}</span>;
  else if (status === "DELIVERED") pill = <span className="flex items-center gap-2 rounded-full border border-warn/30 bg-warn/10 px-3 py-1.5 text-warn"><Icon name="PackageOpen" size={14} />Delivered · ready to set up</span>;
  else if (status === "IN_TRANSIT") pill = <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-mute"><Icon name="Truck" size={14} />Arrives {shortDate(deliveryWindow(order.delivery, new Date(order.placedAt))[1])}</span>;
  return (
    <header className={`${overlay ? "absolute inset-x-0 top-0 bg-gradient-to-b from-slate0/80 to-transparent" : "sticky border-b border-line bg-slate0/90 backdrop-blur"} z-40`} style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
        <button className="flex items-center gap-3 min-w-0" onClick={() => setView("home")} aria-label="Neural Stream DS-28 home">
          <div className="h-8 w-8 rounded-full border border-brass/50 grid place-items-center text-brass shrink-0"><Icon name="Waves" size={16} /></div>
          <span className="text-[15px] font-medium text-ink truncate">Neural Stream™ <span className="text-brass">DS-28</span></span>
        </button>
        <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Main">
          {VIEWS.map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} aria-current={view === id ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[14px] transition-colors ${view === id ? "bg-card text-ink" : "text-ink/70 hover:text-ink"}`}>{label}</button>
          ))}
        </nav>
        {pill && <div className="text-[12px]">{pill}</div>}
      </div>
    </header>
  );
}

/* ───────────── Home: full-screen hero ───────────── */
function Home({ design, order, onStart, onManual }) {
  const [leaving, setLeaving] = useState(false);
  const finish = findFinish(design.finish);
  const start = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onStart, 450);
  };
  return (
    <section className={`relative h-[100dvh] min-h-[560px] overflow-hidden transition-opacity duration-500 ${leaving ? "opacity-0" : ""}`}>
      <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_60%_45%,rgba(226,177,104,0.12),transparent_70%)]" />
      <div className={`absolute inset-0 transition-transform duration-500 ${leaving ? "scale-110" : ""}`}>
        <HeadStage shape={design.shape} color={finish.hex} coating={design.coating} node="temple" frame="hero" autoTurn={true} hero />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate0 via-slate0/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 sm:pb-14">
          <Label>Neural Stream™ DS-28</Label>
          <h1 className="mt-3 text-[40px] sm:text-[64px] font-medium tracking-tight leading-[1.02] max-w-[14ch]">Wear your motor intent.</h1>
          <p className="mt-4 text-[16px] sm:text-[17px] text-ink/75 max-w-[48ch] leading-relaxed">A skin patch that lets you borrow an expert's hand skills by the hour. You design the shell it wears.</p>
          <div className="pointer-events-auto mt-7 flex flex-wrap items-center gap-3">
            <button onClick={start} className="btn-primary !px-7 !py-4 !text-[16px] shadow-[0_0_40px_rgba(226,177,104,.35)]">Get yours now<Icon name="ArrowRight" size={18} /></button>
            {order && <button onClick={onManual} className="btn-ghost !py-3.5">Track my order</button>}
            <span className="text-[13px] text-mute">From {inr(PRICING.kit + PRICING.shell)} · free delivery in India</span>
          </div>
          <p className="mt-6 flex items-center gap-1.5 text-[12px] text-mute"><Icon name="Rotate3d" size={14} />Drag the head to turn it</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Shape Studio ───────────── */
const PROMPTS = ["A glossy crimson heart", "Matte gold tear drop", "Cyber cyan lightning bolt", "Satin slate hexagon"];

function SketchPad({ onShape }) {
  const [strokes, setStrokes] = useState([]);
  const [live, setLive] = useState(null);
  const pad = useRef(null);
  const pt = (e) => { const r = pad.current.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100]; };
  const commit = (next) => { setStrokes(next); const d = strokesToPath(next); if (d) onShape({ id: "custom", name: "Your drawing", code: "CST", mode: "stroke", width: 9, d }); };
  const raw = (p) => p.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ") + (p.length === 1 ? " l0.1 0" : "");
  return (
    <div>
      <svg ref={pad} viewBox="0 0 100 100" className="block w-full max-w-[260px] mx-auto aspect-square rounded-xl border border-line bg-slate0 touch-none cursor-crosshair"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setLive([pt(e)]); }}
        onPointerMove={(e) => { if (!live) return; const p = pt(e), l = live[live.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 1.2) setLive([...live, p]); }}
        onPointerUp={() => { if (live) commit([...strokes, live]); setLive(null); }}
        onPointerCancel={() => setLive(null)} role="img" aria-label="Drawing area for your own shape">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#243044" strokeDasharray="1.5 2" strokeWidth=".4" />
        {[...strokes, ...(live ? [live] : [])].map((s, i) => <path key={i} d={raw(s)} fill="none" stroke="#E2B168" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
        {!strokes.length && !live && <text x="50" y="51.5" textAnchor="middle" fontSize="4.4" fill="#94A3B8">Draw inside the circle</text>}
      </svg>
      <div className="mt-3 flex justify-center gap-2">
        <button className="btn-ghost" onClick={() => commit(strokes.slice(0, -1))} disabled={!strokes.length}><Icon name="Undo2" size={14} />Undo</button>
        <button className="btn-ghost" onClick={() => setStrokes([])} disabled={!strokes.length}><Icon name="Trash2" size={14} />Clear</button>
      </div>
    </div>
  );
}

/** Upload a portrait; it's projected onto the face of the 3D head. Stays on this device. */
function PhotoPanel({ photo, setPhoto }) {
  const input = useRef(null);
  const [error, setError] = useState("");
  const load = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("That file isn't a photo. Choose a JPG or PNG."); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Downscale large photos so the preview stays quick.
        const max = 1024, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const aspect = c.height / c.width;
        const size = 0.62;
        // Assume eyes about 40% down a typical portrait; line them up with the model's eyes.
        setPhoto({ url: c.toDataURL("image/jpeg", 0.9), aspect, size, x: 0, y: 0.25 - 0.1 * size * aspect, preview: c.toDataURL("image/jpeg", 0.7) });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const nudge = (k, v) => setPhoto((p) => ({ ...p, [k]: v }));
  return (
    <div className="rounded-xl border border-brass/40 bg-brass/5 p-4">
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { load(e.target.files[0]); e.target.value = ""; }} />
      {!photo ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-medium">See it on your own face</div>
            <div className="text-[13px] text-mute">A front-facing photo works best. It stays on this device.</div>
          </div>
          <button className="btn-primary" onClick={() => input.current.click()}><Icon name="Camera" size={16} />Upload your photo</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <img src={photo.preview} alt="Your uploaded photo" className="h-14 w-14 rounded-lg object-cover border border-line" />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium">Your photo is on the model</div>
              <div className="text-[13px] text-mute">Line up your eyes and nose with the model's.</div>
            </div>
            <button className="btn-ghost" onClick={() => setPhoto(null)} aria-label="Remove photo"><Icon name="Trash2" size={14} />Remove</button>
          </div>
          <div className="mt-4 grid gap-3 text-[13px]">
            {[["x", "Left / right", -0.15, 0.15], ["y", "Up / down", -0.15, 0.45], ["size", "Size", 0.35, 1.1]].map(([k, label, min, max]) => (
              <label key={k} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
                <span className="text-mute">{label}</span>
                <input type="range" min={min} max={max} step="0.005" value={photo[k]} onChange={(e) => nudge(k, +e.target.value)}
                  style={{ "--pct": `${((photo[k] - min) / (max - min)) * 100}%` }} aria-label={label} />
              </label>
            ))}
          </div>
          <button className="mt-3 text-[13px] text-brass underline underline-offset-2" onClick={() => input.current.click()}>Use a different photo</button>
        </div>
      )}
      {error && <p className="mt-2 text-[12px] text-crit">{error}</p>}
    </div>
  );
}

function Studio({ design, setDesign, onBuy, photo, setPhoto }) {
  const [mode, setMode] = useState("prompt");
  const [text, setText] = useState(design.prompt || PROMPTS[0]);
  const [heard, setHeard] = useState(null);
  const [autoTurn, setAutoTurn] = useState(true);
  const finish = findFinish(design.finish);
  const set = (patch) => setDesign((d) => ({ ...d, ...patch }));
  // With a photo on, look at the face (three-quarter, so the temple shell shows too).
  const frame = photo && design.node === "temple" ? "face" : design.node;
  useEffect(() => { if (photo) setAutoTurn(false); }, [!!photo]);

  const create = (value = text) => {
    const r = parsePrompt(value);
    set({ prompt: value, ...(r.shapeId && { shape: findShape(r.shapeId) }), ...(r.finishId && { finish: r.finishId }), ...(r.coating && { coating: r.coating }) });
    setHeard(r);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 fade-in">
      <div className="mb-5">
        <Label>Shape Studio</Label>
        <h1 className="mt-2 text-[28px] sm:text-[36px] font-medium tracking-tight leading-tight">Design your shell</h1>
        <p className="mt-2 text-[15px] text-ink/70 max-w-[60ch] leading-relaxed">The shell is the cover that clips over your patch. Every change shows on the model straight away.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 overflow-hidden">
          <div className="relative h-[440px] sm:h-[560px] bg-[radial-gradient(50%_45%_at_50%_42%,rgba(226,177,104,0.10),transparent_70%)]">
            <HeadStage shape={design.shape} color={finish.hex} coating={design.coating} node={design.node} autoTurn={autoTurn} photo={photo} frame={frame} />
            <div className="absolute inset-x-0 bottom-0 p-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <span className="rounded-full bg-slate0/80 border border-line px-3 py-1.5 text-[12px] text-ink/80 flex items-center gap-1.5"><Icon name="Rotate3d" size={14} />Drag to turn · scroll or pinch to zoom</span>
              <button onClick={() => setAutoTurn((a) => !a)} className="pointer-events-auto rounded-full bg-slate0/80 border border-line px-3 py-1.5 text-[12px] text-ink flex items-center gap-1.5 hover:border-brass/60">
                <Icon name={autoTurn ? "Pause" : "Play"} size={14} />{autoTurn ? "Stop turning" : "Turn slowly"}
              </button>
            </div>
          </div>
          <div className="border-t border-line p-4">
            <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Where you'll wear it">
              <span className="text-[13px] text-mute mr-1">Wear it on</span>
              {Object.entries(NODES).map(([k, n]) => (
                <button key={k} role="radio" aria-checked={design.node === k} onClick={() => set({ node: k })}
                  className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${design.node === k ? "border-brass/60 bg-slate0 text-ink" : "border-line text-ink/70 hover:text-ink"}`}>{n.name}</button>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink/70">{NODES[design.node].bestFor}</p>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-5 sm:p-6 flex flex-col gap-5">
          <PhotoPanel photo={photo} setPhoto={setPhoto} />
          <div>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-slate0 p-1" role="tablist" aria-label="How to make your shape">
              {[["prompt", "Describe", "Wand2"], ["shapes", "Shapes", "Hexagon"], ["draw", "Draw", "PenLine"]].map(([id, label, icon]) => (
                <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] transition-colors ${mode === id ? "bg-card text-ink" : "text-mute hover:text-ink"}`}><Icon name={icon} size={14} />{label}</button>
              ))}
            </div>
            <div className="mt-4">
              {mode === "prompt" && (
                <div className="fade-in">
                  <label htmlFor="prompt" className="text-[13px] text-mute">Describe the shape, colour and finish</label>
                  <div className="mt-2 flex gap-2">
                    <input id="prompt" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()}
                      className="field flex-1 min-w-0" placeholder="A glossy crimson heart" />
                    <button className="btn-primary px-4" onClick={() => create()}><Icon name="Sparkles" size={16} />Create</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PROMPTS.map((p) => <button key={p} className="chip" onClick={() => { setText(p); create(p); }}>{p}</button>)}
                  </div>
                  {heard && (
                    <p className="mt-3 text-[13px] text-mute">
                      {heard.shapeId || heard.finishId || heard.coating
                        ? <>Changed: {[heard.shapeId && findShape(heard.shapeId).name, heard.finishId && findFinish(heard.finishId).name, heard.coating && COATINGS.find((c) => c.id === heard.coating).name].filter(Boolean).join(" · ")}. Anything you didn't mention stays the same.</>
                        : "We didn't spot a shape, colour or finish. Try words like heart, tear drop, gold or matte."}
                    </p>
                  )}
                </div>
              )}
              {mode === "shapes" && (
                <div className="grid grid-cols-4 gap-2 fade-in">
                  {SHAPES.map((s) => (
                    <button key={s.id} onClick={() => set({ shape: s })} aria-pressed={design.shape.id === s.id}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[12px] transition-colors ${design.shape.id === s.id ? "border-brass/60 bg-slate0 text-ink" : "border-line text-mute hover:text-ink"}`}>
                      <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><path d={s.d} fill={s.mode === "fill" ? "currentColor" : "none"} stroke={s.mode === "stroke" ? "currentColor" : "none"} strokeWidth={s.width} /></svg>
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              {mode === "draw" && <div className="fade-in"><SketchPad onShape={(shape) => set({ shape })} /></div>}
            </div>
          </div>

          <div>
            <div className="text-[13px] text-mute">Colour</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FINISHES.map((f) => (
                <button key={f.id} onClick={() => set({ finish: f.id })} aria-pressed={design.finish === f.id}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left text-[13px] transition-colors ${design.finish === f.id ? "border-brass/60 bg-slate0" : "border-line hover:bg-slate0/60"}`}>
                  <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/15" style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), transparent 45%), ${f.hex}` }} />{f.name}
                </button>
              ))}
            </div>
            <div className="mt-4 text-[13px] text-mute">Finish</div>
            <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-line bg-slate0 p-1">
              {COATINGS.map((c) => (
                <button key={c.id} onClick={() => set({ coating: c.id })} aria-pressed={design.coating === c.id}
                  className={`rounded-lg py-2 text-[13px] transition-colors ${design.coating === c.id ? "bg-brass text-slate0 font-medium" : "text-mute hover:text-ink"}`}>{c.name}</button>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-line bg-slate0 p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] text-mute">{design.shape.name} · {finish.name}</div>
              <div className="text-[22px] font-medium tnum">{inr(PRICING.kit + PRICING.shell)}</div>
              <div className="text-[12px] text-mute">Patch and shell · tax included</div>
            </div>
            <button className="btn-primary" onClick={onBuy}>Buy now<Icon name="ArrowRight" size={16} /></button>
          </div>
        </Card>
      </div>
      <p className="mt-4 text-[12px] text-mute">3D head “Lee Perry-Smith” by Infinite-Realities, licensed CC BY 3.0. The forearm is a simple stand-in model.</p>
    </main>
  );
}

/* ───────────── Checkout ───────────── */
const EMPTY_ADDRESS = { name: "", phone: "", street: "", area: "", city: "", state: "", pin: "" };

function Checkout({ design, order, onPlace, onManual, onNewOrder }) {
  const [a, setA] = useState(EMPTY_ADDRESS);
  const [touched, setTouched] = useState({});
  const [tried, setTried] = useState(false);
  const [speed, setSpeed] = useState("standard");
  const [pay, setPay] = useState("upi");
  const finish = findFinish(design.finish);
  const errors = validateAddress(a);
  const show = (k) => (tried || touched[k]) && errors[k];
  const del = DELIVERY.find((d) => d.id === speed);
  const total = PRICING.kit + PRICING.shell + del.fee;

  if (order) {
    const [, by] = deliveryWindow(order.delivery, new Date(order.placedAt));
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 fade-in">
        <Card className="p-6 sm:p-7">
          <Label>Order {order.number}</Label>
          <h1 className="mt-2 text-2xl font-medium tracking-tight">Your patch is on its way</h1>
          <p className="mt-2 text-[15px] text-ink/70">Arriving by {shortDate(by)} at {order.address.city}, {order.address.pin}. Follow it in the Web Manual.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={onManual}>Track my order<Icon name="ArrowRight" size={16} /></button>
            <button className="btn-ghost" onClick={onNewOrder}>Start a new order</button>
          </div>
        </Card>
      </main>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    const first = Object.keys(errors)[0];
    if (first) { document.getElementById(`f-${first}`)?.focus(); return; }
    onPlace({ address: a, delivery: speed, pay, total });
  };
  const F = ({ id, label, span, hint, ...rest }) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <label htmlFor={`f-${id}`} className="block text-[13px] text-ink mb-1.5">{label}</label>
      <input id={`f-${id}`} value={a[id]} onChange={(e) => setA((x) => ({ ...x, [id]: e.target.value }))} onBlur={() => setTouched((t) => ({ ...t, [id]: true }))}
        aria-invalid={!!show(id)} className={`field w-full ${show(id) ? "border-crit" : ""}`} {...rest} />
      {show(id) ? <p className="mt-1.5 text-[12px] text-crit">{errors[id]}</p> : hint && <p className="mt-1.5 text-[12px] text-mute">{hint}</p>}
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 fade-in">
      <div className="mb-5">
        <Label>Checkout</Label>
        <h1 className="mt-2 text-[28px] font-medium tracking-tight">Where should we deliver it?</h1>
      </div>
      <form onSubmit={submit} noValidate className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 grid gap-4">
          <Card className="p-5 sm:p-7">
            <h2 className="text-xl font-medium tracking-tight">Delivery address</h2>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              {F({ id: "name", label: "Full name", span: true, autoComplete: "name" })}
              {F({ id: "phone", label: "Mobile number", autoComplete: "tel-national", inputMode: "numeric", placeholder: "98765 43210", hint: "The courier calls this number on delivery day." })}
              {F({ id: "pin", label: "PIN code", autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 })}
              {F({ id: "street", label: "Street address", span: true, autoComplete: "address-line1", placeholder: "House or flat number, building, street" })}
              {F({ id: "area", label: "Area or landmark (optional)", span: true, autoComplete: "address-line2" })}
              {F({ id: "city", label: "City", autoComplete: "address-level2" })}
              <div>
                <label htmlFor="f-state" className="block text-[13px] text-ink mb-1.5">State</label>
                <div className="relative">
                  <select id="f-state" value={a.state} onChange={(e) => setA((x) => ({ ...x, state: e.target.value }))} onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                    aria-invalid={!!show("state")} className={`field w-full appearance-none pr-10 ${show("state") ? "border-crit" : ""} ${a.state ? "" : "text-mute"}`}>
                    <option value="">Choose…</option>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
                </div>
                {show("state") && <p className="mt-1.5 text-[12px] text-crit">{errors.state}</p>}
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-7">
            <h2 className="text-xl font-medium tracking-tight">Shipping speed</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Shipping speed">
              {DELIVERY.map((d) => {
                const [f, t] = deliveryWindow(d.id, new Date());
                const on = speed === d.id;
                return (
                  <button type="button" key={d.id} role="radio" aria-checked={on} onClick={() => setSpeed(d.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${on ? "border-brass/60 bg-slate0" : "border-line hover:bg-slate0/60"}`}>
                    <div className="flex justify-between"><span className="font-medium">{d.name}</span><span className="tnum">{d.fee ? inr(d.fee) : "Free"}</span></div>
                    <div className="mt-1 text-[13px] text-mute">Arrives {d.days[0] === d.days[1] ? shortDate(f) : `${shortDate(f)} – ${shortDate(t)}`} · {d.note}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2 p-5 sm:p-7 lg:sticky lg:top-20">
          <h2 className="text-xl font-medium tracking-tight">Order summary</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl border border-line bg-slate0 grid place-items-center shrink-0"><Shell shape={design.shape} color={finish.hex} coating={design.coating} size={40} /></div>
            <div className="text-[14px]"><div>{design.shape.name} shell</div><div className="text-mute text-[13px]">{finish.name} · {COATINGS.find((c) => c.id === design.coating).name} · {NODES[design.node].name}</div></div>
          </div>
          <dl className="mt-5 grid gap-2.5 text-[14px]">
            <div className="flex justify-between"><dt className="text-ink/80">DS-28 starter kit</dt><dd className="tnum">{inr(PRICING.kit)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/80">Printed shell</dt><dd className="tnum">{inr(PRICING.shell)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/80">{del.name} shipping</dt><dd className="tnum">{del.fee ? inr(del.fee) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-[18px] font-medium"><dt>Total</dt><dd className="tnum">{inr(total)}</dd></div>
          </dl>
          <p className="mt-1 text-[12px] text-mute">GST included. Skill streams are paid separately after your patch arrives.</p>
          <div className="mt-5 text-[13px] text-mute">Pay with</div>
          <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
            {[["upi", "UPI", "QrCode"], ["card", "Card", "CreditCard"], ["cod", "On delivery", "Banknote"]].map(([id, label, icon]) => (
              <button type="button" key={id} role="radio" aria-checked={pay === id} onClick={() => setPay(id)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-[12px] transition-colors ${pay === id ? "border-brass/60 bg-slate0 text-ink" : "border-line text-mute hover:text-ink"}`}><Icon name={icon} size={18} />{label}</button>
            ))}
          </div>
          <button type="submit" className="btn-primary w-full mt-5 py-3 text-[15px]">Place order · {inr(total)}</button>
          <p className="mt-2 text-[12px] text-mute">Prototype: no payment is taken and no payment details are asked for.</p>
        </Card>
      </form>
    </main>
  );
}

/* ───────────── Web Manual: tabs ───────────── */
const TABS = [
  { id: "order",    code: "00", label: "Order Tracking",           icon: "Package",     needs: null },
  { id: "onboard",  code: "01", label: "Onboarding & Calibration", icon: "Crosshair",   needs: "DELIVERED" },
  { id: "rental",   code: "02", label: "Skill Rental",             icon: "Gauge",       needs: "DELIVERED" },
  { id: "map",      code: "03", label: "Where to Wear It",         icon: "ScanLine",    needs: null },
  { id: "safety",   code: "04", label: "Safety & Compliance",      icon: "ShieldAlert", needs: null },
  { id: "hardware", code: "05", label: "Hardware",                 icon: "Cpu",         needs: "DELIVERED" },
];

function Tabs({ tab, setTab, status }) {
  return (
    <nav className="mx-auto max-w-6xl px-4 sm:px-6 pt-4" aria-label="Manual sections">
      <div role="tablist" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {TABS.map((t) => {
          const on = t.id === tab, locked = t.needs && !["DELIVERED", "PAIRED"].includes(status);
          return (
            <button key={t.id} role="tab" aria-selected={on} onClick={() => setTab(t.id)}
              className={`group text-left rounded-xl border px-4 py-3 transition-colors ${on ? "border-brass/60 bg-card" : "border-line bg-transparent hover:bg-card/60"} ${locked && !on ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <span className={`label ${on ? "!text-brass" : ""}`}>{t.code}</span>
                <Icon name={locked ? "Lock" : t.icon} size={16} className={on ? "text-brass" : "text-mute group-hover:text-ink"} />
              </div>
              <div className={`mt-1 text-[14px] sm:text-[15px] font-medium leading-snug ${on ? "text-ink" : "text-ink/70"}`}>{t.label}</div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Prototype controls: kept visibly separate so testers can jump states without confusing buyers. */
function DevBar({ order, setOrder, onDemo }) {
  const status = statusOf(order);
  const paired = status === "PAIRED";
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-warn/40 bg-warn/5 px-4 py-3 text-[13px]">
        <span className="flex items-center gap-1.5 text-warn"><Icon name="Wrench" size={14} />Prototype controls</span>
        {order ? (
          <>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button role="switch" aria-checked={paired} id="dev-paired"
                onClick={() => setOrder((o) => paired ? { ...o, stage: 3, paired: false, calibrated: false, baseline: null, session: null } : { ...o, stage: STAGES.length - 1, paired: true })}
                className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${paired ? "bg-ok/80 border-ok" : "bg-slate0 border-line"}`}>
                <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-ink transition-all ${paired ? "left-[22px]" : "left-0.5"}`}></span>
              </button>
              <span>Simulate: product unboxed &amp; paired</span>
            </label>
            {!paired && order.stage < STAGES.length - 1 && (
              <>
                <button className="btn-ghost !py-1" onClick={() => setOrder((o) => ({ ...o, stage: o.stage + 1 }))}>Next delivery stage</button>
                <button className="btn-ghost !py-1" id="dev-deliver" onClick={() => setOrder((o) => ({ ...o, stage: STAGES.length - 1 }))}>Mark as delivered</button>
              </>
            )}
          </>
        ) : (
          <><span className="text-mute">No order yet.</span><button className="btn-ghost !py-1" onClick={onDemo}>Create a demo order</button></>
        )}
      </div>
    </div>
  );
}

function LockedPanel({ tab, order, setTab, setOrder }) {
  const status = statusOf(order);
  const what = {
    onboard: "Setup and calibration need the patch in your hands.",
    rental: "Your personalised plan and sessions open with your patch.",
    hardware: "This guide is matched to the patch in your box.",
  }[tab];
  const by = order ? shortDate(deliveryWindow(order.delivery, new Date(order.placedAt))[1]) : null;
  return (
    <div className="fade-in">
      <Card className="p-6 sm:p-8 max-w-2xl">
        <div className="h-11 w-11 rounded-full border border-line grid place-items-center text-mute"><Icon name="Lock" size={18} /></div>
        <h2 className="mt-4 text-2xl font-medium tracking-tight">Unlocks when your patch arrives</h2>
        <p className="mt-2 text-[15px] text-ink/70 leading-relaxed max-w-[56ch]">
          {what}{" "}
          {status === "NO_ORDER" && "Order your DS-28 to get started."}
          {status === "IN_TRANSIT" && `Your patch should arrive by ${by}. This opens as soon as it's delivered.`}
        </p>
        {status === "IN_TRANSIT" && (
          <button className="btn-ghost mt-4 !border-warn/40 text-warn" onClick={() => setOrder((o) => ({ ...o, stage: STAGES.length - 1 }))}>
            <Icon name="Wrench" size={14} />Prototype: mark as delivered
          </button>
        )}
        <p className="mt-4 text-[14px] text-ink/70">While you wait, you can read:</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setTab("order")}><Icon name="Package" size={14} />Order tracking</button>
          <button className="btn-ghost" onClick={() => setTab("map")}><Icon name="ScanLine" size={14} />Where to wear it</button>
          <button className="btn-ghost" onClick={() => setTab("safety")}><Icon name="ShieldAlert" size={14} />Safety guide</button>
        </div>
      </Card>
    </div>
  );
}

/* ───────────── Pairing ───────────── */
function PairForm({ order, setOrder }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const pair = (e) => {
    e.preventDefault();
    if (norm(code) !== norm(order.serial)) { setErr("That ID doesn't match this order. It's printed on the card inside the box lid."); return; }
    setErr(""); setOrder((o) => ({ ...o, paired: true }));
  };
  return (
    <form onSubmit={pair} className="mt-4 grid gap-2" noValidate>
      <label htmlFor="pair" className="text-[13px]">Patch ID</label>
      <input id="pair" value={code} onChange={(e) => setCode(e.target.value)} placeholder="DS28-XXX-000" autoComplete="off" aria-invalid={!!err} className={`field uppercase ${err ? "border-crit" : ""}`} />
      {err && <p className="text-[12px] text-crit">{err}</p>}
      <button className="btn-primary mt-1" type="submit"><Icon name="Link" size={16} />Pair patch</button>
      <p className="text-[12px] text-mute">Prototype hint: your ID is {order.serial}.</p>
    </form>
  );
}

/* ───────────── Tab 00 ───────────── */
function OrderTracking({ order, setOrder, onStudio, setTab }) {
  if (!order) {
    return (
      <Card className="p-6 sm:p-8 max-w-2xl fade-in">
        <Label>Order tracking</Label>
        <h2 className="mt-2 text-2xl font-medium tracking-tight">No order yet</h2>
        <p className="mt-2 text-[15px] text-ink/70">Design your shell in the Shape Studio, then check out. Your delivery will appear here.</p>
        <button className="btn-primary mt-5" onClick={onStudio}>Open Shape Studio<Icon name="ArrowRight" size={16} /></button>
      </Card>
    );
  }
  const status = statusOf(order);
  const delivered = order.stage >= STAGES.length - 1;
  const [from, to] = deliveryWindow(order.delivery, new Date(order.placedAt));
  const del = DELIVERY.find((d) => d.id === order.delivery);
  const finish = findFinish(order.design.finish);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 fade-in">
      <Card className="lg:col-span-3 p-5 sm:p-7">
        <Label>Order {order.number}</Label>
        <h2 className="mt-2 text-2xl sm:text-[28px] font-medium tracking-tight">
          {delivered ? "Your patch has arrived" : `Arriving ${del.days[0] === del.days[1] ? shortDate(from) : shortDate(to)}`}
        </h2>
        <ol className="mt-6">
          {STAGES.map((s, i) => {
            const done = i < order.stage || (delivered && i === order.stage), now = i === order.stage && !delivered;
            return (
              <li key={s.id} className="grid grid-cols-[2.25rem_1fr] gap-3">
                <span className="flex flex-col items-center">
                  <span className={`h-6 w-6 rounded-full border grid place-items-center ${done ? "border-ok bg-ok/15 text-ok" : now ? "border-brass text-brass" : "border-line text-mute"}`}>
                    {done ? <Icon name="Check" size={13} /> : <span className={`h-1.5 w-1.5 rounded-full ${now ? "bg-brass" : "bg-line"}`} />}
                  </span>
                  {i < STAGES.length - 1 && <span className={`w-px flex-1 min-h-[22px] ${i < order.stage ? "bg-ok/40" : "bg-line"}`} />}
                </span>
                <div className="pb-4">
                  <div className={`font-medium text-[15px] ${done || now ? "text-ink" : "text-mute"}`}>{s.label}</div>
                  <div className="text-[13px] text-mute">{s.detail}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
      <div className="lg:col-span-2 grid gap-4 content-start">
        {status === "DELIVERED" && (
          <Card className="p-5 sm:p-7 border-brass/50">
            <Label>Unbox & pair</Label>
            <h2 className="mt-2 text-xl font-medium tracking-tight">Connect your patch</h2>
            <p className="mt-2 text-[14px] text-ink/70">Your plan and setup guide are open now. Pair the patch to calibrate it and start sessions.</p>
            <p className="mt-2 text-[14px] text-ink/70">Lift out the card inside the box lid and type the patch ID printed on it.</p>
            <PairForm order={order} setOrder={setOrder} />
          </Card>
        )}
        {status === "PAIRED" && (
          <Card className="p-5 sm:p-7 border-ok/40">
            <div className="flex items-center gap-2 text-ok"><Icon name="CheckCircle2" size={18} /><span className="font-medium">Patch paired</span></div>
            <p className="mt-2 text-[14px] text-ink/70">Next, prepare your skin and calibrate. It takes about four minutes.</p>
            <button className="btn-primary mt-4" onClick={() => setTab("onboard")}>Start setup<Icon name="ArrowRight" size={16} /></button>
          </Card>
        )}
        <Card className="p-5 sm:p-7">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl border border-line bg-slate0 grid place-items-center shrink-0"><Shell shape={order.design.shape} color={finish.hex} coating={order.design.coating} size={40} /></div>
            <div className="text-[14px] min-w-0">
              <div>{order.design.shape.name} shell · {finish.name}</div>
              <div className="text-[13px] text-mute">Patch ID <span className="text-brass tnum">{order.serial}</span></div>
            </div>
          </div>
          <address className="mt-4 not-italic text-[14px] text-ink/80 leading-relaxed">
            {order.address.name}<br />{order.address.street}{order.address.area && `, ${order.address.area}`}<br />{order.address.city}, {order.address.state} {order.address.pin}
          </address>
          <div className="mt-3 text-[13px] text-mute">{order.pay === "cod" ? "To pay on delivery" : "Paid"} {inr(order.total)} · {del.name} shipping</div>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Tab 01 ───────────── */
const PREP = [
  { t: "Find the spot", d: "For the temple: two fingers above and slightly in front of the top of your ear. You'll feel a shallow dip. “Where to wear it” shows all three spots." },
  { t: "Clear the skin", d: "Trim hair short over a small square. Don't shave with a blade in the 12 hours before a session; tiny cuts make the patch sting." },
  { t: "Clean it", d: "Wipe once with the alcohol swab from the box and let it dry for about 45 seconds. No moisturiser, sunscreen or makeup on the spot." },
  { t: "Peel the gel pad", d: "The gel should look clear and a little sticky. If it's cloudy or peeling away, use a fresh pad." },
  { t: "Press the patch on", d: "Point the brass notch at the outer corner of your eye. Press the centre for 10 seconds, then smooth out to the edges." },
];
const PHASES = [
  { at: 0, msg: "Checking skin contact" },
  { at: 0.34, msg: "Listening to your muscles" },
  { at: 0.7, msg: "Measuring your baseline" },
  { at: 1, msg: "Done. Your baseline is saved." },
];

function Calibration({ order, setOrder, setTab }) {
  const done = !!order.calibrated;
  const [p, setP] = useState(done ? 1 : 0);
  const [holding, setHolding] = useState(false);
  const [aborted, setAborted] = useState(false);
  const raf = useRef(0), start = useRef(0), pv = useRef(p);
  const DURATION = 3000;
  const node = NODES[order.design.node];

  const tick = useCallback((now) => {
    const v = Math.min(1, (now - start.current) / DURATION);
    pv.current = v; setP(v);
    if (v < 1) raf.current = requestAnimationFrame(tick);
    else {
      setHolding(false);
      setOrder((o) => ({ ...o, calibrated: true, baseline: measureBaseline(o.serial, o.design.node) }));
    }
  }, [setOrder]);
  const begin = () => { if (done || holding) return; setAborted(false); setHolding(true); start.current = performance.now(); raf.current = requestAnimationFrame(tick); };
  const end = () => { if (!holding) return; cancelAnimationFrame(raf.current); setHolding(false); if (pv.current < 1) { setAborted(true); pv.current = 0; setP(0); } };
  const reset = () => { pv.current = 0; setP(0); setOrder((o) => ({ ...o, calibrated: false })); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const R = 88, C = 2 * Math.PI * R;
  const phase = PHASES.reduce((a, ph) => (p >= ph.at ? ph : a), PHASES[0]);
  const b = order.baseline;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 fade-in">
      <Card className="lg:col-span-3 p-5 sm:p-7">
        <Label>About 4 minutes · once a day</Label>
        <h2 className="mt-2 text-2xl sm:text-[28px] font-medium tracking-tight">Skin preparation</h2>
        <p className="mt-2 text-ink/70 max-w-[60ch] leading-relaxed">Do every step before your first stream of the day. Good contact is what makes streams feel smooth.</p>
        <ol className="mt-6 grid gap-0">
          {PREP.map((s, i) => (
            <li key={s.t} className="grid grid-cols-[2.25rem_1fr] gap-3 py-4 border-t border-line first:border-t-0">
              <span className="text-[13px] text-brass tnum pt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <h3 className="font-medium text-[16px]">{s.t}</h3>
                <p className="mt-1 text-[14px] text-ink/70 leading-relaxed max-w-[62ch]">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="lg:col-span-2 p-5 sm:p-7 flex flex-col">
        {!order.paired ? (
          <>
            <Label>Step 1 · Pair</Label>
            <h2 className="mt-2 text-xl font-medium tracking-tight">Connect your patch</h2>
            <p className="mt-1 text-[14px] text-ink/70 leading-relaxed">Type the patch ID from the card inside the box lid. Then you can calibrate.</p>
            <PairForm order={order} setOrder={setOrder} />
          </>
        ) : (<>
        <Label>Step 2 · Calibrate on your {node.name.toLowerCase()}</Label>
        <h2 className="mt-2 text-xl font-medium tracking-tight">Hold to calibrate</h2>
        <p className="mt-1 text-[14px] text-ink/70 leading-relaxed">Sit still, relax your jaw, and hold the ring for 3 seconds. The patch measures your baseline while you hold.</p>
        <div className="my-6 grid place-items-center">
          <button
            onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); begin(); }}
            onPointerUp={end} onPointerCancel={end} onPointerLeave={end}
            onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); begin(); } }}
            onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") end(); }}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={done ? "Calibration complete" : "Press and hold for 3 seconds to calibrate"}
            className="relative h-[220px] w-[220px] max-w-full rounded-full select-none touch-none" style={{ WebkitTouchCallout: "none" }}>
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" className="ring-track" />
              {Array.from({ length: 60 }).map((_, i) => (
                <line key={i} x1="100" y1="4" x2="100" y2={i % 5 ? 8 : 11} stroke={i / 60 <= p ? "#E2B168" : "#243044"} strokeWidth="1.2" transform={`rotate(${i * 6} 100 100)`} />
              ))}
              <circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" strokeLinecap="round" className="ring-fill"
                style={{ stroke: done ? "#4ADE80" : "#E2B168" }} strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
            </svg>
            <div className={`absolute inset-[26px] rounded-full grid place-items-center text-center transition-colors ${holding ? "bg-brass/10" : "bg-slate0"} border border-line`}>
              <div>
                <Icon name={done ? "CheckCircle2" : holding ? "Activity" : "Fingerprint"} size={28} className={done ? "text-ok mx-auto" : "text-brass mx-auto"} />
                <div className="mt-2 text-[26px] font-medium tnum">{done ? "Ready" : `${Math.round(p * 100)}%`}</div>
                <div className="label mt-1">{done ? "Calibrated" : holding ? "Keep holding" : "Press & hold"}</div>
              </div>
            </div>
          </button>
        </div>
        <div className="rounded-xl bg-slate0 border border-line p-3" aria-live="polite">
          <div className={`text-[14px] ${done ? "text-ok" : aborted ? "text-warn" : "text-ink"}`}>
            {aborted ? "Released too early. Hold for the full 3 seconds." : holding || done ? phase.msg : "Waiting for you to press and hold."}
          </div>
        </div>
        {done && b && (
          <div className="mt-3 rounded-xl border border-line p-3 text-[13px] text-ink/80">
            Saved: steadiness {b.steadiness}%, reaction {(b.response / 1000).toFixed(2)} s, stamina {b.endurance} min.
            <button className="ml-1 text-brass underline underline-offset-2" onClick={() => setTab("rental")}>See your updated plan</button>
          </div>
        )}
        {done && <button onClick={reset} className="mt-3 self-start btn-ghost"><Icon name="RotateCcw" size={14} />Recalibrate</button>}
        </>)}
      </Card>
    </div>
  );
}

/* ───────────── Profile, goals and personalised plan ───────────── */
const GOALS = [
  { id: "craft",    name: "Woodwork and carving",              cls: "master" },
  { id: "repair",   name: "Fine repair: watches, electronics", cls: "master" },
  { id: "music",    name: "Playing an instrument",             cls: "virtuoso" },
  { id: "clinical", name: "Surgical or clinical training",     cls: "virtuoso" },
  { id: "everyday", name: "Steadier hands day to day",         cls: "base" },
];
const DEFAULT_GOALS = { goal: "craft", weekly: 3, budget: 30000 };
const ORDER_CLS = ["base", "master", "virtuoso"];

/* Your Neural Stream account profile, calibrated online before you ordered: a 12-minute at-home
   test using a phone camera and screen. Prototype values come from your name and order, so they
   stay the same for the same order. */
function onlineProfile(order) {
  const h = hashStr(`${order.address.name}|${order.number}`);
  const pick = (shift, min, span) => min + ((h >>> shift) % (span + 1));
  return {
    source: "online",
    at: new Date(new Date(order.placedAt).getTime() - pick(3, 6, 20) * 864e5).toISOString(),
    steadiness: pick(0, 66, 26), response: pick(5, 185, 85), endurance: pick(10, 45, 75), fine: pick(15, 58, 36),
    recovery: ["Quick", "Average", "Slow"][h % 3],
  };
}
/* The patch's own reading replaces the online estimate once you've set it up. */
function currentProfile(order) {
  const online = onlineProfile(order);
  return order.baseline ? { ...online, ...order.baseline, source: "patch", onlineAt: online.at } : online;
}

/* Every rule is returned with its result so the screen can show exactly why. */
function recommend(p, history, node, goals) {
  const mins = logged(history), sessions = history.length;
  const checks = {
    base: [{ ok: true, text: "Open to everyone, at any wearing spot" }],
    master: [
      { ok: p.steadiness >= 70, text: `Steadiness 70% or more (you: ${p.steadiness}%)` },
      { ok: p.fine >= 75 || mins >= 300, text: p.fine >= 75 ? `Fine control 75% or more (you: ${p.fine}%)` : `Fine control 75%+ (you: ${p.fine}%) or 5 h logged (you: ${fmtH(mins)})` },
      { ok: node !== "neck", text: `Worn on temple or forearm (you: ${NODES[node].name.toLowerCase()})` },
    ],
    virtuoso: [
      { ok: mins >= 2400, text: `40 h of streaming logged (you: ${fmtH(mins)})` },
      { ok: p.steadiness >= 82, text: `Steadiness 82% or more (you: ${p.steadiness}%)` },
      { ok: p.response <= 220, text: `Reaction 0.22 s or quicker (you: ${(p.response / 1000).toFixed(2)} s)` },
      { ok: node === "temple", text: `Worn on the temple (you: ${NODES[node].name.toLowerCase()})` },
    ],
  };
  const ready = Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, v.every((c) => c.ok)]));
  const goal = GOALS.find((g) => g.id === goals.goal) || GOALS[0];
  // Aim for the class your goal needs; if you're not ready yet, step down to the best one you are ready for.
  let cls = goal.cls;
  while (!ready[cls]) cls = ORDER_CLS[ORDER_CLS.indexOf(cls) - 1];
  const stepDown = cls !== goal.cls;

  const cap = Math.max(30, Math.floor((p.endurance * 2) / 15) * 15);
  const firstCap = p.recovery === "Slow" ? 45 : 60;
  const first = sessions < 3;
  const minutes = Math.min(first ? firstCap : 180, cap);
  const length = [
    { ok: true, text: `No more than twice your stamina (${p.endurance} min): ${fmtH(cap)}` },
    { ok: !first, text: first ? `First 3 sessions are capped at ${fmtH(firstCap)}${p.recovery === "Slow" ? " because your recovery is slow" : ""} (you've done ${sessions})` : "Past your first 3 sessions" },
  ];

  // Four-week build-up: start shorter, grow toward your stamina limit.
  const steady = Math.min(cap, 180);
  const weeks = [Math.min(45, minutes), minutes, Math.min(steady, Math.max(minutes, 75)), Math.min(steady, Math.max(minutes, 90))]
    .map((m, i) => ({ week: i + 1, sessions: goals.weekly, minutes: m }));
  const monthHours = weeks.reduce((a, w) => a + (w.sessions * w.minutes) / 60, 0);

  // Pay per hour vs monthly plan, then check the budget.
  const c = CLASSES[cls];
  const payg = monthHours * c.fee;
  const planCost = c.monthly + Math.max(0, monthHours - PLAN_HOURS) * c.fee;
  const billing = planCost < payg ? "monthly" : "hourly";
  const cost = Math.min(payg, planCost);
  const withinBudget = cost <= goals.budget;
  const billingWhy = [
    { ok: true, text: `You'd stream about ${monthHours.toFixed(1)} h in your first month (${goals.weekly} sessions a week, building up)` },
    { ok: billing === "monthly", text: `Monthly plan ${inr(planCost)} vs pay per hour ${inr(payg)}: ${billing === "monthly" ? "the plan is cheaper" : `pay per hour is cheaper until about ${(c.monthly / c.fee).toFixed(1)} h a month`}` },
    { ok: withinBudget, text: withinBudget ? `Fits your budget of ${inr(goals.budget)} a month` : `${inr(cost)} is over your ${inr(goals.budget)} budget` },
  ];
  // If it doesn't fit, suggest how many sessions a week would.
  const costAt = (n, k = c) => Math.min(weeks.reduce((a, w) => a + (n * w.minutes) / 60, 0) * k.fee, k.monthly);
  let fitWeekly = goals.weekly;
  while (fitWeekly > 1 && costAt(fitWeekly) > goals.budget) fitWeekly--;
  const fits = costAt(fitWeekly) <= goals.budget;
  const baseCost = costAt(goals.weekly, CLASSES.base);

  return { cls, goal, stepDown, minutes, checks, ready, length, weeks, monthHours, billing, payg, planCost, cost, withinBudget, billingWhy, fitWeekly, fits, minCost: costAt(1), baseCost, mins, sessions };
}

/* ───────────── Tab 02 ───────────── */
function useLiveSignals(active) {
  const [s, setS] = useState(() => ({ activity: Array(24).fill(30), contact: 92, quality: 94 }));
  useEffect(() => {
    const id = setInterval(() => setS((x) => {
      const base = active ? 62 : 28;
      const next = Math.max(5, Math.min(98, base + (Math.random() - 0.5) * (active ? 50 : 34)));
      return { activity: [...x.activity.slice(1), next], contact: Math.round(90 + Math.random() * 6), quality: Math.round(active ? 93 + Math.random() * 5 : 90 + Math.random() * 6) };
    }), 500);
    return () => clearInterval(id);
  }, [active]);
  return s;
}
const Spark = ({ values }) => (
  <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
    <polyline points={`0,28 ${values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - v * 0.26}`).join(" ")} 100,28`} fill="rgba(226,177,104,.12)" />
    <polyline points={values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - v * 0.26}`).join(" ")} fill="none" stroke="#E2B168" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
  </svg>
);
const Rule = ({ ok, text }) => (
  <li className="flex gap-2 text-[13px]"><Icon name={ok ? "CheckCircle2" : "Circle"} size={15} className={`mt-0.5 shrink-0 ${ok ? "text-ok" : "text-mute"}`} /><span className={ok ? "text-ink/85" : "text-mute"}>{text}</span></li>
);
const day = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function ProfileCard({ order, profile, live }) {
  const signals = useLiveSignals(live);
  const paired = statusOf(order) === "PAIRED";
  const p = profile;
  const tiles = [
    ["Steadiness", `${p.steadiness}%`, p.steadiness, "How still your hand stays when you hold it out", p.steadiness >= 82 ? "Very steady" : p.steadiness >= 70 ? "Steady" : "Building up"],
    ["Fine control", `${p.fine}%`, p.fine, "How precisely you place small movements", p.fine >= 75 ? "Precise" : "Developing"],
    ["Reaction", `${(p.response / 1000).toFixed(2)} s`, Math.max(0, 100 - (p.response - 150)), "Time from deciding to move to your muscle moving", p.response <= 220 ? "Quick" : "Average"],
    ["Stamina", `${p.endurance} min`, Math.min(100, p.endurance / 1.2), "How long your muscles stay fresh before they tire", p.endurance >= 90 ? "Long" : p.endurance >= 60 ? "Good" : "Short"],
  ];
  return (
    <Card className="p-5 sm:p-7">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Label>Your profile</Label>
          <h2 className="mt-2 text-xl font-medium tracking-tight">{order.address.name.split(" ")[0]}'s motor profile</h2>
          {p.source === "patch" ? (
            <p className="mt-1 text-[13px] text-mute">Measured by your patch on your {NODES[p.node].name.toLowerCase()} on {day(p.at)}. It replaced the estimate from your online check on {day(p.onlineAt)}.</p>
          ) : (
            <p className="mt-1 text-[13px] text-mute">From your online check on {day(p.at)}: a 12-minute test at home with your phone (a hold-still test, a tapping test and a reaction game). Your patch fine-tunes these numbers when you set it up.</p>
          )}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tiles.map(([k, v, pct, how, word]) => (
              <div key={k} className="rounded-xl border border-line bg-slate0 p-3">
                <div className="text-[12px] text-mute">{k}</div>
                <div className="mt-1 text-[19px] font-medium tnum">{v}</div>
                <div className="text-[12px] text-ink/80">{word}</div>
                <div className="mt-2 h-1 rounded-full bg-line overflow-hidden"><div className="h-full bg-brass" style={{ width: `${pct}%` }} /></div>
                <p className="mt-2 text-[11.5px] text-mute leading-snug">{how}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-mute">Recovery after effort: <span className="text-ink/85">{p.recovery}</span> · Streaming so far: {(order.history || []).length} sessions, {fmtH(logged(order.history))}</p>
        </div>
        <div className="lg:col-span-2">
          <Label>Right now</Label>
          {paired ? (
            <>
              <div className="mt-3 rounded-xl border border-line bg-slate0 p-3">
                <div className="flex justify-between text-[13px]"><span className="text-mute">Muscle movement</span><span className="tnum">{Math.round(signals.activity[signals.activity.length - 1])}%</span></div>
                <Spark values={signals.activity} />
                <div className="mt-3 flex justify-between text-[13px]"><span className="text-mute">Skin contact</span><span className="text-ok">{signals.contact >= 90 ? "Good" : "Fair"}</span></div>
                <div className="mt-1.5 flex justify-between text-[13px]"><span className="text-mute">Connection</span><span>{signals.quality >= 92 ? "Strong" : "Good"}</span></div>
              </div>
              <p className="mt-2 text-[12px] text-mute">{live ? "A skill is running, so your muscles are busier." : "Your muscles at rest, read by your patch."}</p>
            </>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-line p-4 text-[13px] text-mute">Live readings appear here once your patch is paired.</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function GoalsCard({ goals, setGoals }) {
  return (
    <Card className="p-5 sm:p-7">
      <Label>Your goals</Label>
      <h2 className="mt-2 text-xl font-medium tracking-tight">What do you want to get better at?</h2>
      <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Goal">
        {GOALS.map((g) => (
          <button key={g.id} role="radio" aria-checked={goals.goal === g.id} onClick={() => setGoals({ goal: g.id })}
            className={`rounded-xl border px-3 py-2.5 text-left text-[14px] transition-colors ${goals.goal === g.id ? "border-brass/60 bg-slate0 text-ink" : "border-line text-ink/75 hover:text-ink"}`}>
            {g.name}<span className="ml-2 text-[12px] text-mute">· {CLASSES[g.cls].name}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex items-baseline justify-between"><label htmlFor="weekly" className="text-[13px] text-mute">Sessions a week</label><span className="text-[15px] text-brass tnum">{goals.weekly}</span></div>
      <input id="weekly" type="range" min="1" max="7" value={goals.weekly} onChange={(e) => setGoals({ weekly: +e.target.value })} className="mt-3" style={{ "--pct": `${((goals.weekly - 1) / 6) * 100}%` }} />
      <div className="mt-5 flex items-baseline justify-between"><label htmlFor="budget" className="text-[13px] text-mute">Monthly budget</label><span className="text-[15px] text-brass tnum">{inr(goals.budget)}</span></div>
      <input id="budget" type="range" min="2000" max="150000" step="1000" value={goals.budget} onChange={(e) => setGoals({ budget: +e.target.value })} className="mt-3" style={{ "--pct": `${((goals.budget - 2000) / 148000) * 100}%` }} />
    </Card>
  );
}

function PlanCard({ rec, onUse }) {
  const c = CLASSES[rec.cls];
  return (
    <Card className="p-5 sm:p-7 border-brass/40">
      <Label>Your personalised plan</Label>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">{c.name}</h2>
          <p className="mt-1 text-[14px] text-ink/75">{rec.goal.name} · {rec.weeks[0].sessions} sessions a week · {rec.billing === "monthly" ? "Monthly plan" : "Pay per hour"}</p>
        </div>
        <div className="text-right">
          <div className="text-[24px] font-medium tnum">{inr(rec.cost)}</div>
          <div className="text-[12px] text-mute">first month{rec.billing === "monthly" ? `, ${PLAN_HOURS} h included` : ""}</div>
        </div>
      </div>
      {rec.stepDown && (
        <p className="mt-3 rounded-xl bg-slate0 p-3 text-[13px] text-ink/80">
          Your goal needs <span className="text-brass">{CLASSES[rec.goal.cls].name}</span>. You aren't ready for it yet (see the checklist below), so you start on {c.name} and build towards it.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {rec.weeks.map((w) => (
          <div key={w.week} className="rounded-xl border border-line bg-slate0 p-3">
            <div className="text-[12px] text-mute">Week {w.week}</div>
            <div className="mt-1 text-[15px] font-medium tnum">{w.sessions} × {fmtH(w.minutes)}</div>
            <div className="text-[12px] text-mute">rest {fmtH(w.minutes * c.mult)} after each</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid sm:grid-cols-2 gap-5">
        <div>
          <div className="text-[14px] font-medium">Why this length</div>
          <ul className="mt-2 grid gap-1.5">{rec.length.map((r) => <Rule key={r.text} {...r} />)}</ul>
        </div>
        <div>
          <div className="text-[14px] font-medium">Why {rec.billing === "monthly" ? "a monthly plan" : "pay per hour"}</div>
          <ul className="mt-2 grid gap-1.5">{rec.billingWhy.map((r) => <Rule key={r.text} {...r} />)}</ul>
          {!rec.withinBudget && (
            <p className="mt-2 text-[13px] text-warn">
              {rec.fits
                ? `To stay within budget, try ${rec.fitWeekly} session${rec.fitWeekly === 1 ? "" : "s"} a week.`
                : `Even 1 session a week costs ${inr(rec.minCost)}. ${rec.cls !== "base" ? `Base Motor at your pace would be ${inr(rec.baseCost)}, or ` : ""}raise your budget.`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5 grid sm:grid-cols-3 gap-4">
        {Object.entries(rec.checks).map(([k, rules]) => (
          <div key={k}>
            <div className="flex items-center gap-2 text-[14px] font-medium">{CLASSES[k].name}
              {rec.ready[k] ? <span className="rounded-full border border-ok/40 px-2 py-0.5 text-[11px] text-ok">Ready</span> : <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-mute">Not yet</span>}
            </div>
            <ul className="mt-2 grid gap-1.5">{rules.map((r) => <Rule key={r.text} {...r} />)}</ul>
          </div>
        ))}
      </div>
      <button className="btn-primary mt-5" onClick={onUse}><Icon name="Check" size={16} />Use this plan below</button>
    </Card>
  );
}

function Rental({ order, setOrder, setTab }) {
  const profile = currentProfile(order);
  const goals = order.goals || DEFAULT_GOALS;
  const setGoals = (patch) => setOrder((o) => ({ ...o, goals: { ...(o.goals || DEFAULT_GOALS), ...patch } }));
  const history = order.history || [];
  const rec = recommend(profile, history, order.design.node, goals);
  const [cls, setCls] = useState(rec.cls);
  const [mins, setMins] = useState(rec.minutes);
  const [billing, setBilling] = useState(rec.billing);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const status = statusOf(order);
  const ready = status === "PAIRED" && order.calibrated;

  const c = CLASSES[cls];
  const cooldown = mins * c.mult;
  const score = Math.min(100, Math.round((mins / 480) * 55 * c.risk + (c.risk > 2 ? 12 : 0)));
  const band = score < 34 ? { k: "Low", col: "#4ADE80", note: "Comfortable for most people. No extra steps needed." }
            : score < 67 ? { k: "Medium", col: "#F5B84B", note: "Do the 5-minute hand reset afterwards, and don't drive while resting." }
            : { k: "High", col: "#F87171", note: "Have someone with you, and take three days off before the next Virtuoso session." };
  const pct = ((mins - 30) / (480 - 30)) * 100;
  const sessionCost = billing === "monthly" ? 0 : (c.fee * mins) / 60;
  const resumeStr = new Date(Date.now() + (mins + cooldown) * 60000).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" });

  const s = order.session;
  const live = s && now < s.ends;
  const resting = s && !live && now < s.rests;
  useEffect(() => {
    if (s && !live && !s.logged) setOrder((o) => ({ ...o, session: { ...o.session, logged: true }, history: [...(o.history || []), { cls: s.cls, minutes: Math.max(1, Math.round((s.ends - s.starts) / 60000)), at: s.ends }] }));
  }, [s, live, setOrder]);
  const start = () => { const t = Date.now(); setOrder((o) => ({ ...o, session: { cls, mins, starts: t, ends: t + mins * 60000, rests: t + (mins + cooldown) * 60000 } })); };
  const stop = () => { const t = Date.now(); const streamed = Math.max(1, (t - s.starts) / 60000); setOrder((o) => ({ ...o, session: { ...o.session, ends: t, rests: t + streamed * CLASSES[s.cls].mult * 60000 } })); };
  const left = (ms) => fmtH(Math.max(0, Math.ceil(ms / 60000)));
  const usePlan = () => {
    setCls(rec.cls); setMins(rec.minutes); setBilling(rec.billing);
    document.getElementById("configure")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-4 fade-in">
      <ProfileCard order={order} profile={profile} live={!!live} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-2"><GoalsCard goals={goals} setGoals={setGoals} /></div>
        <div className="lg:col-span-3"><PlanCard rec={rec} onUse={usePlan} /></div>
      </div>

      <div id="configure" className="grid grid-cols-1 lg:grid-cols-5 gap-4 scroll-mt-20">
        <Card className="lg:col-span-2 p-5 sm:p-7">
          <Label>Start a session</Label>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">Choose a skill</h2>
          <div className="mt-5 grid gap-2" role="radiogroup" aria-label="Skill">
            {Object.entries(CLASSES).map(([k, v]) => {
              const blocked = !rec.ready[k];
              return (
                <button key={k} role="radio" aria-checked={cls === k} disabled={blocked || live} onClick={() => setCls(k)}
                  className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cls === k ? "border-brass/60 bg-slate0" : "border-line hover:bg-slate0/60"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[15px]">{v.name}</span>
                    <span className="text-[13px] tnum">{inr(v.fee)}<span className="text-mute">/h</span> · {inr(v.monthly)}<span className="text-mute">/mo</span></span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {rec.cls === k && <span className="rounded-full bg-brass/15 text-brass px-2 py-0.5 text-[11px]">In your plan</span>}
                    {blocked && <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-mute">Not ready yet</span>}
                  </div>
                  <p className="mt-1.5 text-[12px] text-mute leading-relaxed">{v.desc}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-baseline justify-between">
            <label htmlFor="duration" className="text-[13px] text-mute">Session length</label>
            <span className="text-[15px] text-brass tnum">{fmtH(mins)}</span>
          </div>
          <input id="duration" type="range" min="30" max="480" step="15" value={mins} disabled={live} onChange={(e) => setMins(+e.target.value)} className="mt-4" style={{ "--pct": `${pct}%` }} />
          <div className="mt-2 flex justify-between text-[12px] text-mute"><span>30 min</span><span>4 h</span><span>8 h</span></div>
          {mins > rec.minutes && <p className="mt-2 text-[12px] text-warn">Longer than your plan suggests ({fmtH(rec.minutes)}).</p>}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-line bg-slate0 p-1">
            {[["hourly", "Pay per hour"], ["monthly", "Monthly plan"]].map(([id, label]) => (
              <button key={id} onClick={() => setBilling(id)} disabled={live} aria-pressed={billing === id}
                className={`rounded-lg py-2 text-[13px] ${billing === id ? "bg-brass text-slate0 font-medium" : "text-mute hover:text-ink"}`}>{label}</button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3 p-5 sm:p-7">
          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>This session</Label><div className="mt-2 text-[28px] font-light tnum">{billing === "monthly" ? "In plan" : inr(sessionCost)}</div></div>
            <div><Label>Rest afterwards</Label><div className="mt-2 text-[28px] font-light tnum">{fmtH(cooldown)}</div></div>
            <div><Label>Effort</Label><div className="mt-2 text-[28px] font-light" style={{ color: band.col }}>{band.k}</div></div>
          </div>
          <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate0">
            <div className="bg-brass transition-all duration-500" style={{ width: `${100 / (1 + c.mult)}%` }} title="Session" />
            <div className="bg-mute/40 transition-all duration-500" style={{ width: `${(100 * c.mult) / (1 + c.mult)}%` }} title="Rest" />
          </div>
          <p className="mt-3 text-[13px] text-ink/70">{band.note} During rest, skilled tasks pause; normal movement is fine. Start now and you're free again {resumeStr}.</p>

          <div className="mt-5 border-t border-line pt-5">
            {!ready ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-[14px] text-ink/75"><Icon name="Lock" size={15} />{status === "PAIRED" ? "Calibrate your patch before your first session." : "Pair your patch to start a session."}</p>
                <button className="btn-ghost" onClick={() => setTab("onboard")}>Go to setup<Icon name="ArrowRight" size={14} /></button>
              </div>
            ) : live ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-ok"><span className="pulse h-2 w-2 rounded-full bg-ok inline-block"></span><span className="font-medium">{CLASSES[s.cls].name} is running</span></div>
                  <div className="mt-1 text-[13px] text-mute">{left(s.ends - now)} left</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={stop}><Icon name="Square" size={14} />End early</button>
                  <button className="btn-ghost text-warn" onClick={() => setOrder((o) => ({ ...o, session: { ...o.session, ends: Date.now(), rests: Date.now() + CLASSES[s.cls].mult * s.mins * 60000 } }))}>Finish now (prototype)</button>
                </div>
              </div>
            ) : resting ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-warn"><Icon name="Moon" size={16} />Resting · next session in {left(s.rests - now)}</div>
                <button className="btn-ghost text-warn" onClick={() => setOrder((o) => ({ ...o, session: { ...o.session, rests: Date.now() } }))}>Skip rest (prototype)</button>
              </div>
            ) : (
              <button className="btn-primary w-full py-3" onClick={start}><Icon name="Play" size={16} />Start {c.name} · {fmtH(mins)} · {billing === "monthly" ? "in plan" : inr(sessionCost)}</button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Tab 03 ───────────── */
function AnatomyMap({ order, design, setOrder }) {
  const worn = (order ? order.design : design).node;
  const look = order ? order.design : design;
  const [sel, setSel] = useState(worn);
  const n = NODES[sel];
  const finish = findFinish(look.finish);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 fade-in">
      <Card className="lg:col-span-2 p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <Label>Three places to wear it</Label>
        </div>
        <div className="mt-4 overflow-x-auto">
          <svg viewBox="0 0 280 420" className="mx-auto w-full max-w-[300px]" role="group" aria-label="Body diagram with the three wearing spots">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#243044" strokeWidth=".5" /></pattern>
            </defs>
            <rect width="280" height="420" fill="url(#grid)" opacity=".6" />
            <g fill="none" stroke="#94A3B8" strokeOpacity=".7" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
              <ellipse cx="112" cy="68" rx="30" ry="37" fill="#0B0F17" />
              <path d="M98 102 L100 124 M126 102 L124 124" />
              <path d="M100 124 C78 128 58 134 52 150 L44 236 L36 316 M124 124 C146 128 166 134 172 150 L184 228 L200 300" />
              <path d="M66 156 L72 250 L80 400 M158 156 L152 250 L144 400" />
              <path d="M72 250 C96 262 128 262 152 250" />
              <path d="M36 316 L32 340 M200 300 L210 322" />
            </g>
            <Shell shape={look.shape} color={finish.hex} coating={look.coating} x={NODES[worn].x - 12} y={NODES[worn].y - 12} width="24" height="24" />
            {Object.entries(NODES).map(([k, v]) => {
              const on = k === sel;
              return (
                <g key={k} role="button" tabIndex="0" aria-pressed={on} aria-label={`Show ${v.name}`}
                  onClick={() => setSel(k)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(k); } }} style={{ cursor: "pointer", outline: "none" }}>
                  <circle cx={v.x} cy={v.y} r="20" fill="transparent" />
                  {on && <circle cx={v.x} cy={v.y} r="16" fill="none" stroke="#E2B168" strokeWidth="1" opacity=".5">
                    <animate attributeName="r" values="14;22;14" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values=".7;0;.7" dur="2.4s" repeatCount="indefinite" />
                  </circle>}
                  {k !== worn && <circle cx={v.x} cy={v.y} r={on ? 7 : 5.5} fill={on ? "#E2B168" : "#161F2E"} stroke="#E2B168" strokeWidth="1.5" />}
                  <text x={v.x + (k === "neck" ? -22 : 20)} y={v.y + 4} textAnchor={k === "neck" ? "end" : "start"} fontSize="11" fill={on ? "#E2B168" : "#94A3B8"}>{v.name}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Object.entries(NODES).map(([k, v]) => (
            <button key={k} onClick={() => setSel(k)} aria-pressed={k === sel}
              className={`rounded-lg border px-2 py-2 text-[13px] transition-colors ${k === sel ? "border-brass/60 text-ink bg-slate0" : "border-line text-ink/70 hover:text-ink"}`}>{v.name}</button>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-3 p-5 sm:p-7" key={sel}>
        <div className="fade-in">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Label>{sel === worn ? "Where your shell goes" : "Another option"}</Label>
              <h2 className="mt-2 text-2xl sm:text-[28px] font-medium tracking-tight">{n.name}</h2>
              <p className="mt-1 text-[14px] text-ink/70">{n.bestFor}</p>
            </div>
            <div className="text-right">
              <Label>How well it reads you</Label>
              <div className="mt-1 text-[22px] text-brass">{n.strength}</div>
            </div>
          </div>
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <div className="min-w-0">
              <Label className="flex items-center gap-2"><Icon name="Hand" size={13} />What it helps with</Label>
              <ul className="mt-3 grid gap-2.5">{n.helps.map((p) => <li key={p} className="text-[14px] text-ink/85 leading-snug pl-4 border-l border-brass/40">{p}</li>)}</ul>
            </div>
            <div className="min-w-0">
              <Label className="flex items-center gap-2"><Icon name="Ruler" size={13} />How to place it</Label>
              <ul className="mt-3 grid gap-2.5">{n.place.map((p) => <li key={p} className="text-[14px] text-ink/85 leading-snug pl-4 border-l border-line">{p}</li>)}</ul>
            </div>
          </div>
          {order && sel !== worn && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line p-3">
              <p className="text-[13px] text-mute">Moving the patch means calibrating again in the new spot.</p>
              <button className="btn-ghost" onClick={() => setOrder((o) => ({ ...o, design: { ...o.design, node: sel }, calibrated: false, baseline: null }))}>Wear it here instead</button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ───────────── Tab 04 ───────────── */
const RISKS = [
  { id: "mid", title: "Your movements feel “borrowed”", sev: "Serious", icon: "UserX",
    body: "After many complex streams, some people feel their own handwriting, walk or grip isn't theirs any more. It affects about 1 in 340 people who stream more than 20 Virtuoso hours a month.",
    act: ["Once a week, do one task without the patch (sign your name, tie a knot) and compare it with your first week.", "If your own movement feels strange for more than two days, stop streaming and call Clinical Support."] },
  { id: "pst", title: "Shaky hands after a session", sev: "Common", icon: "Activity",
    body: "A light tremor in the streamed hand or arm for up to 40 minutes afterwards is normal while your brain takes back control. About 1 in 5 people get it in their first month, and it usually fades within 12 sessions.",
    act: ["Finish the full rest time before driving, cooking with knives or using machinery.", "Get medical advice if the shaking lasts more than 6 hours or spreads to a limb you didn't stream."] },
  { id: "umc", title: "Trying to keep a rented skill", sev: "Not allowed", icon: "Ban",
    body: "Skills are rented, not bought. Trying to keep one after the session, by over-rehearsing or modified software, leaves you with a movement pattern your body isn't ready for and can injure tendons and joints.",
    act: ["The patch deletes each skill when the session ends. Don't try to stop this.", "Attempts are blocked straight away and the skill's owner is told."] },
];
const sevColor = { Common: "#F5B84B", Serious: "#F87171", "Not allowed": "#F87171" };

function Safety({ onDRM, drm, paired }) {
  const [open, setOpen] = useState("mid");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 fade-in">
      <Card className="lg:col-span-3 p-5 sm:p-7">
        <Label>Read before your first stream</Label>
        <h2 className="mt-2 text-2xl sm:text-[28px] font-medium tracking-tight">Known risks</h2>
        <p className="mt-2 text-[14px] text-ink/70">Don't use the patch if you have a pacemaker, cochlear implant or epilepsy, or if you're pregnant.</p>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {RISKS.map((r) => {
            const on = open === r.id;
            return (
              <div key={r.id}>
                <button onClick={() => setOpen(on ? null : r.id)} aria-expanded={on} className="w-full flex items-center gap-3 py-4 text-left">
                  <Icon name={r.icon} size={18} className="text-brass shrink-0" />
                  <span className="flex-1 text-[16px] font-medium">{r.title}</span>
                  <span className="hidden sm:inline rounded-full px-2.5 py-0.5 text-[11px]" style={{ color: sevColor[r.sev], border: `1px solid ${sevColor[r.sev]}55` }}>{r.sev}</span>
                  <Icon name="ChevronDown" size={16} className={`text-mute transition-transform duration-300 ${on ? "rotate-180" : ""}`} />
                </button>
                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <div className="pb-5 pl-[30px] pr-2">
                      <p className="text-[14px] text-ink/80 leading-relaxed max-w-[62ch]">{r.body}</p>
                      <ul className="mt-3 grid gap-2">{r.act.map((a) => <li key={a} className="flex gap-2 text-[13px] text-ink/75"><Icon name="ArrowRight" size={14} className="text-brass mt-0.5 shrink-0" />{a}</li>)}</ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="lg:col-span-2 p-5 sm:p-7 flex flex-col">
        <Label>Compliance</Label>
        <h2 className="mt-2 text-xl font-medium tracking-tight">How skills are protected</h2>
        <p className="mt-2 text-[14px] text-ink/70 leading-relaxed">Each rented skill is locked to one session with a key that expires when you disconnect. Nothing about the skill is kept on your patch afterwards.</p>
        <ul className="mt-4 grid gap-2 text-[14px] text-ink/80">
          <li className="flex gap-2"><Icon name="BadgeCheck" size={16} className="text-brass mt-0.5" />Sits on the skin. Nothing goes under it.</li>
          <li className="flex gap-2"><Icon name="BadgeCheck" size={16} className="text-brass mt-0.5" />Readings from your body stay on the patch</li>
          <li className="flex gap-2"><Icon name="BadgeCheck" size={16} className="text-brass mt-0.5" />Clinical Support 24/7: <span className="select-all">1800 210 4242</span></li>
        </ul>
        {paired ? (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-crit/30 bg-crit/5 p-4">
            <div className="min-w-0">
              <div className="text-[14px] font-medium">Practice: try to keep a skill</div>
              <div className="text-[12px] text-ink/60 mt-0.5">A safe run-through of the copy-protection lockout.</div>
            </div>
            <button role="switch" aria-checked={drm} onClick={onDRM} id="drm-toggle" aria-label="Run copy-protection practice"
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${drm ? "bg-crit/80 border-crit" : "bg-slate0 border-line"}`}>
              <span className={`absolute top-0.5 h-[22px] w-[22px] rounded-full bg-ink transition-all ${drm ? "left-[22px]" : "left-0.5"}`}></span>
            </button>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-line p-4 text-[13px] text-mute"><Icon name="Lock" size={14} />The copy-protection practice needs your paired patch.</div>
        )}
      </Card>
    </div>
  );
}

function Lockout({ onClose }) {
  const [t, setT] = useState(30);
  useEffect(() => { const id = setInterval(() => setT((v) => (v > 0 ? v - 1 : 0)), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate0/80 backdrop-blur-sm px-4" role="alertdialog" aria-modal="true" aria-labelledby="lock-title">
      <div className="fade-in w-full max-w-md rounded-2xl border border-crit/50 bg-card p-6 sm:p-7 shadow-2xl shadow-crit/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-crit/15 grid place-items-center text-crit"><Icon name="Lock" size={18} /></div>
          <div>
            <div className="text-[12px] text-crit">Practice run</div>
            <h2 id="lock-title" className="text-xl font-medium">Stream stopped to protect you</h2>
          </div>
        </div>
        <p className="mt-4 text-[14px] text-ink/80 leading-relaxed">The patch noticed an attempt to keep a rented skill after its session ended. It stopped the stream and deleted the copy.</p>
        <div className="mt-5 rounded-xl border border-line bg-slate0 p-4 text-[14px] grid gap-1.5">
          <div className="flex justify-between"><span className="text-mute">Skill stream</span><span className="text-crit">Stopped</span></div>
          <div className="flex justify-between"><span className="text-mute">Copied data</span><span className="text-ok">Deleted</span></div>
          <div className="flex justify-between"><span className="text-mute">Your own movement</span><span className="text-ok">Not affected</span></div>
          <div className="flex justify-between"><span className="text-mute">Streaming available in</span><span className="tnum">{t > 0 ? `${t} s` : "Now"}</span></div>
        </div>
        <p className="mt-4 text-[12px] text-mute">For real, streaming stays off for 72 hours and you'd need to check in with Clinical Support.</p>
        <button onClick={onClose} autoFocus className="mt-5 w-full btn-primary py-3">End practice run</button>
      </div>
    </div>
  );
}

/* ───────────── Tab 05 ───────────── */
const PARTS = [
  { n: "01", name: "Your printed shell",  spec: "Custom 3D-printed cover · clips on", note: "The shell you designed. It snaps over the patch and can be swapped for a new design any time." },
  { n: "02", name: "Sweat seal",          spec: "Waterproof to 1.5 m for 30 min", note: "A soft silicone ring keeps sweat and shower water out, so you can wear it for days." },
  { n: "03", name: "Signal processor",    spec: "Bluetooth · processes on the patch", note: "Your signals are processed on the patch itself, so raw data never leaves it." },
  { n: "04", name: "Battery",             spec: "14 hours of streaming", note: "Non-flammable cell. Charges to 80% in 25 minutes on the magnetic dock." },
  { n: "05", name: "Vibration cues",      spec: "Gentle taps for guidance", note: "Taps against the skin to guide calibration and warn you if a stream stops." },
  { n: "06", name: "Skin-safe base",      spec: "Medical-grade plastic", note: "Stays at skin temperature and is tested for long contact with skin." },
  { n: "07", name: "Sensor ring",         spec: "16 gold-plated contacts", note: "Sixteen small contacts in a ring read the tiny electrical signals from your muscles." },
  { n: "08", name: "Gel pad",             spec: "Single use · 12 hours", note: "A fresh pad each day keeps contact steady without drying out." },
];
const BOX = [
  { n: "01", name: "DS-28 patch", meta: "With your shell fitted", icon: "CircleDot" },
  { n: "02", name: "Magnetic dock", meta: "USB-C powered", icon: "Magnet" },
  { n: "03", name: "30 gel pads", meta: "Single use, 12 hours each", icon: "Layers" },
  { n: "04", name: "USB-C cable", meta: "1 m braided", icon: "Cable" },
];

function Hardware({ order }) {
  const [sel, setSel] = useState("01");
  const p = PARTS.find((x) => x.n === sel);
  const finish = findFinish(order.design.finish);
  const W = 260, H = 420, gap = 46, top = 34;
  return (
    <div className="grid gap-4 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 p-5 sm:p-7">
          <div className="flex items-center justify-between"><Label>Inside the patch, layer by layer</Label><span className="text-[12px] text-mute">8 layers</span></div>
          <div className="mt-4 overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[300px]" role="group" aria-label="Exploded view of the patch">
              <path d={`M130 ${top - 10} V${top + gap * 7 + 20}`} stroke="#243044" strokeDasharray="2 3" fill="none" />
              {PARTS.map((pt, i) => {
                const y = top + i * gap, on = pt.n === sel, rx = i === 7 ? 54 : i === 1 ? 62 : 58, ry = 13;
                return (
                  <g key={pt.n} role="button" tabIndex="0" aria-pressed={on} aria-label={pt.name} onClick={() => setSel(pt.n)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(pt.n); } }} style={{ cursor: "pointer", outline: "none" }}>
                    <ellipse cx="130" cy={y + 5} rx={rx} ry={ry} fill="#0B0F17" stroke={on ? "#E2B168" : "#243044"} strokeWidth="1" />
                    <ellipse cx="130" cy={y} rx={rx} ry={ry} fill={i === 0 ? `${finish.hex}22` : i === 7 ? (on ? "#E2B16833" : "#E2B16814") : "#161F2E"} stroke={on ? "#E2B168" : "#94A3B8"} strokeOpacity={on ? 1 : 0.5} strokeWidth={on ? 1.6 : 1} />
                    {i === 0 && <Shell shape={order.design.shape} color={finish.hex} coating={order.design.coating} x="116" y={y - 13} width="28" height="26" />}
                    {i === 6 && Array.from({ length: 16 }).map((_, k) => { const a = (k / 16) * Math.PI * 2; return <circle key={k} cx={130 + Math.cos(a) * 40} cy={y + Math.sin(a) * 8} r="1.6" fill="#E2B168" opacity={on ? 1 : 0.6} />; })}
                    <line x1={130 + rx} y1={y} x2="214" y2={y} stroke={on ? "#E2B168" : "#243044"} strokeWidth="1" />
                    <text x="218" y={y + 3.5} fontSize="11" fill={on ? "#E2B168" : "#94A3B8"}>{pt.n}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-4 rounded-xl border border-line bg-slate0 p-4 fade-in" key={sel} aria-live="polite">
            <div className="text-[14px] font-medium text-brass">{p.name}</div>
            <div className="mt-0.5 text-[13px] text-ink/80">{p.spec}</div>
            <p className="mt-2 text-[13px] text-ink/70 leading-relaxed">{p.note}</p>
          </div>
        </Card>
        <Card className="lg:col-span-3 p-5 sm:p-7">
          <Label>Eight layers, 4.1 grams</Label>
          <h2 className="mt-2 text-2xl sm:text-[28px] font-medium tracking-tight">What it's made of</h2>
          <ul className="mt-5 border-y border-line divide-y divide-line">
            {PARTS.map((pt) => {
              const on = pt.n === sel;
              return (
                <li key={pt.n}>
                  <button onClick={() => setSel(pt.n)} aria-pressed={on}
                    className={`w-full grid grid-cols-[2.25rem_1fr] sm:grid-cols-[2.25rem_12rem_1fr] gap-x-3 gap-y-0.5 py-3 text-left transition-colors ${on ? "text-ink" : "text-ink/75 hover:text-ink"}`}>
                    <span className={`text-[13px] tnum pt-0.5 ${on ? "text-brass" : "text-mute"}`}>{pt.n}</span>
                    <span className="text-[14px] font-medium">{pt.name}</span>
                    <span className="col-start-2 sm:col-start-3 text-[13px] text-mute min-w-0">{pt.spec}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[["Weight", "4.1 g"], ["Width", "18 mm"], ["Thickness", "3.4 mm"]].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-slate0 p-3"><div className="text-[12px] text-mute">{k}</div><div className="mt-1 text-[15px] tnum">{v}</div></div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-5 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div><Label>In the box</Label><h2 className="mt-2 text-xl font-medium tracking-tight">Starter kit</h2></div>
          <span className="text-[13px] text-mute">{inr(PRICING.kit + PRICING.shell)} incl. GST · 30-day return window</span>
        </div>
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {BOX.map((b) => (
            <div key={b.n} className="rounded-xl border border-line bg-slate0 p-4">
              <Icon name={b.icon} size={18} className="text-brass" />
              <div className="mt-3 text-[15px] font-medium">{b.name}</div>
              <div className="mt-0.5 text-[13px] text-mute">{b.meta}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ───────────── App ───────────── */
const STORE = "ns-ds28-manual";
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
const DEFAULT_DESIGN = { shape: SHAPES[0], finish: "red", coating: "gloss", node: "temple", prompt: PROMPTS[0] };
const makeSerial = (code) => `DS28-${code}-${100 + Math.floor(Math.random() * 900)}`;

function App() {
  const saved = useMemo(load, []);
  const fromHash = location.hash.replace("#", "");
  const [view, setView] = useState(["home", "studio", "checkout", "manual"].includes(fromHash) ? fromHash : TABS.some((t) => t.id === fromHash) ? "manual" : "home");
  const [tab, setTab] = useState(TABS.some((t) => t.id === fromHash) ? fromHash : "order");
  const [design, setDesign] = useState(saved.design || DEFAULT_DESIGN);
  const [order, setOrder] = useState(saved.order || null);
  // The uploaded photo is kept in memory only, never saved.
  const [photo, setPhoto] = useState(null);
  const [drm, setDrm] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify({ design, order })); } catch {} }, [design, order]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: view === "studio" ? "smooth" : "auto" }); }, [view]);

  const status = statusOf(order);
  const place = ({ address, delivery, pay, total }) => {
    setOrder({ number: `NS-${100000 + Math.floor(Math.random() * 900000)}`, serial: makeSerial(design.shape.code), design: { ...design }, address, delivery, pay, total, placedAt: new Date().toISOString(), stage: 0, paired: false, calibrated: false, baseline: null, history: [], session: null, goals: DEFAULT_GOALS });
    setTab("order"); setView("manual");
  };
  const demo = () => place({ address: { name: "Asha Rao", phone: "9876543210", street: "12B, Lake View Apartments, MG Road", area: "", city: "Pune", state: "Maharashtra", pin: "411001" }, delivery: "standard", pay: "upi", total: PRICING.kit + PRICING.shell });

  const toggleDRM = () => {
    if (drm) { setDrm(false); return; }
    setDrm(true); setGlitch(true);
    setTimeout(() => { setGlitch(false); setModal(true); }, 900);
  };
  const closeModal = () => { setModal(false); setDrm(false); };
  const current = TABS.find((t) => t.id === tab);
  const locked = current.needs && !["DELIVERED", "PAIRED"].includes(status);

  return (
    <>
      <div className={glitch ? "glitch" : ""}>
        <Header view={view} setView={setView} order={order} overlay={view === "home"} />
        {view === "home" && <Home design={design} order={order} onStart={() => setView("studio")} onManual={() => { setTab("order"); setView("manual"); }} />}
        {view === "studio" && <Studio design={design} setDesign={setDesign} onBuy={() => setView("checkout")} photo={photo} setPhoto={setPhoto} />}
        {view === "checkout" && <Checkout design={design} order={order} onPlace={place} onManual={() => { setTab("order"); setView("manual"); }} onNewOrder={() => { setOrder(null); setView("studio"); }} />}
        {view === "manual" && (
          <>
            <DevBar order={order} setOrder={setOrder} onDemo={demo} />
            <Tabs tab={tab} setTab={setTab} status={status} />
            <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6" key={tab}>
              {locked ? <LockedPanel tab={tab} order={order} setTab={setTab} setOrder={setOrder} /> : (
                <>
                  {tab === "order" && <OrderTracking order={order} setOrder={setOrder} onStudio={() => setView("studio")} setTab={setTab} />}
                  {tab === "onboard" && <Calibration order={order} setOrder={setOrder} setTab={setTab} />}
                  {tab === "rental" && <Rental order={order} setOrder={setOrder} setTab={setTab} />}
                  {tab === "map" && <AnatomyMap order={order} design={design} setOrder={setOrder} />}
                  {tab === "safety" && <Safety onDRM={toggleDRM} drm={drm} paired={status === "PAIRED"} />}
                  {tab === "hardware" && <Hardware order={order} />}
                </>
              )}
            </main>
          </>
        )}
        {view !== "home" && <footer className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 flex flex-wrap gap-x-6 gap-y-2 justify-between text-[12px] text-mute">
          <span>Neural Stream™ DS-28 · speculative design set in 2035, not a real product</span>
          <span>Clinical Support 24/7 · 1800 210 4242</span>
        </footer>}
      </div>
      {modal && <Lockout onClose={closeModal} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
