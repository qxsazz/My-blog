// One controller per document, retained across Astro's client-side page swaps.
// Every tab has its own lease; the server deduplicates all leases by browser ID.
type PresenceState = { status: 'loading' | 'ready' | 'error' | 'offline'; online?: number };
type PresenceController = { refreshView: () => void };
declare global { interface Window { __dominatorPresence?: PresenceController } }

function createPresence(): PresenceController {
  let state: PresenceState = { status: 'loading' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let hiddenTimer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: AbortController | undefined;
  let failures = 0;
  let hidden = document.hidden;
  let generation = 0;
  const tabId = crypto.randomUUID();
  const key = 'dominator-presence-browser-v1';
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let visitorId = crypto.randomUUID();
  try {
    const stored = localStorage.getItem(key);
    if (stored && validId.test(stored)) visitorId = stored as `${string}-${string}-${string}-${string}-${string}`;
    else localStorage.setItem(key, visitorId);
  } catch { /* Without browser storage, this tab is an anonymous session. */ }

  function refreshView() {
    document.querySelectorAll<HTMLElement>('[data-presence]').forEach(el => {
      el.dataset.state = state.status;
      const text = el.querySelector('[data-presence-label]');
      if (text) text.textContent = state.status === 'ready' ? `${state.online} 人此刻在读`
        : state.status === 'loading' ? '正在连接…'
        : state.status === 'offline' ? '网络已断开' : '暂无法获取';
      el.title = state.status === 'ready' ? '全站当前在线浏览器人数，约每 15 秒更新；同一浏览器多个标签页合计为一位。' : '在线统计暂不可用时不会显示为 0 人。';
    });
  }
  const payload = (action: string) => JSON.stringify({ visitorId, tabId, action });
  function leave() {
    generation++;
    clearTimeout(timer);
    inFlight?.abort();
    inFlight = undefined;
    // keepalive survives pagehide; leases still expire if the network disappears.
    void fetch('/api/presence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload('leave'), keepalive: true, credentials: 'same-origin', cache: 'no-store' }).catch(() => {});
  }
  async function heartbeat() {
    clearTimeout(timer);
    if (hidden || document.hidden || inFlight) return;
    if (!navigator.onLine) { state = { status: 'offline' }; refreshView(); return; }
    const current = ++generation;
    const controller = new AbortController();
    inFlight = controller;
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch('/api/presence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload('heartbeat'), signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Presence unavailable');
      const result = await response.json();
      if (!Number.isSafeInteger(result.online) || result.online < 0) throw new Error('Invalid count');
      if (generation !== current) return;
      state = { status: 'ready', online: result.online }; failures = 0;
    } catch {
      if (generation !== current) return;
      failures++;
      state = { status: navigator.onLine ? 'error' : 'offline' };
    } finally {
      clearTimeout(timeout);
      if (inFlight === controller) inFlight = undefined;
      if (generation === current) {
        refreshView();
        if (!hidden && navigator.onLine) timer = setTimeout(heartbeat, failures ? Math.min(60_000, 15_000 * 2 ** Math.min(failures, 2)) : 15_000);
      }
    }
  }
  document.addEventListener('visibilitychange', () => {
    clearTimeout(hiddenTimer);
    hidden = document.hidden;
    if (hidden) {
      clearTimeout(timer);
      hiddenTimer = setTimeout(leave, 30_000);
    } else { state = { status: 'loading' }; refreshView(); void heartbeat(); }
  });
  window.addEventListener('pagehide', () => { hidden = true; clearTimeout(hiddenTimer); leave(); });
  window.addEventListener('pageshow', () => { hidden = document.hidden; if (!hidden) void heartbeat(); });
  window.addEventListener('offline', () => {
    generation++; clearTimeout(timer); inFlight?.abort(); inFlight = undefined;
    state = { status: 'offline' }; refreshView();
  });
  window.addEventListener('online', () => { if (!document.hidden) { hidden = false; void heartbeat(); } });
  // Prefer an already created browser ID if two brand-new tabs started together.
  window.addEventListener('storage', event => {
    if (event.key !== key || !event.newValue || !validId.test(event.newValue) || event.newValue === visitorId) return;
    leave(); visitorId = event.newValue as typeof visitorId;
    if (!document.hidden) void heartbeat();
  });
  refreshView();
  void heartbeat();
  return { refreshView };
}

export function initPresence() {
  if (!document.querySelector('[data-presence]')) return;
  window.__dominatorPresence ??= createPresence();
  window.__dominatorPresence.refreshView();
}
