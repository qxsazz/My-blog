/** Bounded pools for mouse trails and click bursts; no animation loop. */
export function initPointerTrail(signal: AbortSignal) {
  const layer = document.querySelector<HTMLElement>('.stellar-pointer');
  if (!layer) return;
  const particles = Array.from(layer.querySelectorAll<HTMLElement>('.pointer-spark'));
  const bursts = Array.from(layer.querySelectorAll<HTMLElement>('.pointer-burst'));
  let burstIndex = 0;
  const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const root = document.documentElement;
  let index = 0;
  let lastAt = -Infinity;
  let lastX = -Infinity;
  let lastY = -Infinity;
  const clear = () => {
    layer.getAnimations({ subtree: true }).forEach(a => a.cancel());
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
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !media.matches || root.dataset.effects === 'off' || document.hidden || document.querySelector('dialog[open], #main[inert]')) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const burst = bursts[burstIndex++ % bursts.length];
    if (!burst) return;
    burst.getAnimations({ subtree: true }).forEach(a => a.cancel());
    burst.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
    burst.querySelector('.click-ring')?.animate([
      { transform: 'scale(.35)', opacity: .65 },
      { transform: 'scale(2.8)', opacity: 0 },
    ], { duration: 520, easing: 'cubic-bezier(.15,.65,.3,1)' });
    burst.querySelectorAll('.click-shard').forEach((shard, i) => {
      const angle = i * Math.PI / 4 + burstIndex * .3;
      const radius = i % 2 ? 24 : 34;
      shard.animate([
        { transform: `translate3d(${Math.cos(angle) * 4}px,${Math.sin(angle) * 4}px,0) rotate(${i * 45}deg) scale(.7)`, opacity: .85 },
        { transform: `translate3d(${Math.cos(angle) * radius}px,${Math.sin(angle) * radius}px,0) rotate(${i * 45 + 65}deg) scale(.15)`, opacity: 0 },
      ], { duration: 580 + i % 3 * 40, easing: 'cubic-bezier(.15,.65,.3,1)' });
    });
  }, { passive: true, signal });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) clear(); }, { signal });
  document.addEventListener('visibilitychange', clear, { signal });
  document.addEventListener('astro:before-preparation', clear, { signal });
  media.addEventListener('change', clear, { signal });
  const observer = new MutationObserver(() => { if (root.dataset.effects === 'off') clear(); });
  observer.observe(root, { attributes: true, attributeFilter: ['data-effects'] });
  signal.addEventListener('abort', () => { observer.disconnect(); clear(); }, { once: true });
}
