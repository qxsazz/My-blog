/** One reading model drives the TOC, star orbit and mobile meter. */
export function initEditorialReading(signal: AbortSignal) {
  const article = document.querySelector<HTMLElement>('.editorial-reading, .note-reading');
  const body = article?.querySelector<HTMLElement>('.article-prose');
  if (!article || !body) return;
  const sheet = article.querySelector<HTMLElement>('.reading-sheet')!;
  const rail = document.querySelector<HTMLElement>('[data-reading-rail]');
  const percentages = document.querySelectorAll<HTMLElement>('[data-reading-progress]');
  const meter = article.querySelector<HTMLElement>('[data-reading-meter]');
  const ring = article.querySelector<SVGCircleElement>('[data-reading-ring]');
  const progressbar = article.querySelector<HTMLElement>('[data-reading-progressbar]');
  const topMeter = document.querySelector<HTMLElement>('[data-reading-top-meter]');
  const orbit = rail?.querySelector<SVGCircleElement>('[data-reading-orbit]');
  const orbitStatus = rail?.querySelector<HTMLElement>('[data-reading-orbit-status]');
  const currentTitle = rail?.querySelector<HTMLElement>('[data-reading-current-title]');
  const headings = Array.from(body.querySelectorAll<HTMLElement>('h2[id],h3[id]'));
  const toc = article.querySelectorAll<HTMLAnchorElement>('.reading-outline nav a[href^="#"], .mobile-reading-tools nav a[href^="#"]');
  const guide = article.querySelector<HTMLElement>('[data-reading-guide]');
  const expanded = guide?.querySelector<HTMLElement>('[data-reading-outline-expanded]');
  const toggle = guide?.querySelector<HTMLButtonElement>('[data-reading-guide-toggle]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visualFraction = 0;
  let targetFraction = 0;
  let railFrame = 0;
  let railFrom = 0;
  let railStarted = 0;
  let railInitialized = false;
  let guideActive = false;
  let pointerInside = false;
  let manualOpen = false;
  let keyboardMode = false;
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  let frame = 0;
  let needsMeasure = true;
  let start = 0;
  let distance = 1;
  let readingLine = 145;
  let sheetBottom = 0;
  let positions: { id: string; title: string; top: number }[] = [];
  let lastValue = -1;
  function measure() {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = parseFloat(getComputedStyle(headings[0] || body!).scrollMarginTop) || 0;
    readingLine = Math.max(64, Math.min(innerHeight * .35, padding + margin));
    const box = body!.getBoundingClientRect();
    const bodyTop = scrollY + box.top;
    start = bodyTop - readingLine;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const end = Math.min(bodyTop + box.height - readingLine, maxScroll);
    distance = Math.max(1, end - start);
    sheetBottom = scrollY + sheet.getBoundingClientRect().bottom;
    positions = headings.length ? headings.map(h => ({ id: h.id, title: h.textContent?.trim() || '', top: scrollY + h.getBoundingClientRect().top })) : [{ id: body!.id, title: article!.querySelector('h1')?.textContent?.trim() || '正文', top: bodyTop }];
    needsMeasure = false;
  }
  function update() {
    // Route transitions and restored scroll positions can move the body without resizing it.
    if (!needsMeasure && Math.abs(scrollY + body!.getBoundingClientRect().top - readingLine - start) > .5) needsMeasure = true;
    if (needsMeasure) measure();
    const fraction = clamp((scrollY - start) / distance);
    const value = Math.round(fraction * 100);
    if (value !== lastValue) {
      percentages.forEach(el => { el.textContent = `${value}%`; });
      meter?.style.setProperty('--progress', `${value}%`);
      progressbar?.setAttribute('aria-valuenow', String(value));
      orbitStatus?.setAttribute('aria-valuenow', String(value));
      lastValue = value;
    }
    article!.style.setProperty('--reading-fraction', String(fraction));
    ring?.style.setProperty('stroke-dashoffset', String(100 - fraction * 100));
    topMeter?.style.setProperty('--reading-fraction', String(fraction));
    const current = positions.filter(h => h.top <= scrollY + readingLine + 1).at(-1);
    toc.forEach(link => {
      const active = decodeURIComponent(link.hash) === `#${current?.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (currentTitle) currentTitle.textContent = value === 100 ? '已读完' : current?.title || '正文开篇';
    guideActive = scrollY > Math.max(24, start * .35);
    syncGuide();
    moveRail(fraction);
  }
  function drawRail(fraction: number) {
    orbit?.style.setProperty('stroke-dashoffset', String(100 - fraction * 100));
  }
  function settleRail() {
    cancelAnimationFrame(railFrame);
    railFrame = 0;
    visualFraction = targetFraction;
    drawRail(visualFraction);
  }
  function animateRail(now: number) {
    railFrame = 0;
    if (signal.aborted) return;
    if (reducedMotion.matches || rail?.hidden) { settleRail(); return; }
    const time = Math.min(1, (now - railStarted) / 560);
    visualFraction = railFrom + (targetFraction - railFrom) * (1 - (1 - time) ** 3);
    drawRail(visualFraction);
    if (time < 1) railFrame = requestAnimationFrame(animateRail);
  }
  function moveRail(fraction: number) {
    if (!rail) return;
    if (!railInitialized || reducedMotion.matches || rail?.hidden) {
      targetFraction = fraction;
      railInitialized = true;
      settleRail();
      return;
    }
    if (Math.abs(targetFraction - fraction) < .00001) return;
    targetFraction = fraction;
    railFrom = visualFraction;
    railStarted = performance.now();
    if (!railFrame) railFrame = requestAnimationFrame(animateRail);
  }
  function syncGuide() {
    if (!guide || !expanded || !rail) return;
    const keyboardFocus = keyboardMode && expanded.contains(document.activeElement);
    const compact = innerWidth > 800 && guideActive && !pointerInside && !manualOpen && !keyboardFocus;
    guide.dataset.guideCompact = String(compact);
    expanded.inert = compact;
    expanded.setAttribute('aria-hidden', String(compact));
    rail.hidden = !compact || sheetBottom - scrollY < 100;
    rail.inert = rail.hidden;
    if (rail.hidden) settleRail();
    toggle?.setAttribute('aria-expanded', String(!compact));
  }
  function openGuide(slug?: string) {
    manualOpen = true;
    syncGuide();
    const links = Array.from(expanded?.querySelectorAll<HTMLAnchorElement>('nav a') || []);
    (links.find(a => decodeURIComponent(a.hash) === `#${slug}`) || links[0])?.focus({ preventScroll: true });
  }
  guide?.addEventListener('pointerenter', () => {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => { pointerInside = true; syncGuide(); }, 260);
  }, { signal });
  guide?.addEventListener('pointerleave', () => {
    clearTimeout(hoverTimer);
    pointerInside = false;
    manualOpen = false;
    syncGuide();
  }, { signal });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') keyboardMode = true; }, { signal });
  document.addEventListener('pointerdown', () => { keyboardMode = false; }, { passive: true, signal });
  rail?.addEventListener('focusin', event => {
    if (!keyboardMode) return;
    const target = event.target as HTMLElement;
    openGuide(target.dataset.readingRailStop);
  }, { signal });
  toggle?.addEventListener('click', () => openGuide(), { signal });
  guide?.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    pointerInside = manualOpen = keyboardMode = false;
    article!.querySelector<HTMLAnchorElement>('.article-back')?.focus({ preventScroll: true });
    syncGuide();
  }, { signal });
  guide?.addEventListener('focusout', () => queueMicrotask(() => {
    if (!signal.aborted && !guide.contains(document.activeElement)) { manualOpen = false; syncGuide(); }
  }), { signal });
  function schedule(measureAgain = false) {
    needsMeasure ||= measureAgain;
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; if (!signal.aborted) update(); });
  }
  reducedMotion.addEventListener('change', settleRail, { signal });
  window.addEventListener('scroll', () => schedule(), { passive: true, signal });
  window.addEventListener('resize', () => schedule(true), { passive: true, signal });
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => schedule(true)) : undefined;
  observer?.observe(body);
  observer?.observe(sheet);
  // The available scroll range also changes when the footer reflows.
  observer?.observe(document.documentElement);
  const main = article.closest('#main');
  main?.addEventListener('animationend', event => { if (event.target === main) schedule(true); }, { signal });
  document.fonts.ready.then(() => { if (!signal.aborted) schedule(true); });
  signal.addEventListener('abort', () => { observer?.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(railFrame); clearTimeout(hoverTimer); }, { once: true });
  update();
}
