import { initPostsBrowser } from './posts-browser';
import { initNavigationMenus } from './navigation';
import { initCollectionFilters } from './collection-filters';
import { initPointerTrail } from './pointer-trail';
let cleanupPage = () => {};
function initPage() {
  cleanupPage();
  const controller = new AbortController();
  const { signal } = controller;
  const observers: IntersectionObserver[] = [];
  cleanupPage = () => { controller.abort(); observers.forEach(observer => observer.disconnect()); };
  initPostsBrowser(signal);
  initNavigationMenus(signal);
  initCollectionFilters();
  initPointerTrail(signal);
  // 小型交互独立于页面和内容；页面本身始终由 Astro 静态生成。
  const root = document.documentElement;
  const readPreference = (key: string, fallback: string) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const savePreference = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Storage can be disabled. */ } };
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let preference = readPreference('dominator-theme', 'dark');
  function setTheme(theme: string) {
    preference = theme;
    root.dataset.theme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
    savePreference('dominator-theme', theme);
    document.querySelectorAll<HTMLButtonElement>('[data-set-theme]').forEach(button => { const active = button.dataset.setTheme === theme; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    document.querySelector('[data-theme-toggle]')?.setAttribute('aria-label', root.dataset.theme === 'dark' ? '切换浅色主题' : '切换深色主题');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', root.dataset.theme === 'dark' ? '#050b18' : '#f2f7fd');
  }
  setTheme(preference);
  systemTheme.addEventListener('change', () => { if (preference === 'system') setTheme('system'); }, { signal });
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  document.querySelectorAll<HTMLButtonElement>('[data-set-theme]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.setTheme!)));
  const effectsButton = document.querySelector<HTMLButtonElement>('[data-effects-toggle]');
  function updateEffects() { if (effectsButton) { effectsButton.textContent = root.dataset.effects === 'off' ? '关' : '开'; effectsButton.setAttribute('aria-pressed', String(root.dataset.effects !== 'off')); } }
  updateEffects();
  effectsButton?.addEventListener('click', () => { root.dataset.effects = root.dataset.effects === 'off' ? 'on' : 'off'; savePreference('dominator-effects', root.dataset.effects); updateEffects(); });

  const menuToggle = document.querySelector<HTMLButtonElement>('.mobile-menu-toggle');
  const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');
  menuToggle?.addEventListener('click', () => { if (!mobileNav) return; mobileNav.hidden = !mobileNav.hidden; menuToggle.setAttribute('aria-expanded', String(!mobileNav.hidden)); menuToggle.setAttribute('aria-label', mobileNav.hidden ? '展开导航' : '收起导航'); });

  // Keep one modal open, preserve a stable return target, and lock root/body together.
  const returnTargets = new WeakMap<HTMLDialogElement, HTMLElement>();
  function openModal(modal: HTMLDialogElement) {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const owner = active?.closest('dialog');
    const target = owner ? returnTargets.get(owner) : active;
    document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(other => { if (other !== modal) other.close(); });
    if (target) returnTargets.set(modal, target);
    if (!modal.open) modal.showModal();
    document.body.style.overflow = 'hidden'; root.style.overflow = 'hidden';
  }
  function closeModal(modal: HTMLDialogElement) {
    if (document.querySelector('dialog[open]')) return;
    document.body.style.overflow = ''; root.style.overflow = '';
    const target = returnTargets.get(modal);
    if (target?.isConnected && target.getClientRects().length) target.focus({ preventScroll: true });
    else document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true });
  }

  // 原生 dialog 提供焦点约束与 Esc 关闭；所有搜索在本地完成。
  interface SearchEntry { title: string; description: string; category: string; tags: string[]; body: string; url: string; type: string }
  const searchIndex: SearchEntry[] = JSON.parse(document.querySelector('#search-index')?.textContent || '[]');
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
  const input = document.querySelector<HTMLInputElement>('#search-input');
  const results = document.querySelector<HTMLElement>('#search-results');
  function renderSearch() {
    if (!input || !results) return;
    const query = input.value.trim().toLocaleLowerCase();
    const matches = query ? searchIndex.filter(item => `${item.title} ${item.description} ${item.category} ${item.tags.join(' ')} ${item.body}`.toLocaleLowerCase().includes(query)) : searchIndex;
    results.replaceChildren();
    if (!matches.length) { const empty = document.createElement('p'); empty.className = 'search-empty'; empty.textContent = searchIndex.length ? '暂时没有找到相关内容。' : '暂无内容，文稿与手记将在这里被找到。'; results.append(empty); return; }
    matches.forEach(item => {
      const link = document.createElement('a'); link.className = 'search-result'; link.href = item.url;
      const meta = document.createElement('small'); meta.textContent = `${item.type} · ${item.category}`;
      const title = document.createElement('h3'); title.textContent = item.title;
      const description = document.createElement('p'); description.textContent = item.description;
      link.append(meta, title, description); results.append(link);
    });
  }
  function openSearch() { if (!dialog || !input) return; document.dispatchEvent(new Event('dominator:close-navigation')); if (mobileNav) mobileNav.hidden = true; menuToggle?.setAttribute('aria-expanded', 'false'); openModal(dialog); renderSearch(); input.focus(); }
  document.querySelectorAll('[data-search-open]').forEach(button => button.addEventListener('click', openSearch));
  document.querySelector('[data-search-close]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('close', () => closeModal(dialog));
  dialog?.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  input?.addEventListener('input', renderSearch);
  input?.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); results?.querySelector<HTMLAnchorElement>('a')?.focus(); } if (event.key === 'Enter') results?.querySelector<HTMLAnchorElement>('a')?.click(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog?.open) { event.preventDefault(); dialog.close(); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (dialog?.open) dialog.close(); else openSearch(); }
  }, { signal });

  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.category;
    document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(tab => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active)); });
    let count = 0;
    document.querySelectorAll<HTMLElement>('#filtered-entries .entry-row').forEach(row => { const text = row.querySelector('.entry-meta > span')?.textContent || ''; row.hidden = category !== '全部' && !text.endsWith(category!); if (!row.hidden) count++; });
    const label = document.querySelector('.listing-toolbar .small-label'); if (label) label.textContent = `共 ${count} 篇文稿`;
  }));

  const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-link]');
  copyButton?.addEventListener('click', async () => {
    const label = copyButton.querySelector('span');
    try { await navigator.clipboard.writeText(location.href); if (label) label.textContent = '已复制'; } catch { if (label) label.textContent = '请复制地址栏链接'; }
    setTimeout(() => { if (label) label.textContent = '复制链接'; }, 2200);
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(items => items.forEach(item => { if (item.isIntersecting) { item.target.classList.add('visible'); observer.unobserve(item.target); } }), { threshold: .08 });
    observers.push(observer);
    document.querySelectorAll('.reveal').forEach(element => { element.classList.add('ready'); observer.observe(element); });
  }
  const topButton = document.querySelector<HTMLButtonElement>('.back-to-top');
  if (topButton) {
    const update = () => { topButton.hidden = scrollY < 500; };
    window.addEventListener('scroll', update, { passive: true, signal }); update();
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' }));
  }
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>('.article-toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(items => { for (const item of items) if (item.isIntersecting) tocLinks.forEach(link => link.classList.toggle('active', link.hash === `#${item.target.id}`)); }, { rootMargin: '-100px 0px -65% 0px' });
    observers.push(observer);
    document.querySelectorAll('.article-prose :is(h2,h3)[id]').forEach(heading => observer.observe(heading));
  }

  document.querySelectorAll<HTMLElement>('[data-site-since]').forEach(element => {
    const start = Date.parse(`${element.dataset.siteSince}T00:00:00Z`);
    element.textContent = String(Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1));
  });

  for (const name of ['subscribe', 'tags']) {
    const modal = document.querySelector<HTMLDialogElement>(`#${name}-dialog`);
    document.querySelectorAll(`[data-${name}-open]`).forEach(button => button.addEventListener('click', () => { if (modal) openModal(modal); }));
    document.querySelector(`[data-${name}-close]`)?.addEventListener('click', () => modal?.close());
    modal?.addEventListener('close', () => closeModal(modal));
    modal?.addEventListener('click', event => { if (event.target !== modal) return; const box = modal.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) modal.close(); });
  }
  document.querySelector<HTMLButtonElement>('[data-copy-rss]')?.addEventListener('click', async event => {
    const button = event.currentTarget as HTMLButtonElement;
    try { await navigator.clipboard.writeText(new URL('/rss.xml', location.origin).href); button.textContent = '已复制'; } catch { button.textContent = '请打开上方链接，复制订阅地址'; }
  });
  document.querySelectorAll<HTMLButtonElement>('[data-timeline-density]').forEach(button => button.addEventListener('click', () => {
    const list = document.querySelector<HTMLElement>('[data-timeline-list]'); if (list) list.dataset.density = button.dataset.timelineDensity;
    document.querySelectorAll<HTMLButtonElement>('[data-timeline-density]').forEach(other => { const active = button === other; other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active)); });
  }));

  // 按访问者的本地日期计算年度进度，无需依赖每天重新构建。
  const today = new Date();
  const dayIndex = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(today.getFullYear(), 0, 0)) / 86400000);
  const yearLength = (Date.UTC(today.getFullYear()+1, 0, 1) - Date.UTC(today.getFullYear(), 0, 1)) / 86400000;
  const dayLabel = document.querySelector('[data-day-of-year]'); if (dayLabel) dayLabel.textContent = String(dayIndex);
  const yearProgress = document.querySelector('[data-year-progress]'); if (yearProgress) yearProgress.textContent = String(Math.floor(dayIndex / yearLength * 100));

  // Reading controls are local preferences, available with either page layout.
  let readingFont = readPreference('dominator-reading-font', document.querySelector<HTMLElement>('[data-default-font]')?.dataset.defaultFont || 'serif');
  const updateReadingFont = () => {
    root.dataset.readingFont = readingFont;
    document.querySelectorAll<HTMLButtonElement>('[data-reading-font]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.readingFont === readingFont)));
  };
  updateReadingFont();
  document.querySelectorAll<HTMLButtonElement>('[data-reading-font]').forEach(button => button.addEventListener('click', () => { readingFont = button.dataset.readingFont!; savePreference('dominator-reading-font', readingFont); updateReadingFont(); }));
  const progress = document.querySelector<HTMLElement>('[data-reading-progress]');
  const articleBody = document.querySelector<HTMLElement>('.article-prose');
  if (progress && articleBody) {
    const update = () => {
      const box = articleBody.getBoundingClientRect();
      const distance = Math.max(1, box.height - innerHeight * .55);
      const value = Math.round(Math.min(1, Math.max(0, (innerHeight * .25 - box.top) / distance)) * 100);
      progress.textContent = `${value}%`;
      progress.style.setProperty('--progress', `${value}%`);
    };
    window.addEventListener('scroll', update, { passive: true, signal });
    window.addEventListener('resize', update, { passive: true, signal }); update();
  }
  document.querySelectorAll<HTMLElement>('.article-prose pre').forEach(pre => {
    if (pre.closest('.code-block')) return;
    const block = document.createElement('div'); block.className = 'code-block';
    const toolbar = document.createElement('div'); toolbar.className = 'code-toolbar';
    const language = document.createElement('span'); language.textContent = pre.dataset.language || pre.querySelector('code')?.className.replace('language-', '') || 'CODE';
    const copy = document.createElement('button'); copy.dataset.copyCode = ''; copy.textContent = '复制代码'; copy.type = 'button';
    toolbar.append(language, copy); pre.replaceWith(block); block.append(toolbar, pre);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-copy-code]').forEach(button => button.addEventListener('click', async () => {
    const code = button.closest('.code-block')?.querySelector('code')?.textContent || '';
    try { await navigator.clipboard.writeText(code); button.textContent = '已复制'; } catch { button.textContent = '请选中代码复制'; }
    setTimeout(() => { button.textContent = '复制代码'; }, 2000);
  }));
  document.querySelectorAll<HTMLImageElement>('.article-prose img').forEach(img => {
    if (img.closest('figure')) return;
    const figure = document.createElement('figure');
    const paragraph = img.parentElement;
    if (paragraph?.tagName === 'P' && paragraph.childNodes.length === 1) paragraph.replaceWith(figure);
    else img.replaceWith(figure);
    figure.append(img);
    if (img.alt) { const caption = document.createElement('figcaption'); caption.textContent = img.alt; figure.append(caption); }
  });
}
document.addEventListener('astro:page-load', initPage);
document.addEventListener('astro:before-swap', () => cleanupPage());
