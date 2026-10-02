import { memo, useEffect, useRef } from 'react';
import { SCENES, grade } from '../footage/scenes.js';
import { subscribe } from '../footage/ticker.js';

/**
 * Looped, muted "first-person footage". Plays a real clip when `src` is given,
 * otherwise renders the model's procedural scene on a canvas.
 */
function Footage({ scene, variant = 0, src, paused = false, speed = 1, blur = 0, offset = 0, className = '' }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  // Depth-of-field blur is drawn into the canvas: CSS filters on elements inside a
  // 3D-transformed scene get clipped by Chrome's compositor.
  const blurRef = useRef(blur);
  blurRef.current = blur;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, speed]);

  useEffect(() => {
    if (src) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const draw = SCENES[scene];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let t = Math.abs(offset);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Out-of-focus tiles render the scene into a small offscreen canvas and scale it up:
    // a cheap optical blur that costs less than drawing at full size.
    const low = document.createElement('canvas');
    const lctx = low.getContext('2d');

    const unsubscribe = subscribe((dt) => {
      if (!pausedRef.current) t += dt * speedRef.current;
      if (!w || !h) return;
      const b = blurRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (b > 0.3) {
        const k = 1 / (1 + b * 0.9); // 6px blur → ~16% resolution
        const lw = Math.max(8, Math.round(w * k));
        const lh = Math.max(8, Math.round(h * k));
        if (low.width !== lw || low.height !== lh) {
          low.width = lw;
          low.height = lh;
        }
        lctx.setTransform(k, 0, 0, k, 0, 0);
        lctx.clearRect(0, 0, w, h);
        lctx.filter = 'saturate(45%) brightness(0.92)';
        draw(lctx, w, h, t, variant);
        lctx.filter = 'none';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(low, 0, 0, w, h);
      } else {
        // Muted grade keeps footage from competing with the interface.
        ctx.filter = 'saturate(45%) brightness(0.92)';
        draw(ctx, w, h, t, variant);
        ctx.filter = 'none';
      }
      grade(ctx, w, h);
    });

    return () => {
      unsubscribe();
      ro.disconnect();
    };
  }, [scene, variant, src, offset]);

  if (src) {
    return (
      <video
        ref={videoRef}
        src={src}
        className={`h-full w-full object-cover ${className}`}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
    );
  }
  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} aria-hidden="true" />;
}

export default memo(Footage);
