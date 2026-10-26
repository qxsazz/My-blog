import { normalizePostCategory } from '@/taxonomy';
export function initPostsBrowser(signal: AbortSignal) {
  const browser = document.querySelector<HTMLElement>('[data-post-browser]');
  if (browser) {
    const list = browser.querySelector<HTMLElement>('[data-post-list]')!;
    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-post-item]'));
    const items = Array.from(browser.querySelectorAll<HTMLElement>('[data-post-item]'));
    let tag = new URL(location.href).searchParams.get('tag') || '';
    let category = normalizePostCategory(new URL(location.href).searchParams.get('category') || '');
    let order = 'newest';

    function apply(updateUrl = false) {
      let count = 0;
      for (const item of items) {
        const tags: string[] = JSON.parse(item.dataset.tags || '[]');
        item.hidden = (!!tag && !tags.includes(tag)) || (!!category && item.dataset.category !== category);
        if (!item.hidden) count++;
      }
      const key = order === 'updated' ? 'updated' : 'date';
      [...rows].sort((a, b) => (Number(a.dataset[key]) - Number(b.dataset[key])) * (order === 'oldest' ? 1 : -1)).forEach(row => list.append(row));
      const total = browser!.querySelector('[data-post-count]');
      if (total) total.textContent = `共 ${count} 篇`;
      const empty = browser!.querySelector<HTMLElement>('[data-post-empty]');
      if (empty) empty.hidden = count !== 0;
      const current = browser!.querySelector<HTMLElement>('[data-current-tag]');
      if (current) { current.textContent = [category, tag ? `# ${tag}` : ''].filter(Boolean).join(' · '); current.hidden = !tag && !category; }
      document.querySelectorAll<HTMLElement>('[data-post-tag]').forEach(link => {
        const active = link.dataset.postTag === tag && !category;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
      browser!.querySelectorAll<HTMLElement>('[data-post-category]').forEach(link => {
        const active = link.dataset.postCategory === category;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
      if (updateUrl) {
        const url = new URL(location.href);
        if (tag) url.searchParams.set('tag', tag); else url.searchParams.delete('tag');
        if (category) url.searchParams.set('category', category); else url.searchParams.delete('category');
        history.replaceState(history.state, '', url);
      }
    }

    document.querySelectorAll<HTMLElement>('[data-post-tag]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); tag = link.dataset.postTag || ''; if (!tag) category = ''; apply(true);
      document.querySelector<HTMLDialogElement>('#tags-dialog')?.close();
    }));
    browser.querySelectorAll<HTMLElement>('[data-post-category]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); category = link.dataset.postCategory || ''; tag = ''; apply(true);
    }, { signal }));
    browser.querySelectorAll<HTMLButtonElement>('[data-post-sort]').forEach(button => button.addEventListener('click', () => {
      order = button.dataset.postSort || 'newest';
      browser.querySelectorAll<HTMLButtonElement>('[data-post-sort]').forEach(other => {
        const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active));
      });
      apply();
    }));
    window.addEventListener('popstate', () => { tag = new URL(location.href).searchParams.get('tag') || ''; category = normalizePostCategory(new URL(location.href).searchParams.get('category') || ''); apply(); }, { signal });
    apply();
  }
}
