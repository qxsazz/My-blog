interface SearchEntry {
  title: string; description: string; category: string; tags: string[];
  body?: string; date?: string; url: string; type: string;
}
interface SearchOptions {
  signal: AbortSignal;
  openModal: (dialog: HTMLDialogElement) => void;
  closeModal: (dialog: HTMLDialogElement) => void;
  closeNavigation: () => void;
}

// Keep query/content text out of innerHTML, including literal punctuation and markup.
function highlight(node: HTMLElement, value: string, query: string) {
  if (!query) { node.textContent = value; return; }
  const lower = value.toLocaleLowerCase();
  let start = 0;
  let match = lower.indexOf(query);
  while (match !== -1) {
    node.append(document.createTextNode(value.slice(start, match)));
    const mark = document.createElement('mark');
    mark.textContent = value.slice(match, match + query.length);
    node.append(mark);
    start = match + query.length;
    match = lower.indexOf(query, start);
  }
  node.append(document.createTextNode(value.slice(start)));
}
function plainText(body: string) {
  return body.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/^\s*>+\s?/gm, '')
    .replace(/[`*_~]/g, '').replace(/\s+/g, ' ').trim();
}
function excerpt(item: SearchEntry, query: string) {
  let text = item.description;
  const inTags = item.tags.some(tag => tag.toLocaleLowerCase().includes(query));
  if (query && !inTags && !text.toLocaleLowerCase().includes(query)) {
    const body = plainText(item.body || '');
    if (body.toLocaleLowerCase().includes(query)) text = body;
  }
  const at = query ? text.toLocaleLowerCase().indexOf(query) : -1;
  const start = at > 28 ? at - 28 : 0;
  const end = Math.min(text.length, Math.max(start + 90, at + query.length));
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

export function initSearch({ signal, openModal, closeModal, closeNavigation }: SearchOptions) {
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
  const input = document.querySelector<HTMLInputElement>('#search-input');
  const results = document.querySelector<HTMLElement>('#search-results');
  const summary = document.querySelector<HTMLElement>('#search-summary');
  if (!dialog || !input || !results) return;
  const desktop = matchMedia('(min-width:1024px)');
  const index: SearchEntry[] = JSON.parse(document.querySelector('#search-index')?.textContent || '[]');
  let links: HTMLAnchorElement[] = [];
  let active = -1;
  let composing = false;
  let compositionEnded = -Infinity;
  const isComposing = (event: KeyboardEvent) => event.isComposing || composing
    || (event.key === 'Enter' && performance.now() - compositionEnded < 30);

  function select(next: number, focus = false) {
    active = next;
    links.forEach((link, i) => link.classList.toggle('is-search-active', i === next));
    if (focus && links[next]) {
      links[next].focus({ preventScroll: true });
      links[next].scrollIntoView({ block: 'nearest' });
    }
  }
  function render() {
    const query = input!.value.trim().toLocaleLowerCase();
    const matches = query ? index.filter(item => `${item.title} ${item.description} ${item.category} ${item.tags.join(' ')} ${item.body || ''}`.toLocaleLowerCase().includes(query)) : [...index];
    results!.replaceChildren();
    links = []; active = -1;
    dialog!.classList.toggle('desktop-search', desktop.matches);
    results!.setAttribute('aria-live', desktop.matches ? 'off' : 'polite');
    if (summary) summary.textContent = desktop.matches ? (query ? `找到 ${matches.length} 篇内容` : '文稿与手记') : '搜索本站';
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'search-empty';
      empty.textContent = index.length ? '暂时没有找到相关内容。' : '暂无内容，文稿与手记将在这里被找到。';
      results!.append(empty); return;
    }
    // Mobile retains v28's ordering, copy and result structure.
    if (!desktop.matches) {
      for (const item of matches) {
        const link = document.createElement('a'); link.className = 'search-result'; link.href = item.url;
        const meta = document.createElement('small'); meta.textContent = `${item.type} · ${item.category}`;
        const title = document.createElement('h3'); title.textContent = item.title;
        const description = document.createElement('p'); description.textContent = item.description;
        link.append(meta, title, description); results!.append(link); links.push(link);
      }
      return;
    }
    const score = (item: SearchEntry) => !query ? 0 : (item.title.toLocaleLowerCase().includes(query) ? 8 : 0)
      + (item.tags.some(tag => tag.toLocaleLowerCase().includes(query)) ? 4 : 0)
      + (item.description.toLocaleLowerCase().includes(query) ? 2 : 0);
    matches.sort((a, b) => score(b) - score(a));
    const types = [...new Set(matches.map(item => item.type))];
    for (const [groupIndex, type] of types.entries()) {
      const items = matches.filter(item => item.type === type);
      const group = document.createElement('section'); group.className = 'search-group';
      const heading = document.createElement('h2'); heading.id = `search-group-${groupIndex}`;
      heading.className = 'search-group-title';
      const name = document.createElement('span'); name.textContent = type;
      const count = document.createElement('span'); count.textContent = String(items.length);
      heading.append(name, count); group.setAttribute('aria-labelledby', heading.id); group.append(heading);
      for (const item of items) {
        const link = document.createElement('a'); link.className = 'search-result'; link.href = item.url;
        const meta = document.createElement('small'); meta.className = 'search-result-meta';
        const category = document.createElement('span'); highlight(category, item.category, query); meta.append(category);
        if (query) for (const tag of item.tags.filter(tag => tag.toLocaleLowerCase().includes(query)).slice(0, 2)) {
          const badge = document.createElement('span'); badge.className = 'search-match-tag';
          badge.append(document.createTextNode('# ')); highlight(badge, tag, query); meta.append(badge);
        }
        if (item.date) {
          const date = document.createElement('time'); date.dateTime = item.date;
          date.textContent = item.date.slice(5, 10).replace('-', '.'); meta.append(date);
        }
        const title = document.createElement('h3'); highlight(title, item.title, query);
        const description = document.createElement('p'); highlight(description, excerpt(item, query), query);
        const enter = document.createElement('span'); enter.className = 'search-result-enter'; enter.textContent = '↵'; enter.setAttribute('aria-hidden', 'true');
        link.append(meta, title, description, enter); group.append(link); links.push(link);
      }
      results!.append(group);
    }
  }
  function open() {
    closeNavigation();
    if (desktop.matches) document.dispatchEvent(new Event('dominator:search-open'));
    openModal(dialog!); render(); input!.focus();
    if (desktop.matches) input!.select();
  }
  document.querySelectorAll('[data-search-open]').forEach(button => button.addEventListener('click', open, { signal }));
  document.querySelector('[data-search-close]')?.addEventListener('click', () => dialog.close(), { signal });
  dialog.addEventListener('close', () => closeModal(dialog), { signal });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }, { signal });
  input.addEventListener('input', render, { signal });
  input.addEventListener('compositionstart', () => { composing = true; }, { signal });
  input.addEventListener('compositionend', () => { composing = false; compositionEnded = performance.now(); }, { signal });
  input.addEventListener('keydown', event => {
    if (isComposing(event)) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); if (desktop.matches) select(0, true); else links[0]?.focus(); }
    if (event.key === 'Enter') { event.preventDefault(); links[desktop.matches && active >= 0 ? active : 0]?.click(); }
  }, { signal });
  results.addEventListener('keydown', event => {
    if (!desktop.matches || isComposing(event) || event.altKey || event.ctrlKey || event.metaKey) return;
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (at < 0) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); select((at + 1) % links.length, true); }
    if (event.key === 'ArrowUp') { event.preventDefault(); if (at === 0) { select(-1); input.focus(); } else select(at - 1, true); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); select(event.key === 'Home' ? 0 : links.length - 1, true); }
  }, { signal });
  results.addEventListener('focusin', event => {
    if (desktop.matches && event.target instanceof HTMLAnchorElement) select(links.indexOf(event.target));
  }, { signal });
  results.addEventListener('pointermove', event => {
    if (!desktop.matches || event.pointerType !== 'mouse') return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('.search-result');
    if (link) select(links.indexOf(link));
  }, { signal });
  results.addEventListener('pointerleave', () => { if (desktop.matches) select(links.indexOf(document.activeElement as HTMLAnchorElement)); }, { signal });
  document.addEventListener('keydown', event => {
    if (isComposing(event)) return;
    if (event.key === 'Escape' && dialog.open) { event.preventDefault(); dialog.close(); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (dialog.open) dialog.close(); else open(); }
  }, { signal });
  desktop.addEventListener('change', () => { if (dialog.open) { render(); input.focus(); } }, { signal });
}
