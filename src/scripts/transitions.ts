// Astro owns navigation/history; the overlay reflects real preparation time.
let loaderTimer: ReturnType<typeof setTimeout>;
let recoveryTimer: ReturnType<typeof setTimeout>;
let destination: URL | undefined;
function finish() {
  clearTimeout(loaderTimer); clearTimeout(recoveryTimer);
  document.documentElement.classList.remove('route-pending', 'route-loading');
  document.querySelector('#main')?.removeAttribute('aria-busy');
  document.querySelector('#route-loader')?.setAttribute('aria-hidden', 'true');
}
document.addEventListener('astro:before-preparation', event => {
  finish();
  destination = (event as Event & { to: URL }).to;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
  document.querySelector<HTMLDetailsElement>('.more-menu')?.removeAttribute('open');
  document.documentElement.classList.add('route-pending');
  document.querySelector('#main')?.setAttribute('aria-busy', 'true');
  loaderTimer = setTimeout(() => {
    document.documentElement.classList.add('route-loading');
    document.querySelector('#route-loader')?.setAttribute('aria-hidden', 'false');
  }, 140);
  // A stalled fetch must not strand the visitor behind a loading screen.
  recoveryTimer = setTimeout(() => { finish(); if (destination) location.assign(destination.href); }, 12000);
});
document.addEventListener('astro:before-swap', event => {
  const next = (event as Event & { newDocument: Document }).newDocument.documentElement;
  next.dataset.theme = document.documentElement.dataset.theme;
  next.dataset.effects = document.documentElement.dataset.effects;
  next.dataset.readingFont = document.documentElement.dataset.readingFont || 'serif';
});
document.addEventListener('astro:page-load', () => {
  finish();
  const main = document.querySelector('#main');
  main?.classList.remove('route-enter');
  requestAnimationFrame(() => main?.classList.add('route-enter'));
});
window.addEventListener('pageshow', finish);
