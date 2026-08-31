'use client';

import { useEffect, useRef } from 'react';
import { DOTS } from '@/lib/mark-dots';

type P = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  r: number;
  c: string;
  al: number;
  ph: number;
  dr: number;
  dl: number;
};

/**
 * The Cognovea mark at hero scale, with its own animation: the points start
 * scattered and resolve into the C, then drift gently, and the cursor parts the
 * swarm as it passes through.
 *
 * Ported from the live cognovea.com page. Changes made deliberately:
 *   - pauses when scrolled out of view as well as when the tab is hidden
 *   - every listener and frame is torn down on unmount (this is a route now,
 *     not a single static page, so leaks would accumulate on navigation)
 *   - reduced motion paints the resolved mark once and never animates
 *
 * Math.random is fine here: this is a Client Component and the canvas contents
 * are never server-rendered, so there is nothing to mismatch.
 */
export default function MarkCanvas({ label }: { label: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let pts: P[] = [];
    let S = 0;
    let t0 = 0;
    let raf: number | null = null;
    let visible = true;
    const pointer = { x: -9999, y: -9999, on: false };

    /**
     * The hero mark is the same artwork as the lockup, scaled up.
     *
     * It used to build its own scatter with the same generator the small mark
     * used — which meant the hero was a lookalike too, and a different one on
     * every load. The dots now come from the traced logo, so the hero, the nav
     * and the favicon are one object at three sizes.
     *
     * What stays random is only motion: where each dot flies in from, its drift
     * phase and amplitude. Math.random is safe for that here — this is a Client
     * Component and the canvas is never server-rendered, so there is nothing to
     * mismatch.
     */
    function build(size: number): P[] {
      const k = size / 100; // the traced dots live in a 100x100 box
      return DOTS.map((d) => ({
        tx: d.x * k,
        ty: d.y * k,
        x: size / 2 + (Math.random() - 0.5) * size * 1.5,
        y: size / 2 + (Math.random() - 0.5) * size * 1.5,
        r: d.r * k,
        c: d.c,
        // The artwork carries its own weighting in dot size and colour; a second
        // opacity ramp on top of it only muddies the mark.
        al: 1,
        ph: Math.random() * Math.PI * 2,
        dr: 0.5 + Math.random() * 1.1,
        dl: Math.random() * 0.36,
      }));
    }

    function paint(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, S, S);
      for (const p of pts) {
        let px = p.x;
        let py = p.y;
        if (!still) {
          // Idle drift keeps the swarm alive without wobbling the letterform.
          px += Math.sin(now / 1750 + p.ph) * p.dr;
          py += Math.cos(now / 2050 + p.ph) * p.dr;
        }
        ctx.globalAlpha = p.al;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      const e = (now - t0) / 1000;
      for (const p of pts) {
        let g = Math.max(0, Math.min(1, (e - p.dl) / 1.5));
        g = 1 - Math.pow(1 - g, 3.2); // ease-out cubic: settles, never bounces

        let gx = p.tx;
        let gy = p.ty;

        if (pointer.on) {
          const dx = p.tx - pointer.x;
          const dy = p.ty - pointer.y;
          const d2 = dx * dx + dy * dy;
          const R = 118;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = (1 - d / R) * 30;
            gx += (dx / d) * push;
            gy += (dy / d) * push;
          }
        }

        if (g < 1) {
          p.x += (gx - p.x) * 0.055 + (gx - p.x) * g * 0.02;
          p.y += (gy - p.y) * 0.055 + (gy - p.y) * g * 0.02;
        } else {
          p.x += (gx - p.x) * 0.1;
          p.y += (gy - p.y) * 0.1;
        }
      }
      paint(now);
      raf = requestAnimationFrame(frame);
    }

    function fit() {
      if (!cv || !ctx) return;
      const box = cv.getBoundingClientRect();
      if (!box.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = box.width;
      cv.width = Math.round(S * dpr);
      cv.height = Math.round(S * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = build(S);
      if (still) {
        pts.forEach((p) => {
          p.x = p.tx;
          p.y = p.ty;
        });
        paint(0);
      } else {
        t0 = performance.now();
      }
    }

    function start() {
      if (still || raf !== null || !visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    }

    // The canvas rect, cached. getBoundingClientRect forces layout, and calling
    // it inside a mousemove handler does that at whatever rate the mouse
    // reports, which on a 120Hz trackpad is a synchronous layout every 8ms
    // while the pointer is anywhere near the hero. The rect only moves when the
    // page scrolls or resizes, so it is measured then instead.
    let rect: DOMRect | null = null;
    const remeasure = () => {
      rect = cv ? cv.getBoundingClientRect() : null;
    };

    function track(e: MouseEvent) {
      if (!cv) return;
      if (!rect) remeasure();
      const b = rect;
      if (!b) return;
      const x = e.clientX - b.left;
      const y = e.clientY - b.top;
      pointer.on = x > -70 && y > -70 && x < b.width + 70 && y < b.height + 70;
      if (pointer.on) {
        pointer.x = x;
        pointer.y = y;
      }
    }

    fit();
    remeasure();
    start();

    // Scroll and resize are the only things that move the canvas on the page.
    const invalidate = () => {
      rect = null;
    };
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);

    let rt: number | undefined;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(fit, 140);
    };
    const onVis = () => (document.hidden ? stop() : start());
    const onLeave = () => (pointer.on = false);

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);

    const fine = window.matchMedia('(pointer:fine)').matches;
    if (!still && fine) {
      window.addEventListener('mousemove', track, { passive: true });
      window.addEventListener('mouseleave', onLeave);
    }

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          visible ? start() : stop();
        },
        { threshold: 0 },
      );
      io.observe(cv);
    }

    return () => {
      stop();
      window.clearTimeout(rt);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('mousemove', track);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
      io?.disconnect();
    };
  }, []);

  return <canvas className="mark-canvas" ref={ref} role="img" aria-label={label} />;
}
