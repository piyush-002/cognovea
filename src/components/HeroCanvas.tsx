'use client';

import { useEffect, useRef } from 'react';

type Node = { x: number; y: number; vx: number; vy: number; r: number; warm: boolean };

/**
 * Animated node network over the hero's static mesh artwork — data points that
 * connect as they drift, which is the argument the headline is making in words.
 *
 * Tuned for a light ground: stronger line alpha than a dark theme needs, or the
 * strokes disappear into the paper. Cheap on purpose — ~40 nodes, capped DPR,
 * paused when the tab is hidden or the hero scrolls away, and never started
 * under prefers-reduced-motion.
 */
export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let raf = 0;
    let running = true;

    const LINK = 168;
    // On navy the strokes need to be light, not dark. Cyan is rationed to a
    // handful of nodes so it stays an accent rather than a colour scheme.
    const VIOLET = '167, 139, 250';
    const BLUE = '96, 165, 250';
    const CYAN = '34, 211, 238';

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(16, Math.min(42, Math.round((width * height) / 28000)));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 1.4,
        warm: i % 8 === 0,
      }));
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > LINK) continue;

          const alpha = (1 - dist / LINK) * 0.3;
          const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, `rgba(${a.warm ? CYAN : VIOLET}, ${alpha})`);
          g.addColorStop(1, `rgba(${b.warm ? CYAN : BLUE}, ${alpha})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = `rgba(${n.warm ? CYAN : VIOLET}, 0.8)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running) raf = requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    resize();
    raf = requestAnimationFrame(draw);

    const onResize = () => resize();
    const onVisibility = () => (document.hidden ? stop() : start());
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(canvas);
    }

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" />;
}
