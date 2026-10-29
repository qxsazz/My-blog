import { createDesktopCopy } from './desktop-copy';

interface ReaderOptions {
  signal: AbortSignal;
  openModal: (dialog: HTMLDialogElement) => void;
  closeModal: (dialog: HTMLDialogElement) => void;
}
interface ReadingPosition {
  version: string;
  fraction: number;
  headingId: string;
  headingTitle: string;
  sectionOffset: number;
  updatedAt: number;
}
const progressKey = 'dominator-reader-progress-v1';
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Reader preferences stay on this browser, scoped to the current article. */
export function initReaderExperience({ signal, openModal, closeModal }: ReaderOptions) {
  const article = document.querySelector<HTMLElement>('[data-reader-id]');
  const body = article?.querySelector<HTMLElement>('.article-prose');
  if (!article || !body) return;
  const desktop = matchMedia('(min-width:1024px)');
  const copy = createDesktopCopy(signal);
  let size = 'standard';
  try { if (localStorage.getItem('dominator-reader-size') === 'large') size = 'large'; } catch { /* Page-local preference still works. */ }
  function renderSize() {
    article!.dataset.readerSize = size;
    article!.querySelectorAll<HTMLButtonElement>('[data-reader-size]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.readerSize === size)));
  }
  article.querySelectorAll<HTMLButtonElement>('[data-reader-size]').forEach(button => button.addEventListener('click', () => {
    if (!desktop.matches) return;
    size = button.dataset.readerSize || 'standard';
    try { localStorage.setItem('dominator-reader-size', size); } catch { /* Storage can be disabled. */ }
    renderSize();
  }, { signal }));
  renderSize();

  // The initial TOC starts below the article title. Its available height grows
  // as it sticks to the header, while the floating player keeps a clear margin.
  const outline = article.querySelector<HTMLElement>('.reading-outline');
  const outlinePanel = outline?.querySelector<HTMLElement>('.reading-outline-expanded') || outline;
  let outlineFrame = 0;
  function fitOutline() {
    outlineFrame = 0;
    if (!outline || !outlinePanel || !desktop.matches) return;
    const available = Math.max(160, innerHeight - Math.max(110, outline.getBoundingClientRect().top) - 96);
    outlinePanel.style.setProperty('--reader-outline-height', `${Math.floor(available)}px`);
  }
  function scheduleOutline() { if (!outlineFrame) outlineFrame = requestAnimationFrame(fitOutline); }
  window.addEventListener('scroll', scheduleOutline, { passive:true, signal });
  window.addEventListener('resize', scheduleOutline, { passive:true, signal });
  document.fonts.ready.then(() => { if (!signal.aborted) fitOutline(); });
  signal.addEventListener('abort', () => cancelAnimationFrame(outlineFrame), { once:true });
  fitOutline();

  const headings = Array.from(body.querySelectorAll<HTMLElement>('h2[id],h3[id]'));
  headings.forEach(heading => {
    const title = heading.dataset.readerTitle || heading.textContent?.trim() || '章节';
    heading.dataset.readerTitle = title;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'reader-section-link reader-desktop-only';
    button.textContent = '#'; button.title = '复制章节链接';
    button.setAttribute('aria-label', `复制“${title}”章节链接`);
    heading.append(button);
    button.addEventListener('click', () => {
      if (!desktop.matches) return;
      const url = new URL(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || location.pathname, location.origin);
      url.hash = heading.id;
      void copy(button, button, url.href, '请右键目录中的章节链接并复制', { success:'✓', failure:'!' });
    }, { signal });
  });

  body.querySelectorAll<HTMLElement>('.code-block').forEach((block, index) => {
    const pre = block.querySelector<HTMLPreElement>('pre');
    const code = pre?.querySelector('code');
    const toolbar = block.querySelector<HTMLElement>('.code-toolbar');
    if (!pre || !code || !toolbar) return;
    toolbar.querySelector('span')?.classList.add('reader-code-language');
    const filename = pre.dataset.filename || block.closest<HTMLElement>('[data-code-filename]')?.dataset.codeFilename;
    if (filename) {
      const label = document.createElement('span'); label.className = 'reader-code-filename reader-desktop-only'; label.textContent = filename;
      toolbar.prepend(label);
    }
    const lines = (code.textContent || '').replace(/\n$/, '').split('\n').length;
    if (lines <= 20) return;
    if (!pre.id) pre.id = `reader-code-${index + 1}`;
    const style = getComputedStyle(pre);
    const height = (parseFloat(style.lineHeight) || 22) * 16 + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    block.style.setProperty('--reader-code-height', `${Math.ceil(height)}px`);
    block.dataset.readerCodeCollapsed = 'true';
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'reader-code-toggle reader-desktop-only';
    toggle.setAttribute('aria-controls', pre.id); toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = `展开全部 ${lines} 行 ↓`;
    block.append(toggle);
    toggle.addEventListener('click', () => {
      if (!desktop.matches) return;
      const expanding = block.dataset.readerCodeCollapsed === 'true';
      const top = block.getBoundingClientRect().top;
      block.dataset.readerCodeCollapsed = String(!expanding);
      toggle.setAttribute('aria-expanded', String(expanding));
      toggle.textContent = expanding ? '收起代码 ↑' : `展开全部 ${lines} 行 ↓`;
      if (expanding) window.scrollBy({ top:block.getBoundingClientRect().top - top, behavior:'instant' });
      else if (top < 100) window.scrollTo({ top:scrollY + top - 120, behavior:'instant' });
    }, { signal });
  });

  // Use chapter-relative positions so a different font size does not lose the place.
  if (Number(article.dataset.readerMinutes) >= 5) {
    const id = article.dataset.readerId!;
    const version = article.dataset.readerVersion || '';
    const resume = article.querySelector<HTMLElement>('[data-reader-resume]');
    const label = resume?.querySelector<HTMLElement>('[data-reader-resume-label]');
    const readPositions = (): Record<string, ReadingPosition> => {
      try {
        const raw: unknown = JSON.parse(localStorage.getItem(progressKey) || '{}');
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
        const cutoff = Date.now() - 90 * 86400000;
        return Object.fromEntries(Object.entries(raw).filter(([, value]) => {
          const record = value as Partial<ReadingPosition> | null;
          return record && typeof record === 'object' && typeof record.version === 'string' && typeof record.headingId === 'string' && typeof record.headingTitle === 'string' && Number.isFinite(record.fraction) && record.fraction! >= .12 && record.fraction! < .95 && Number.isFinite(record.sectionOffset) && record.sectionOffset! >= 0 && record.sectionOffset! <= 1 && Number.isFinite(record.updatedAt) && record.updatedAt! >= cutoff;
        })) as Record<string, ReadingPosition>;
      } catch { return {}; }
    };
    function store(record?: ReadingPosition) {
      const positions = readPositions();
      if (record) positions[id] = record; else delete positions[id];
      const latest = Object.entries(positions).sort((a,b) => b[1].updatedAt-a[1].updatedAt).slice(0,30);
      try { localStorage.setItem(progressKey, JSON.stringify(Object.fromEntries(latest))); } catch { /* Do not interrupt reading when storage is unavailable. */ }
    }
    let previous: ReadingPosition | undefined = readPositions()[id];
    if (previous?.version !== version) previous = undefined;
    let offerConsumed = false;
    function renderResume() {
      if (!resume || !label) return;
      resume.hidden = !previous || offerConsumed || !!location.hash || !desktop.matches;
      if (previous) label.textContent = previous.headingTitle ? `上次读到「${previous.headingTitle}」` : `上次读到 ${Math.round(previous.fraction * 100)}%`;
    }
    renderResume();
    let engaged = false;
    let scrolled = false;
    let timer = 0;
    const readingLine = () => Math.min(160, Math.max(114, innerHeight * .18));
    const geometry = () => {
      const top = scrollY + body!.getBoundingClientRect().top;
      const end = top + body!.getBoundingClientRect().height;
      const point = scrollY + readingLine();
      return { top, end, point, fraction:clamp((point-top)/Math.max(1,end-top)) };
    };
    function savePosition() {
      clearTimeout(timer); timer = 0;
      if (!desktop.matches || !engaged || !scrolled || !body!.isConnected) return;
      const { top, end, point, fraction } = geometry();
      if (fraction >= .95) { store(); offerConsumed = true; renderResume(); return; }
      if (fraction < .12) return;
      const current = headings.filter(heading => scrollY + heading.getBoundingClientRect().top <= point + 1).at(-1);
      const start = current ? scrollY + current.getBoundingClientRect().top : top;
      const next = current ? headings[headings.indexOf(current)+1] : headings[0];
      const stop = next ? scrollY + next.getBoundingClientRect().top : end;
      store({ version, fraction, headingId:current?.id || '', headingTitle:current?.dataset.readerTitle || '', sectionOffset:clamp((point-start)/Math.max(1,stop-start)), updatedAt:Date.now() });
    }
    window.addEventListener('wheel', () => { if (!document.querySelector('dialog[open]')) engaged = true; }, { passive:true, signal });
    window.addEventListener('pointerdown', () => { if (!document.querySelector('dialog[open]')) engaged = true; }, { passive:true, signal });
    document.addEventListener('keydown', event => {
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key) && !document.querySelector('dialog[open]') && !(event.target instanceof HTMLElement && event.target.closest('input,textarea,[contenteditable="true"]'))) engaged = true;
    }, { signal });
    window.addEventListener('scroll', () => {
      if (!engaged || !desktop.matches) return;
      scrolled = true;
      if (!timer) timer = window.setTimeout(savePosition, 1800);
    }, { passive:true, signal });
    resume?.querySelector('[data-reader-resume-go]')?.addEventListener('click', () => {
      if (!previous || !desktop.matches) return;
      const { top, end } = geometry();
      const current = previous.headingId ? headings.find(heading => heading.id === previous!.headingId) : undefined;
      const index = current ? headings.indexOf(current) : -1;
      const next = headings[index+1];
      const start = current ? scrollY + current.getBoundingClientRect().top : top;
      const stop = next ? scrollY + next.getBoundingClientRect().top : end;
      const target = current || !previous.headingId ? start + (stop-start)*previous.sectionOffset : top+(end-top)*previous.fraction;
      offerConsumed = true; renderResume();
      // Hiding the offer changes body position; measure the final layout before jumping.
      const shift = geometry().top - top;
      window.scrollTo({ top:Math.max(0,target + shift - readingLine()), behavior:'instant' });
      engaged = true; scrolled = true;
      const focusTarget = current || body!;
      focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll:true });
    }, { signal });
    resume?.querySelector('[data-reader-resume-dismiss]')?.addEventListener('click', () => {
      previous = undefined; store(); renderResume();
      body!.tabIndex = -1; body!.focus({ preventScroll:true });
    }, { signal });
    window.addEventListener('pagehide', savePosition, { signal });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') savePosition(); }, { signal });
    desktop.addEventListener('change', renderResume, { signal });
    signal.addEventListener('abort', () => { savePosition(); clearTimeout(timer); }, { once:true });
  }

  const dialog = document.querySelector<HTMLDialogElement>('#reader-image-dialog');
  const viewer = dialog?.querySelector<HTMLImageElement>('[data-reader-image]');
  if (!dialog || !viewer) return;
  const photos = Array.from(body.querySelectorAll<HTMLImageElement>('img')).filter(img => !img.closest('a,button'));
  const previousButton = dialog.querySelector<HTMLButtonElement>('[data-reader-image-prev]')!;
  const nextButton = dialog.querySelector<HTMLButtonElement>('[data-reader-image-next]')!;
  let selected = 0;
  function showPhoto(index: number) {
    selected = clamp(index, 0, photos.length-1);
    const image = photos[selected];
    if (!image) return;
    viewer!.src = image.dataset.fullSrc || image.currentSrc || image.src;
    viewer!.alt = image.alt;
    dialog!.querySelector<HTMLElement>('[data-reader-image-caption]')!.textContent = image.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
    dialog!.querySelector<HTMLElement>('[data-reader-image-count]')!.textContent = `${selected+1} / ${photos.length}`;
    previousButton.disabled = selected === 0; nextButton.disabled = selected === photos.length-1;
  }
  const triggers = photos.map((image,index) => {
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'reader-image-trigger';
    trigger.setAttribute('aria-label', `放大图片：${image.alt || `第 ${index+1} 张`}`);
    trigger.setAttribute('aria-haspopup','dialog');
    trigger.addEventListener('click', () => {
      if (!desktop.matches) return;
      trigger.focus({ preventScroll:true }); showPhoto(index); openModal(dialog);
    }, { signal });
    return trigger;
  });
  function syncImages() {
    photos.forEach((image,index) => {
      const trigger = triggers[index];
      if (desktop.matches && !trigger.isConnected) { image.replaceWith(trigger); trigger.append(image); }
      else if (!desktop.matches && trigger.isConnected) trigger.replaceWith(image);
    });
    if (!desktop.matches && dialog!.open) dialog!.close();
  }
  syncImages();
  desktop.addEventListener('change', syncImages, { signal });
  dialog.querySelector('[data-reader-image-close]')?.addEventListener('click', () => dialog.close(), { signal });
  previousButton.addEventListener('click', () => showPhoto(selected-1), { signal });
  nextButton.addEventListener('click', () => showPhoto(selected+1), { signal });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); showPhoto(selected+(event.key === 'ArrowLeft' ? -1 : 1));
  }, { signal });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }, { signal });
  dialog.addEventListener('close', () => { viewer.removeAttribute('src'); closeModal(dialog); }, { signal });
  signal.addEventListener('abort', () => { if (dialog.open) { dialog.close(); closeModal(dialog); } }, { once:true });
}
