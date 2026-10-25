type SavedMusic = { time: number; volume: number };
const preferenceKey = 'dominator-music-state';
function readMusic(): SavedMusic {
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey) || '{}');
    return { time: Number.isFinite(saved.time) && saved.time >= 0 ? saved.time : 0, volume: Number.isFinite(saved.volume) ? Math.min(1,Math.max(0,saved.volume)) : .2 };
  } catch { return { time: 0, volume: .2 }; }
}
const formatTime = (value: number) => `${Math.floor(value / 60).toString().padStart(2,'0')}:${Math.floor(value % 60).toString().padStart(2,'0')}`;
function createRadio(host: HTMLElement) {
  const audio = host.querySelector<HTMLAudioElement>('[data-music-audio]')!;
  const toggle = host.querySelector<HTMLButtonElement>('[data-music-toggle]')!;
  const panel = host.querySelector<HTMLElement>('.radio-panel')!;
  const playButton = host.querySelector<HTMLButtonElement>('[data-music-play]')!;
  const seek = host.querySelector<HTMLInputElement>('[data-music-seek]')!;
  const volume = host.querySelector<HTMLInputElement>('[data-music-volume]')!;
  const volumeLabel = host.querySelector<HTMLOutputElement>('[data-music-volume-label]')!;
  const elapsed = host.querySelector<HTMLElement>('[data-music-elapsed]')!;
  const duration = host.querySelector<HTMLElement>('[data-music-duration]')!;
  const status = host.querySelector<HTMLElement>('[data-music-status]')!;
  const controller = new AbortController();
  const { signal } = controller;
  const saved = readMusic();
  let restoreTime = saved.time;
  let restored = false;
  let wantsPlay = false;
  let generation = 0;
  let lastSaved = 0;
  let failureText = '';
  let state: 'idle' | 'loading' | 'playing' | 'paused' | 'error' = 'idle';
  audio.volume = saved.volume;
  const writeText = (node: HTMLElement, text: string) => { if (node.textContent !== text) node.textContent = text; };
  function persist() {
    try { localStorage.setItem(preferenceKey,JSON.stringify({ time: restored ? audio.currentTime : restoreTime, volume: audio.volume })); } catch { /* Listening still works without storage. */ }
    lastSaved = Date.now();
  }
  function setOpen(open: boolean, restoreFocus = false) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open ? '收起星夜电台' : '打开星夜电台');
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
  }
  function renderPosition() {
    const ready = Number.isFinite(audio.duration) && audio.duration > 0;
    const time = restored ? audio.currentTime : restoreTime;
    writeText(elapsed,formatTime(time));
    writeText(duration,ready ? formatTime(audio.duration) : '--:--');
    seek.disabled = !ready;
    seek.value = ready ? String(Math.round(audio.currentTime / audio.duration * 1000)) : '0';
    seek.setAttribute('aria-valuetext',ready ? `${formatTime(audio.currentTime)}，共 ${formatTime(audio.duration)}` : '尚未开始播放');
  }
  function render() {
    host.dataset.state = state;
    playButton.setAttribute('aria-label',wantsPlay ? '暂停月光' : '播放月光');
    playButton.setAttribute('aria-pressed',String(wantsPlay));
    volume.value = String(Math.round(audio.volume * 100));
    writeText(volumeLabel,`${volume.value}%`);
    const messages = { idle: '点击播放，让月光陪你阅读。', loading: '正在准备月光…', playing: '月光正在陪你阅读。', paused: '已暂停，随时继续。', error: failureText };
    writeText(status,messages[state]);
    document.querySelectorAll<HTMLButtonElement>('[data-music-set]').forEach(button => {
      const active = (button.dataset.musicSet === 'on') === wantsPlay;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    renderPosition();
  }
  function pause() {
    wantsPlay = false;
    generation++;
    audio.pause();
    state = restored ? 'paused' : 'idle';
    persist(); render();
  }
  async function play() {
    if (wantsPlay) return;
    wantsPlay = true;
    state = 'loading'; failureText = '';
    const request = ++generation;
    if (!audio.getAttribute('src')) audio.src = audio.dataset.src!;
    else if (audio.error) audio.load();
    render();
    try {
      await audio.play();
      if (request !== generation || !wantsPlay) return;
      state = 'playing'; render();
    } catch (error) {
      if (request !== generation || !wantsPlay) return;
      wantsPlay = false;
      state = 'error';
      failureText = error instanceof DOMException && error.name === 'NotAllowedError' ? '请再点一次播放，开始聆听。' : '音频暂时无法播放，点击播放重试。';
      setOpen(true); render();
    }
  }
  toggle.addEventListener('click',() => { const open = panel.hidden; setOpen(open); if (open) playButton.focus({ preventScroll: true }); },{ signal });
  host.querySelector('[data-music-close]')?.addEventListener('click',() => setOpen(false,true),{ signal });
  playButton.addEventListener('click',() => { if (wantsPlay) pause(); else void play(); },{ signal });
  seek.addEventListener('input',() => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration,Math.max(0,Number(seek.value) / 1000 * audio.duration));
    renderPosition(); persist();
  },{ signal });
  volume.addEventListener('input',() => { audio.volume = Math.min(1,Math.max(0,Number(volume.value) / 100)); render(); persist(); },{ signal });
  audio.addEventListener('loadedmetadata',() => {
    if (!restored) {
      if (Number.isFinite(audio.duration) && restoreTime > 0) audio.currentTime = Math.min(restoreTime,Math.max(0,audio.duration - .2));
      restored = true; restoreTime = 0;
    }
    renderPosition();
  },{ signal });
  audio.addEventListener('timeupdate',() => { renderPosition(); if (Date.now() - lastSaved > 5000) persist(); },{ signal });
  audio.addEventListener('durationchange',renderPosition,{ signal });
  audio.addEventListener('playing',() => { if (!wantsPlay) { audio.pause(); return; } state = 'playing'; render(); },{ signal });
  audio.addEventListener('waiting',() => { if (wantsPlay) { state = 'loading'; render(); } },{ signal });
  audio.addEventListener('pause',() => { wantsPlay = false; if (state !== 'error') state = restored ? 'paused' : 'idle'; persist(); render(); },{ signal });
  audio.addEventListener('error',() => { generation++; wantsPlay = false; state = 'error'; failureText = '音频暂时无法播放，点击播放重试。'; audio.pause(); setOpen(true); render(); },{ signal });
  audio.addEventListener('volumechange',() => { render(); persist(); },{ signal });
  render();
  return { host, play, pause, setOpen, render, persist, isOpen: () => !panel.hidden, dispose: () => { audio.pause(); controller.abort(); } };
}
let radio: ReturnType<typeof createRadio> | undefined;
function initRadio() {
  const host = document.querySelector<HTMLElement>('[data-music-player]');
  if (!host) return;
  if (!radio || radio.host !== host) { radio?.dispose(); radio = createRadio(host); }
  radio.render();
}
// The persistent player owns its listeners once; replaced footer controls use delegation.
document.addEventListener('click',event => {
  if (!(event.target instanceof Element)) return;
  const control = event.target.closest<HTMLButtonElement>('[data-music-set]');
  if (!control || !radio) return;
  if (control.dataset.musicSet === 'on') void radio.play(); else radio.pause();
});
document.addEventListener('pointerdown',event => { if (radio?.isOpen() && event.target instanceof Node && !radio.host.contains(event.target)) radio.setOpen(false); });
document.addEventListener('keydown',event => { if (event.key === 'Escape' && radio?.isOpen()) { event.preventDefault(); radio.setOpen(false,true); } });
document.addEventListener('astro:before-preparation',() => { radio?.persist(); radio?.setOpen(false); });
document.addEventListener('astro:page-load',initRadio);
window.addEventListener('pagehide',() => radio?.persist());
document.addEventListener('visibilitychange',() => { if (document.hidden) radio?.persist(); });
initRadio();
