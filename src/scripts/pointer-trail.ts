/** Bounded particle pool, driven by real mouse movement; no animation loop. */
export function initPointerTrail(signal: AbortSignal) {
  const layer = document.querySelector<HTMLElement>('.stellar-pointer');
  if (!layer) return;
  const particles = Array.from(layer.querySelectorAll<HTMLElement>('.pointer-spark'));
  const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const root = document.documentElement;
  let index = 0;
  let lastAt = -Infinity;
  let lastX = -Infinity;
  let lastY = -Infinity;
  const clear = () => {
    particles.forEach(p => p.getAnimations().forEach(a => a.cancel()));
    lastAt = lastX = lastY = -Infinity;
  };
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !media.matches || root.dataset.effects === 'off' || document.hidden || document.querySelector('dialog[open], #main[inert]')) return;
    if (event.timeStamp - lastAt < 32 || Math.hypot(event.clientX - lastX, event.clientY - lastY) < 7) return;
    const particle = particles[index++ % particles.length];
    if (!particle) return;
    particle.getAnimations().forEach(a => a.cancel());
    const x = event.clientX - 2.5;
    const y = event.clientY - 2.5;
    const drift = index % 2 ? 5 : -5;
    particle.animate([
      { transform: `translate3d(${x}px,${y}px,0) scale(1)`, opacity: .7 },
      { transform: `translate3d(${x + drift}px,${y + 12}px,0) scale(.2)`, opacity: 0 },
    ], { duration: 650, easing: 'cubic-bezier(.2,.6,.4,1)' });
    lastAt = event.timeStamp;
    lastX = event.clientX;
    lastY = event.clientY;
  }, { passive: true, signal });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) clear(); }, { signal });
  document.addEventListener('visibilitychange', clear, { signal });
  document.addEventListener('astro:before-preparation', clear, { signal });
  media.addEventListener('change', clear, { signal });
  const observer = new MutationObserver(() => { if (root.dataset.effects === 'off') clear(); });
  observer.observe(root, { attributes: true, attributeFilter: ['data-effects'] });
  signal.addEventListener('abort', () => { observer.disconnect(); clear(); }, { once: true });
}
