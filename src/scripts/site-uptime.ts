/** Calculate from the wall clock each tick, so background-tab throttling cannot drift. */
export function formatSiteUptime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 86400)}天${Math.floor(seconds / 3600) % 24}小时${Math.floor(seconds / 60) % 60}分${seconds % 60}秒`;
}
export function initSiteUptime(signal: AbortSignal) {
  const output = document.querySelector<HTMLOutputElement>('[data-site-uptime]');
  if (!output || signal.aborted) return;
  const start = Date.parse(output.dataset.siteUptime || '');
  if (!Number.isFinite(start)) return;
  let timer: number | undefined;
  const tick = () => { output.textContent = formatSiteUptime(Date.now() - start); };
  const stop = () => { if (timer !== undefined) { window.clearInterval(timer); timer = undefined; } };
  const resume = () => {
    stop();
    tick();
    if (!document.hidden) timer = window.setInterval(tick, 1000);
  };
  document.addEventListener('visibilitychange', resume, { signal });
  window.addEventListener('pageshow', tick, { signal });
  signal.addEventListener('abort', stop, { once:true });
  resume();
}
