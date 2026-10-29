/** Small, route-scoped success states for the desktop's existing copy controls. */
export function createDesktopCopy(signal: AbortSignal) {
  type Snapshot = { target: HTMLElement; text: string; title: string | null; path?: SVGPathElement; pathData?: string | null };
  const snapshots = new Map<HTMLButtonElement, Snapshot>();
  const timers = new Map<HTMLButtonElement, number>();
  const generations = new WeakMap<HTMLButtonElement, number>();
  const reset = (button: HTMLButtonElement) => {
    const saved = snapshots.get(button);
    clearTimeout(timers.get(button)); timers.delete(button);
    if (saved) {
      saved.target.textContent = saved.text;
      if (saved.title === null) button.removeAttribute('title'); else button.title = saved.title;
      if (saved.path && saved.pathData) saved.path.setAttribute('d', saved.pathData);
      snapshots.delete(button);
    }
    delete button.dataset.copyState;
  };
  signal.addEventListener('abort', () => { for (const button of snapshots.keys()) reset(button); }, { once:true });
  return async (button: HTMLButtonElement, target: HTMLElement, text: string, fallback: string, labels?: { success:string; failure:string }) => {
    if (!snapshots.has(button)) {
      const path = button.querySelector<SVGPathElement>('svg path') || undefined;
      snapshots.set(button, { target, text:target.textContent || '', title:button.getAttribute('title'), path, pathData:path?.getAttribute('d') });
    }
    clearTimeout(timers.get(button));
    const generation = (generations.get(button) || 0) + 1;
    generations.set(button, generation);
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch { /* Keep the control usable when clipboard access is denied. */ }
    if (signal.aborted || generation !== generations.get(button)) return;
    target.textContent = copied ? labels?.success || '已复制' : labels?.failure || '复制未成功';
    button.dataset.copyState = copied ? 'copied' : 'error';
    if (copied) snapshots.get(button)?.path?.setAttribute('d', 'm5 12 4 4L19 6');
    button.title = copied ? '已复制到剪贴板' : fallback;
    timers.set(button, window.setTimeout(() => reset(button), 2000));
  };
}
