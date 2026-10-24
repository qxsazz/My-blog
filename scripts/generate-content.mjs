import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import katex from 'katex';
import hljs from 'highlight.js';
const origin='https://blog.model-gate.fun';
const posts=[];
for(const file of (await readdir('content/posts')).filter(f=>f.endsWith('.md'))){
 const {data,content}=matter(await readFile(`content/posts/${file}`,'utf8'));
 if(data.draft)continue;
 const headings=[];const ids=new Map();
 const md=new MarkdownIt({html:false,linkify:true,typographer:true,highlight:(text,lang)=>lang&&hljs.getLanguage(lang)?hljs.highlight(text,{language:lang}).value:''});
 md.inline.ruler.before('escape','math_inline',(state,silent)=>{
  if(state.src[state.pos]!=='$'||state.src[state.pos+1]==='$')return false;
  let end=state.pos+1;while((end=state.src.indexOf('$',end))!==-1&&state.src[end-1]==='\\')end++;
  if(end===-1||end===state.pos+1)return false;
  if(!silent){const token=state.push('math_inline','math',0);token.content=state.src.slice(state.pos+1,end);}
  state.pos=end+1;return true;
 });
 md.renderer.rules.math_inline=tokensToHtml(false);
 md.block.ruler.before('fence','math_block',(state,start,end,silent)=>{
  const line=state.src.slice(state.bMarks[start]+state.tShift[start],state.eMarks[start]).trim();
  if(!line.startsWith('$$'))return false;
  let expression='';let finish=start;
  if(line.length>4&&line.endsWith('$$'))expression=line.slice(2,-2);
  else{expression=line.slice(2);let closed=false;for(finish=start+1;finish<end;finish++){const next=state.src.slice(state.bMarks[finish]+state.tShift[finish],state.eMarks[finish]);if(next.trim().endsWith('$$')){expression+='\n'+next.slice(0,next.lastIndexOf('$$'));closed=true;break;}expression+='\n'+next;}if(!closed)return false;}
  if(silent)return true;const token=state.push('math_block','math',0);token.block=true;token.content=expression.trim();state.line=finish+1;return true;
 });
 md.renderer.rules.math_block=tokensToHtml(true);
 const original=md.renderer.rules.heading_open;
 md.renderer.rules.heading_open=(tokens,index,options,env,renderer)=>{
  const text=tokens[index+1].content;const base=text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'')||'section';const n=ids.get(base)||0;ids.set(base,n+1);const slug=n?`${base}-${n}`:base;
  tokens[index].attrSet('id',slug);headings.push({text,slug,depth:Number(tokens[index].tag.slice(1))});return original?original(tokens,index,options,env,renderer):renderer.renderToken(tokens,index,options);
 };
 const html=md.render(content);const text=content.replace(/```[^]*?```/g,' ').replace(/[#*`$>\[\]]/g,'');const words=[...(text.match(/[\p{Script=Han}]|[a-zA-Z0-9_]+/gu)||[])].length;
 posts.push({slug:file.replace(/\.md$/,''),title:data.title,description:data.description||'',published:new Date(data.published).toISOString().slice(0,10),tags:data.tags||[],category:data.category||'文稿',html,text,headings,words,minutes:Math.max(1,Math.ceil(words/300))});
}
function tokensToHtml(displayMode){return (tokens,index)=>katex.renderToString(tokens[index].content,{displayMode,throwOnError:false,strict:'ignore'});}
posts.sort((a,b)=>b.published.localeCompare(a.published));
await mkdir('design-system/showcase/src/blog',{recursive:true});await writeFile('design-system/showcase/src/blog/content.generated.json',JSON.stringify(posts));
const escape=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const publicDir='design-system/showcase/public';
await writeFile(`${publicDir}/rss.xml`,`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>dominator</title><link>${origin}</link><description>AI 原理、代码与工程实践</description>${posts.map(p=>`<item><title>${escape(p.title)}</title><link>${origin}/posts/${p.slug}/</link><guid>${origin}/posts/${p.slug}/</guid><description>${escape(p.description)}</description><pubDate>${new Date(p.published).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
const routes=['/','/archive/','/topics/','/about/',...posts.map(p=>`/posts/${p.slug}/`)];
await writeFile(`${publicDir}/sitemap.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(p=>`<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`);
await writeFile(`${publicDir}/robots.txt`,`User-agent: *\nAllow: /\nDisallow: /design/\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Generated ${posts.length} published articles, math, headings, RSS and sitemap.`);
