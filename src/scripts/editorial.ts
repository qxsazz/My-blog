export {};
const readTheme=()=>{try{return localStorage.getItem('editorial-theme')||'light';}catch{return 'light';}};
function applyTheme(root:HTMLElement){const mode=readTheme();root.classList.toggle('dark',mode==='dark');root.dataset.theme=mode;}
document.addEventListener('astro:before-swap',event=>{
 const next=(event as Event & {newDocument:Document}).newDocument.documentElement;
 applyTheme(next);
 for(const key of ['gateWallpaper','gateEffects','gateInitialized']){
  const value=document.documentElement.dataset[key];if(value!==undefined)next.dataset[key]=value;
 }
});
const dialog=document.querySelector<HTMLDialogElement>('#search-dialog')!;
const input=document.querySelector<HTMLInputElement>('#editorial-search')!;
const searchStatus=document.querySelector<HTMLElement>('#search-status')!;
const results=document.querySelector<HTMLElement>('#search-results')!;
function openSearch(){if(!dialog.open)dialog.showModal();input.focus();}
document.addEventListener('click',event=>{
 const target=event.target as Element;
 if(target.closest('[data-open-search]'))openSearch();
 if(target.closest('[data-theme-toggle]')){const mode=document.documentElement.classList.contains('dark')?'light':'dark';try{localStorage.setItem('editorial-theme',mode);}catch{}document.documentElement.classList.toggle('dark',mode==='dark');document.documentElement.dataset.theme=mode;}
 if(target.closest('#search-results a'))dialog.close();
 if(target===dialog){const r=dialog.getBoundingClientRect();const e=event as MouseEvent;if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}
});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}});
let queryVersion=0;let delay:ReturnType<typeof setTimeout>;
input.addEventListener('input',()=>{
 clearTimeout(delay);const version=++queryVersion;results.replaceChildren();const query=input.value.trim();
 if(!query){searchStatus.textContent='输入关键词，搜索所有文章。';return;}
 searchStatus.textContent='正在搜索…';
 delay=setTimeout(async()=>{
  try{
   const moduleUrl='/pagefind/pagefind.js';const pagefind=await import(/* @vite-ignore */moduleUrl);const found=await pagefind.search(query);
   const entries=await Promise.all(found.results.slice(0,8).map((result:{data:()=>Promise<{url:string;meta:{title?:string};excerpt:string}>})=>result.data()));
   if(version!==queryVersion)return;
   searchStatus.textContent=entries.length?`找到 ${found.results.length} 条结果`:'没有找到相关内容，换个关键词试试。';
   for(const entry of entries){const a=document.createElement('a');a.href=entry.url;const title=document.createElement('strong');title.textContent=entry.meta.title||'文稿';const excerpt=document.createElement('p');excerpt.textContent=new DOMParser().parseFromString(entry.excerpt,'text/html').body.textContent;a.append(title,excerpt);results.append(a);}
  }catch{if(version===queryVersion)searchStatus.textContent='搜索暂时不可用，请前往文稿页浏览。';}
 },180);
});
function filterArchive(){const select=document.querySelector<HTMLSelectElement>('#topic-filter');if(!select||select.dataset.ready)return;select.dataset.ready='true';const params=new URLSearchParams(location.search);const value=params.get('topic');if(value&&[...select.options].some(o=>o.value===value))select.value=value;
 const filter=()=>{let visible=0;document.querySelectorAll<HTMLElement>('[data-post-topics]').forEach(row=>{const show=!select.value||row.dataset.postTopics?.split('|').includes(select.value);row.hidden=!show;if(show)visible++;});const empty=document.querySelector<HTMLElement>('#archive-empty');if(empty)empty.hidden=visible>0;};select.addEventListener('change',()=>{filter();const url=new URL(location.href);if(select.value)url.searchParams.set('topic',select.value);else url.searchParams.delete('topic');history.replaceState(null,'',url);});filter();}
document.addEventListener('astro:page-load',filterArchive);filterArchive();
