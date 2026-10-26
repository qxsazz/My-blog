/** Menu destinations are shareable filters, backed by the same published entries. */
export function initCollectionFilters() {
  const params = new URL(location.href).searchParams;
  const category = params.get('category') || '';
  const column = params.get('column') || '';
  const tag = params.get('tag') || '';
  const noteItems = Array.from(document.querySelectorAll<HTMLElement>('[data-note-item]'));
  if (noteItems.length && (category || tag || column)) {
    noteItems.forEach(item => { item.hidden = (!!column && item.dataset.noteColumn !== column) || (!!category && item.dataset.noteCategory !== category) || (!!tag && !JSON.parse(item.dataset.noteTags || '[]').includes(tag)); });
    document.querySelectorAll<HTMLElement>('.letter-year-group').forEach(group => {
      const visible = group.querySelectorAll('[data-note-item]:not([hidden])').length;
      group.hidden = visible === 0;
      const label = group.querySelector('.letter-year-heading > span'); if (label) label.textContent = `${visible} LETTERS`;
    });
    const divider = document.querySelector<HTMLElement>('.letters-divider'); if (divider) divider.hidden = !document.querySelector('.older-letter:not([hidden])');
    const state = document.querySelector<HTMLElement>('[data-note-filter]');
    if (state) { state.hidden = false; state.querySelector('span')!.textContent = [column && `专栏 · ${column}`, category && `分类 · ${category}`, tag && `标签 · ${tag}`].filter(Boolean).join(' / '); }
    const empty = document.querySelector<HTMLElement>('[data-note-empty]'); if (empty) empty.hidden = noteItems.some(item=>!item.hidden);
  }
  const requestedType = params.get('type') || '';
  const type = requestedType === 'thinking' ? 'notes' : requestedType;
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-timeline-type]'));
  if (rows.length && type) {
    rows.forEach(row => { row.hidden = row.dataset.timelineType !== type; });
    document.querySelectorAll<HTMLElement>('.timeline-month').forEach(month => { month.hidden = !month.querySelector('[data-timeline-type]:not([hidden])'); });
    document.querySelectorAll<HTMLElement>('.timeline-year-section').forEach(group => {
      const visible = group.querySelectorAll('[data-timeline-type]:not([hidden])').length;
      group.hidden = visible === 0;
      const count = group.querySelector('.timeline-year span'); if (count) count.textContent = `本年 ${visible} 篇`;
    });
    const visible = rows.filter(row=>!row.hidden).length;
    const count = document.querySelector('.timeline-total strong'); if (count) count.textContent = String(visible);
    const names: Record<string,string> = { posts:'文稿', notes:'手记' };
    const state = document.querySelector<HTMLElement>('[data-timeline-filter]'); if (state) { state.hidden = false; state.querySelector('span')!.textContent = `时光 · ${names[type] || type}`; }
    const empty = document.querySelector<HTMLElement>('[data-timeline-empty]'); if (empty) empty.hidden = visible > 0;
  }
}
