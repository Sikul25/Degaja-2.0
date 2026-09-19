(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickColor() {
    const palette = [
      'rgba(184,138,50,ALPHA)',   // gold
      'rgba(103,185,223,ALPHA)',  // sky blue
      'rgba(255,255,255,ALPHA)'   // white
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function init() {
    if (document.getElementById('degajaEntropyCanvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'degajaEntropyCanvas';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let width, height, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // True per-visit entropy: count, positions, speeds, phases are never the same twice.
    const density = Math.min(70, Math.max(28, Math.floor((width * height) / 26000)));
    const particles = Array.from({ length: density }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: randomBetween(0.6, 2.6),
      vx: randomBetween(-0.12, 0.12),
      vy: randomBetween(-0.1, -0.02),
      baseAlpha: randomBetween(0.15, 0.55),
      twinkleSpeed: randomBetween(0.4, 1.6),
      phase: Math.random() * Math.PI * 2,
      color: pickColor()
    }));

    if (prefersReducedMotion) {
      // Draw a single static frame instead of animating.
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color.replace('ALPHA', p.baseAlpha.toFixed(2));
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    let t = 0;
    let raf = null;

    function frame() {
      ctx.clearRect(0, 0, width, height);
      t += 0.016;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }

        const twinkle = (Math.sin(t * p.twinkleSpeed + p.phase) + 1) / 2;
        const alpha = p.baseAlpha * (0.4 + twinkle * 0.6);

        ctx.beginPath();
        ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(2));
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    });

    raf = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
