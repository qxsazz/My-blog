/** One reading model drives the TOC, ring, rail and mobile meter. */
export function initEditorialReading(signal: AbortSignal) {
  const article = document.querySelector<HTMLElement>('.editorial-reading');
  const body = article?.querySelector<HTMLElement>('.article-prose');
  if (!article || !body) return;
  const sheet = article.querySelector<HTMLElement>('.reading-sheet')!;
  const rail = document.querySelector<HTMLElement>('[data-reading-rail]');
  const percentages = document.querySelectorAll<HTMLElement>('[data-reading-progress]');
  const meter = article.querySelector<HTMLElement>('[data-reading-meter]');
  const ring = article.querySelector<SVGCircleElement>('[data-reading-ring]');
  const progressbar = article.querySelector<HTMLElement>('[data-reading-progressbar]');
  const topMeter = document.querySelector<HTMLElement>('[data-reading-top-meter]');
  const path = rail?.querySelector<SVGPathElement>('[data-reading-rail-path]');
  const curve = rail?.querySelector<SVGPathElement>('[data-reading-rail-curve]');
  const point = rail?.querySelector<SVGCircleElement>('[data-reading-rail-point]');
  const label = rail?.querySelector<HTMLElement>('[data-reading-rail-label]');
  const currentTitle = rail?.querySelector<HTMLElement>('[data-reading-current-title]');
  const headings = Array.from(body.querySelectorAll<HTMLElement>('h2[id],h3[id]'));
  const toc = article.querySelectorAll<HTMLAnchorElement>('.reading-outline nav a[href^="#"], .mobile-reading-tools nav a[href^="#"]');
  const stops = Array.from(rail?.querySelectorAll<HTMLAnchorElement>('[data-reading-rail-stop]') || []);
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
    positions = headings.map(h => ({ id: h.id, title: h.textContent?.trim() || '', top: scrollY + h.getBoundingClientRect().top }));
    stops.forEach(stop => {
      const heading = positions.find(h => h.id === stop.dataset.readingRailStop);
      if (heading) stop.style.top = `${(36 + clamp((heading.top - readingLine - start) / distance) * 488) / 560 * 100}%`;
    });
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
    stops.forEach(stop => stop.classList.toggle('active', stop.dataset.readingRailStop === current?.id));
    if (currentTitle) currentTitle.textContent = value === 100 ? '已读完' : current?.title || '正文开篇';
    const y = 36 + fraction * 488;
    const bend = `M12 ${y - 28} C12 ${y - 14} 22 ${y - 14} 22 ${y} C22 ${y + 14} 12 ${y + 14} 12 ${y + 28}`;
    path?.setAttribute('d', `M12 8 V${y - 28} ${bend.slice(bend.indexOf('C'))} V552`);
    curve?.setAttribute('d', bend);
    point?.setAttribute('cy', String(y));
    if (label) label.style.top = `${y / 560 * 100}%`;
    if (rail) rail.hidden = sheetBottom - scrollY < 100;
  }
  function schedule(measureAgain = false) {
    needsMeasure ||= measureAgain;
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; if (!signal.aborted) update(); });
  }
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
  signal.addEventListener('abort', () => { observer?.disconnect(); cancelAnimationFrame(frame); }, { once: true });
  update();
}
