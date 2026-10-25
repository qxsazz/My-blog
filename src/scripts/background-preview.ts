const schemes = {
  mist: { caption: '01 / LUNAR MIST', description: '银蓝薄雾与月弧，留出安静的阅读中心。' },
  aurora: { caption: '02 / AURORA LETTER', description: '蓝青光带在两侧缓慢流动，让星夜更有层次。' },
  atlas: { caption: '03 / DEEP SKY ATLAS', description: '细线星座与轨道，像一页安静的技术手稿。' },
  current: { caption: '04 / CURRENT STARDUST', description: '本站当前背景：银蓝星屑、边缘轨道与缓慢飘落。' },
};
let cleanup = () => {};
function initPreview() {
  cleanup();
  const previewRoot = document.querySelector<HTMLElement>('[data-background-preview]');
  if (!previewRoot) return;
  const host = previewRoot;
  const controller = new AbortController();
  const { signal } = controller;
  cleanup = () => controller.abort();
  const query = new URLSearchParams(location.search);
  const candidate = query.get('scheme') || '';
  let scheme: keyof typeof schemes = Object.prototype.hasOwnProperty.call(schemes,candidate) ? candidate as keyof typeof schemes : 'mist';
  let theme = query.get('theme') === 'light' ? 'light' : 'dark';
  let view = query.get('view') === 'paper' ? 'paper' : 'home';
  let motion = query.get('motion') !== 'off';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function render(updateUrl = true) {
    host.dataset.scheme = scheme;
    host.dataset.view = view;
    host.dataset.motion = motion && !reducedMotion.matches ? 'on' : 'off';
    document.documentElement.dataset.theme = theme;
    host.querySelectorAll<HTMLButtonElement>('[data-lab-scheme]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.labScheme === scheme)));
    host.querySelectorAll<HTMLButtonElement>('[data-lab-view]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.labView === view)));
    const themeButton = host.querySelector<HTMLButtonElement>('[data-lab-theme]')!;
    themeButton.textContent = theme === 'dark' ? '☾ 深夜' : '☀ 冰霜';
    themeButton.setAttribute('aria-label',theme === 'dark' ? '切换到浅色预览' : '切换到深色预览');
    const motionButton = host.querySelector<HTMLButtonElement>('[data-lab-motion]')!;
    motionButton.textContent = reducedMotion.matches ? '静态 · 系统' : `动效 ${motion ? '开' : '关'}`;
    motionButton.disabled = reducedMotion.matches;
    motionButton.setAttribute('aria-pressed',String(motion && !reducedMotion.matches));
    host.querySelector<HTMLElement>('[data-lab-home]')!.hidden = view !== 'home';
    host.querySelector<HTMLElement>('[data-lab-paper]')!.hidden = view !== 'paper';
    host.querySelector<HTMLElement>('[data-lab-caption]')!.textContent = schemes[scheme].caption;
    host.querySelector<HTMLElement>('[data-lab-description]')!.textContent = schemes[scheme].description;
    if (updateUrl) {
      const url = new URL(location.href);
      for (const [key,value] of Object.entries({scheme,theme,view,motion:motion?'on':'off'})) url.searchParams.set(key,value);
      history.replaceState(history.state,'',url);
    }
  }
  host.querySelectorAll<HTMLButtonElement>('[data-lab-scheme]').forEach(button => button.addEventListener('click',() => {
    scheme = button.dataset.labScheme as keyof typeof schemes; render();
    host.querySelector<HTMLElement>('[data-lab-status]')!.textContent = `已切换到${button.querySelector('b')?.textContent}背景`;
  },{signal}));
  host.querySelectorAll<HTMLButtonElement>('[data-lab-view]').forEach(button => button.addEventListener('click',() => { view = button.dataset.labView!; render(); },{signal}));
  host.querySelector('[data-lab-theme]')?.addEventListener('click',() => { theme = theme==='dark'?'light':'dark';render(); },{signal});
  host.querySelector('[data-lab-motion]')?.addEventListener('click',() => { motion=!motion;render(); },{signal});
  async function copyLink(button: HTMLButtonElement) {
    try {
      await navigator.clipboard.writeText(location.href);
      host.querySelector<HTMLElement>('[data-lab-status]')!.textContent='预览链接已复制';
      const label = button.matches('[data-lab-share]') ? button : button.querySelector('span')!;
      label.textContent = '已复制';
      const timer = setTimeout(() => { if (button.isConnected) label.textContent = '复制链接'; },2000);
      signal.addEventListener('abort',() => clearTimeout(timer),{once:true});
    }
    catch { host!.querySelector<HTMLElement>('[data-lab-status]')!.textContent='可以复制浏览器地址栏，分享当前方案'; }
  }
  host.querySelector<HTMLButtonElement>('[data-lab-share]')?.addEventListener('click',event => { void copyLink(event.currentTarget as HTMLButtonElement); },{signal});
  host.querySelector<HTMLButtonElement>('[data-copy-link]')?.addEventListener('click',event => { void copyLink(event.currentTarget as HTMLButtonElement); },{signal});
  reducedMotion.addEventListener('change',() => render(),{signal});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',() => queueMicrotask(() => { if (!signal.aborted) render(false); }),{signal});
  render(false);
  // The shared site's theme listener can run later in this page-load event.
  // Preview choices win here without changing the visitor's saved site theme.
  queueMicrotask(() => { if (!signal.aborted && host.isConnected) render(false); });
}
document.addEventListener('astro:page-load',initPreview);
