/** Native links navigate; separate toggles and ArrowDown expose their preview. */
export function initNavigationMenus(signal: AbortSignal) {
  const nav = document.querySelector<HTMLElement>('.desktop-nav');
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-item]'));
  let current: HTMLElement | undefined;
  let closeTimer: ReturnType<typeof setTimeout>;
  const mobile = document.querySelector<HTMLElement>('#mobile-nav');
  const mobileToggle = document.querySelector<HTMLButtonElement>('.mobile-menu-toggle');
  const closeMobile = () => {
    if (mobile) mobile.hidden = true;
    mobileToggle?.setAttribute('aria-expanded', 'false');
    mobileToggle?.setAttribute('aria-label', '展开导航');
  };
  const close = (restoreFocus = false) => {
    clearTimeout(closeTimer);
    if (!current) return;
    const old = current;
    old.querySelector<HTMLElement>('.nav-panel')!.hidden = true;
    old.querySelectorAll('[aria-expanded]').forEach(trigger => trigger.setAttribute('aria-expanded','false'));
    old.querySelectorAll('[data-click-open]').forEach(button => button.removeAttribute('data-click-open'));
    current = undefined;
    if (restoreFocus) old.querySelector<HTMLElement>('[data-nav-trigger]')?.focus();
  };
  const position = () => {
    if (!current || !nav) return;
    const panel = current.querySelector<HTMLElement>('.nav-panel')!;
    const trigger = current.querySelector<HTMLElement>('[data-nav-trigger]')!;
    const box = trigger.getBoundingClientRect();
    const width = panel.getBoundingClientRect().width;
    const left = Math.min(Math.max(20,box.x+box.width/2-width/2),innerWidth-width-20);
    panel.style.left = `${left-nav.getBoundingClientRect().x}px`;
  };
  const open = (item: HTMLElement, focus = false) => {
    clearTimeout(closeTimer);
    if (current !== item) {
      close(); current = item;
      item.querySelector<HTMLElement>('.nav-panel')!.hidden = false;
      item.querySelectorAll('[aria-expanded]').forEach(trigger => trigger.setAttribute('aria-expanded','true'));
    }
    position();
    if (focus) item.querySelector<HTMLElement>('.nav-panel a, .nav-panel button')?.focus();
  };
  items.forEach(item => {
    item.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') open(item); }, { signal });
    item.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') closeTimer = setTimeout(() => {
        if (current === item && !item.contains(document.activeElement)) close();
      }, 180);
    }, { signal });
    item.addEventListener('focusout', event => { if (current===item && !item.contains(event.relatedTarget as Node)) close(); }, { signal });
    item.querySelectorAll<HTMLButtonElement>('[data-nav-toggle],button[data-nav-trigger]').forEach(button => button.addEventListener('click', () => {
      // Mouse hover has already opened the menu; clicking its toggle keeps it usable.
      if (current === item && button.getAttribute('data-click-open') === 'true') { button.removeAttribute('data-click-open'); close(); }
      else { open(item); button.setAttribute('data-click-open','true'); }
    }, { signal }));
    item.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' && (event.target as HTMLElement).matches('[data-nav-trigger],[data-nav-toggle]')) { event.preventDefault(); open(item,true); }
      if (event.key === 'Escape' && current === item) { event.preventDefault(); event.stopPropagation(); close(true); }
    }, { signal });
  });
  nav?.querySelector('[data-nav-plain]')?.addEventListener('pointerenter', () => close(), { signal });
  document.addEventListener('pointerdown', event => {
    const target = event.target as Node;
    if (current && !current.contains(target)) close();
    if (mobile && !mobile.hidden && !mobile.contains(target) && !mobileToggle?.contains(target)) closeMobile();
  }, { signal });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    close(true);
    if (mobile && !mobile.hidden) { closeMobile(); mobileToggle?.focus(); }
  }, { signal });
  document.addEventListener('dominator:close-navigation', () => { close(); closeMobile(); }, { signal });
  window.addEventListener('resize', () => { if (innerWidth < 1024) close(); else { closeMobile(); position(); } }, { signal });
  signal.addEventListener('abort', () => clearTimeout(closeTimer), { once: true });
}
