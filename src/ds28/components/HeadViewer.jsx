import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { presetShape } from '../shapes.js';

/** Shells the showcase cycles through, one per turn of the head. */
export const MORPHS = [
  { shape: 'anger', color: '#ff2a4b', name: 'Anger Glyph', finish: 'Electro-Chromic Red' },
  { shape: 'bolt', color: '#00f0ff', name: 'Volt Bolt', finish: 'Cyber Cyan' },
  { shape: 'tear', color: '#ffb703', name: 'Teardrop', finish: 'Matte Gold' },
  { shape: 'hex', color: '#7d8ba3', name: 'Hex Mesh', finish: 'Stealth Slate' },
];

// Relative URLs resolve next to the page, both in dev (/ds28/head/…) and when published.
const ASSET = './head/';
const TURN_MS = 16000;

/** Draw a shell onto a canvas so it can be projected onto the skin as a decal texture. */
function shellTexture(morph) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const shape = presetShape(morph.shape);
  const path = new Path2D(shape.d);
  ctx.scale(size / 100, size / 100);
  const g = ctx.createLinearGradient(0, 0, 100, 100);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.28, morph.color);
  g.addColorStop(1, '#0b0f17');
  ctx.shadowColor = morph.color;
  ctx.shadowBlur = 6;
  if (shape.mode === 'stroke') {
    ctx.lineWidth = shape.strokeWidth ?? 9;
    ctx.lineCap = shape.cap ?? 'round';
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

/**
 * Photoreal head (Lee Perry-Smith scan, CC BY 3.0) lit in a studio rig. The shell is a decal
 * projected onto the temple, so it wraps the skin; it changes design each time it turns away.
 */
export default function HeadViewer({ onMorph, onState }) {
  const mount = useRef(null);
  const cb = useRef({ onMorph, onState });
  cb.current = { onMorph, onState };
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const el = mount.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setStatus('error');
      cb.current.onState?.('error');
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 1000);

    // Studio rig: warm key, brass rim from behind, cool fill.
    const key = new THREE.DirectionalLight('#ffe7cf', 2.4);
    key.position.set(-3, 4, 5);
    const rim = new THREE.DirectionalLight('#e2b168', 4);
    rim.position.set(4, 2, -5);
    const fill = new THREE.DirectionalLight('#8fb2ff', 0.5);
    fill.position.set(-5, -1, 1);
    scene.add(key, rim, fill, new THREE.HemisphereLight('#c9d6ff', '#140c08', 0.25));

    const pivot = new THREE.Group();
    scene.add(pivot);
    const glow = new THREE.PointLight('#ff2a4b', 0, 0.35, 2);
    pivot.add(glow);

    let head = null;
    let decal = null;
    let temple = null;
    let textures = [];
    let idx = 0;
    let hiddenSinceSwap = false;
    let raf = 0;
    let disposed = false;
    const drag = { on: false, x: 0, offset: 0, vel: 0 };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Pull back on narrow (portrait) viewports so the whole head stays in frame.
      camera.position.z = 2.15 * Math.max(1, 0.95 / camera.aspect);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const tl = new THREE.TextureLoader();
    const load = (url) => new Promise((res, rej) => tl.load(url, res, undefined, rej));

    Promise.all([
      new Promise((res, rej) => new GLTFLoader().load(`${ASSET}LeePerrySmith.glb`, res, undefined, rej)),
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

        // Centre and scale to a unit-height head.
        head.geometry.computeBoundingBox();
        const box = head.geometry.boundingBox;
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        head.geometry.translate(-center.x, -center.y, -center.z);
        const s = 1 / size.y;
        head.scale.setScalar(s);
        head.position.set(0, 0, 0);
        pivot.add(head);
        pivot.updateMatrixWorld(true);

        camera.position.set(0, 0.2, 2.15 * Math.max(1, 0.95 / camera.aspect));
        camera.lookAt(0, 0.16, 0);

        // Find the temple from the scan itself: measure the head's front and back at brow
        // height, go 30% of the way back from the forehead, then cast in from the side.
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
          textures = MORPHS.map(shellTexture);
          const geo = new DecalGeometry(head, hit.point, helper.rotation, new THREE.Vector3(0.13, 0.13, 0.07));
          decal = new THREE.Mesh(
            geo,
            new THREE.MeshPhysicalMaterial({
              map: textures[0],
              emissiveMap: textures[0],
              emissive: new THREE.Color(MORPHS[0].color),
              emissiveIntensity: 0.55,
              transparent: true,
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -4,
              roughness: 0.18,
              metalness: 0.55,
              clearcoat: 1,
              clearcoatRoughness: 0.1,
            }),
          );
          pivot.add(decal);
          glow.position.copy(hit.point.clone().add(n.clone().multiplyScalar(0.05)));
          glow.color.set(MORPHS[0].color);
        }
        setStatus('ready');
        cb.current.onState?.('ready');
      })
      .catch(() => {
        if (disposed) return;
        setStatus('error');
        cb.current.onState?.('error');
      });

    const t0 = performance.now();
    const v = new THREE.Vector3();
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (!drag.on) {
        drag.offset += drag.vel;
        drag.vel *= 0.94;
      }
      const t = (now - t0) * (reduce ? 0.3 : 1);
      // Start three-quarter, temple toward the viewer.
      pivot.rotation.y = -0.85 + (t / TURN_MS) * Math.PI * 2 + drag.offset;
      pivot.rotation.x = 0.04 + Math.sin(t / 4200) * 0.03;
      pivot.position.y = Math.sin(t / 3000) * 0.008;

      if (temple && decal) {
        v.copy(temple.normal).applyAxisAngle(new THREE.Vector3(0, 1, 0), pivot.rotation.y);
        const facing = v.z;
        if (facing < -0.6) hiddenSinceSwap = true;
        // Swap the design while it is out of sight, just before it turns back into view.
        if (hiddenSinceSwap && facing > -0.2) {
          hiddenSinceSwap = false;
          idx = (idx + 1) % MORPHS.length;
          decal.material.map = textures[idx];
          decal.material.emissiveMap = textures[idx];
          decal.material.emissive.set(MORPHS[idx].color);
          decal.material.needsUpdate = true;
          glow.color.set(MORPHS[idx].color);
          cb.current.onMorph?.(idx);
        }
        // Pulse the shell gently, brighter as it faces the camera.
        decal.material.emissiveIntensity = 0.35 + Math.max(0, facing) * 0.35 + Math.sin(t / 500) * 0.08;
        glow.intensity = Math.max(0, facing) * 0.12;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    const down = (e) => {
      drag.on = true;
      drag.x = e.clientX;
      drag.vel = 0;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!drag.on) return;
      const dx = (e.clientX - drag.x) * 0.008;
      drag.offset += dx;
      drag.vel = dx;
      drag.x = e.clientX;
    };
    const up = () => {
      drag.on = false;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      textures.forEach((tx) => tx.dispose());
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      });
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={mount} className="relative h-full w-full cursor-grab touch-pan-y active:cursor-grabbing [&>canvas]:h-full [&>canvas]:w-full" aria-hidden="true">
      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
        </div>
      )}
    </div>
  );
}
