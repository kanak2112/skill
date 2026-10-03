import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { presetShape } from '../shapes.js';

/** Showcase shells. Each carries its own geometry so custom designs can join the list. */
export const MORPHS = [
  { id: 'anger', shape: presetShape('anger'), color: '#ff2a4b', name: 'Anger Glyph', finish: 'Electro-Chromic Red' },
  { id: 'bolt', shape: presetShape('bolt'), color: '#00f0ff', name: 'Volt Bolt', finish: 'Cyber Cyan' },
  { id: 'tear', shape: presetShape('tear'), color: '#ffb703', name: 'Teardrop', finish: 'Matte Gold' },
  { id: 'hex', shape: presetShape('hex'), color: '#7d8ba3', name: 'Hex Mesh', finish: 'Stealth Slate' },
];

// Relative URLs resolve next to the page, both in dev (/ds28/head/…) and when published.
const ASSET = './head/';
// Hosts that can't serve .glb can point this at a glTF JSON copy before the app loads.
const MODEL_URL = (typeof window !== 'undefined' && window.__DS28_HEAD_MODEL) || `${ASSET}LeePerrySmith.glb`;
const TARGET = new THREE.Vector3(0, 0.16, 0);

/** Draw a shell onto a canvas so it can be projected onto the skin as a decal texture. */
function shellTexture({ shape, color }) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const path = new Path2D(shape.d);
  ctx.scale(size / 100, size / 100);
  const g = ctx.createLinearGradient(0, 0, 100, 100);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.28, color);
  g.addColorStop(1, '#0b0f17');
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  if (shape.mode === 'stroke') {
    ctx.lineWidth = shape.strokeWidth ?? 9;
    ctx.lineCap = shape.cap ?? 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = g;
    ctx.stroke(path);
  } else {
    ctx.fillStyle = g;
    ctx.fill(path);
  }
  // Specular edge highlight
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.2;
  ctx.translate(-0.8, -0.8);
  ctx.stroke(path);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const easeOutBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

/**
 * Live WebGL canvas: a scanned head (Lee Perry-Smith, CC BY 3.0) with orbit controls (drag to
 * turn, scroll or pinch to zoom). The shell is a decal projected onto the temple. `active` picks
 * the shell; with `auto` on, the view turns by itself and the next shell is fitted each time the
 * temple turns out of sight, reported through `onActive`.
 */
