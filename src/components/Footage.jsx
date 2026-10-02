import { memo, useEffect, useRef } from 'react';
import { SCENES, grade } from '../footage/scenes.js';
import { subscribe } from '../footage/ticker.js';

/**
 * Looped, muted "first-person footage". Plays a real clip when `src` is given,
 * otherwise renders the model's procedural scene on a canvas.
 */
function Footage({ scene, variant = 0, src, paused = false, speed = 1, offset = 0, className = '' }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const speedRef = useRef(speed);
  speedRef.current = speed;

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

    const unsubscribe = subscribe((dt) => {
      if (!pausedRef.current) t += dt * speedRef.current;
      if (!w || !h) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, t, variant);
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
