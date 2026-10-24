import {build} from 'vite';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd();const configFile=path.resolve('design-system/showcase/vite.config.ts');
await build({configFile,build:{outDir:path.resolve('dist'),emptyOutDir:true}});
await build({configFile,build:{ssr:path.resolve('design-system/showcase/src/entry-server.tsx'),outDir:path.resolve('.build/server'),emptyOutDir:true},logLevel:'warn'});
const {render}=await import(path.resolve('.build/server/entry-server.js'));
const posts=JSON.parse(await readFile('design-system/showcase/src/blog/content.generated.json','utf8'));
const routes=['/','/archive/','/topics/','/about/','/design/',...posts.map(p=>`/posts/${p.slug}/`)];
const template=await readFile('dist/index.html','utf8');
for(const route of routes){
 const {html,title,description}=render(route);
 const escape=s=>String(s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
 let page=template.replace('<div id="root"></div>',`<div id="root">${html}</div>`).replace(/<title>[^]*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/,`<meta name="description" content="${escape(description)}" />`);
 page=page.replace('</head>',`<link rel="canonical" href="https://blog.model-gate.fun${route}" />${route==='/design/'?'<meta name="robots" content="noindex" />':''}</head>`);
 const file=path.join('dist',route,'index.html');await mkdir(path.dirname(file),{recursive:true});await writeFile(file,page);
}
execFileSync(process.execPath,['scripts/inline-styles.mjs'],{stdio:'inherit'});
console.log(`Prerendered ${routes.length} routes from the React Showcase application.`);