export default function HeadViewer({ shells = MORPHS, active = 0, auto = true, onActive, onState }) {
  const mount = useRef(null);
  const api = useRef({});
  const props = useRef({});
  props.current = { shells, auto, onActive, onState };
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const el = mount.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setStatus('error');
      props.current.onState?.('error');
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.setAttribute('aria-label', '3D view of the patch worn on the temple. Drag to turn, scroll or pinch to zoom.');
    renderer.domElement.setAttribute('role', 'img');
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);

    // Studio rig: warm key, brass rim from behind, cool fill.
    const key = new THREE.DirectionalLight('#ffe7cf', 2.4);
    key.position.set(-3, 4, 5);
    const rim = new THREE.DirectionalLight('#e2b168', 4);
    rim.position.set(4, 2, -5);
    const fill = new THREE.DirectionalLight('#8fb2ff', 0.5);
    fill.position.set(-5, -1, 1);
    // Lights follow the camera so the face is always lit like a product shot.
    const rig = new THREE.Group();
    rig.add(key, rim, fill);
    scene.add(rig, camera, new THREE.HemisphereLight('#c9d6ff', '#140c08', 0.25));
    const glow = new THREE.PointLight('#ff2a4b', 0, 0.35, 2);
    scene.add(glow);

    // Three-quarter start, looking at the subject's right temple.
    const baseDist = () => 2.15 * Math.max(1, 0.95 / camera.aspect);
    camera.position.set(-Math.sin(0.9) * 2.15, 0.22, Math.cos(0.9) * 2.15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.7;
    controls.minPolarAngle = Math.PI * 0.32;
    controls.maxPolarAngle = Math.PI * 0.62;
    controls.autoRotateSpeed = -1.8;
    // Auto-turn pauses while the user drags and resumes 2.5 s after they let go.
    let resumeTimer = 0;
    let paused = false;
    controls.addEventListener('start', () => {
      paused = true;
      clearTimeout(resumeTimer);
    });
    controls.addEventListener('end', () => {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        paused = false;
      }, 2500);
    });

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const d = baseDist();
      controls.minDistance = d * 0.62;
      controls.maxDistance = d * 1.35;
      const off = camera.position.clone().sub(TARGET).setLength(d);
      camera.position.copy(TARGET).add(off);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let head = null;
    let decal = null;
    let temple = null;
    let idx = -1;
    let morphStart = 0;
    let hidden = false;
    let raf = 0;
    let disposed = false;
    const cache = new Map();
    const textureFor = (s) => {
      const k = `${s.color}|${s.shape.d}|${s.shape.mode}`;
      if (!cache.has(k)) cache.set(k, shellTexture(s));
      return cache.get(k);
    };

    const apply = (i) => {
      const list = props.current.shells;
      const s = list[((i % list.length) + list.length) % list.length];
      idx = i;
      if (!decal) return;
      const tex = textureFor(s);
      decal.material.map = tex;
      decal.material.emissiveMap = tex;
      decal.material.emissive.set(s.color);
      decal.material.needsUpdate = true;
      glow.color.set(s.color);
      morphStart = performance.now();
    };
    api.current.apply = apply;
    api.current.current = () => idx;

    const tl = new THREE.TextureLoader();
    const load = (url) => new Promise((res, rej) => tl.load(url, res, undefined, rej));
    Promise.all([
      new Promise((res, rej) => new GLTFLoader().load(MODEL_URL, res, undefined, rej)),
      load(`${ASSET}Map-COL.jpg`),
      load(`${ASSET}Infinite-Level_02_Tangent_SmoothUV.jpg`),
    ])
      .then(([gltf, col, nrm]) => {
        if (disposed) return;
        col.colorSpace = THREE.SRGBColorSpace;
        head = gltf.scene.getObjectByProperty('type', 'Mesh');
        head.material = new THREE.MeshPhysicalMaterial({
          map: col,
          normalMap: nrm,
          normalScale: new THREE.Vector2(0.8, 0.8),
          roughness: 0.52,
          metalness: 0,
          sheen: 0.4,
          sheenRoughness: 0.6,
          sheenColor: new THREE.Color('#ffd7c2'),
          envMapIntensity: 0.35,
        });
        head.geometry.computeBoundingBox();
        const box = head.geometry.boundingBox;
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        head.geometry.translate(-center.x, -center.y, -center.z);
        head.scale.setScalar(1 / size.y);
        head.position.set(0, 0, 0);
        head.rotation.set(0, 0, 0);
        scene.add(head);
        head.updateMatrixWorld(true);

        // Find the temple on the scan: measure the head front-to-back at brow height, go 12%
        // back from the forehead, then cast in from the subject's right side.
        const ray = new THREE.Raycaster();
        const cast = (o, d) => {
          ray.set(o, d.normalize());
          return ray.intersectObject(head, false)[0];
        };
        const browY = 0.255;
        const front = cast(new THREE.Vector3(0, browY, 3), new THREE.Vector3(0, 0, -1));
        const back = cast(new THREE.Vector3(0, browY, -3), new THREE.Vector3(0, 0, 1));
        const zT = front && back ? front.point.z - (front.point.z - back.point.z) * 0.12 : 0.1;
        const hit = cast(new THREE.Vector3(-3, browY - 0.02, zT), new THREE.Vector3(1, 0, 0));
        if (hit) {
          const n = hit.face.normal.clone().transformDirection(head.matrixWorld);
          const helper = new THREE.Object3D();
          helper.position.copy(hit.point);
          helper.lookAt(hit.point.clone().add(n));
          helper.rotateZ(-0.25);
          temple = { point: hit.point.clone(), normal: n };
          const geo = new DecalGeometry(head, hit.point, helper.rotation, new THREE.Vector3(0.13, 0.13, 0.07));
          // Centre the decal on the temple so it can grow out from that point when it morphs.
          geo.translate(-hit.point.x, -hit.point.y, -hit.point.z);
          decal = new THREE.Mesh(
            geo,
            new THREE.MeshPhysicalMaterial({
              transparent: true,
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -4,
              roughness: 0.18,
              metalness: 0.55,
              clearcoat: 1,
              clearcoatRoughness: 0.1,
              emissive: new THREE.Color('#ffffff'),
              emissiveIntensity: 0.55,
            }),
          );
          decal.position.copy(hit.point);
          scene.add(decal);
          glow.position.copy(hit.point.clone().add(n.clone().multiplyScalar(0.05)));
          apply(Math.max(0, api.current.pending ?? 0));
        }
        setStatus('ready');
        props.current.onState?.('ready');
      })
      .catch(() => {
        if (disposed) return;
        setStatus('error');
        props.current.onState?.('error');
      });

    const toCam = new THREE.Vector3();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      controls.autoRotate = props.current.auto && !paused;
      controls.update();
      rig.quaternion.copy(camera.quaternion);

      if (temple && decal) {
        toCam.copy(camera.position).sub(temple.point).normalize();
        const facing = temple.normal.dot(toCam);
        // Auto mode: fit the next shell while the temple is out of sight.
        if (props.current.auto) {
          if (facing < -0.25) hidden = true;
          if (hidden && facing > -0.05) {
            hidden = false;
            const next = (idx + 1) % props.current.shells.length;
            apply(next);
            props.current.onActive?.(next);
          }
        } else hidden = false;
        // Morph: the shell grows out from the temple with a brief flash.
        const t = Math.min(1, (now - morphStart) / 650);
        decal.scale.setScalar(0.35 + 0.65 * easeOutBack(t));
        decal.material.opacity = Math.min(1, t * 2.2);
        decal.material.emissiveIntensity = 0.35 + Math.max(0, facing) * 0.35 + (1 - t) * 1.2 + Math.sin(now / 500) * 0.06;
        glow.intensity = Math.max(0, facing) * (0.12 + (1 - t) * 0.5);
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      ro.disconnect();
      controls.dispose();
      cache.forEach((tx) => tx.dispose());
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      });
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = {};
    };
  }, []);

  // A shell picked by the user (or changed by the parent) is fitted straight away.
  useEffect(() => {
    api.current.pending = active;
    if (api.current.current?.() !== active) api.current.apply?.(active);
  }, [active, shells]);

  return (
    <div ref={mount} className="relative h-full w-full cursor-grab active:cursor-grabbing [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full">
      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center" aria-live="polite">
          <span className="sr-only">Loading 3D model</span>
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
        </div>
      )}
    </div>
  );
}
