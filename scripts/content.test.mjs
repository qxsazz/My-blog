import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const script=fileURLToPath(new URL('./generate-content.mjs',import.meta.url));
function fixture(run){const cwd=mkdtempSync(join(tmpdir(),'yohaku-content-'));try{mkdirSync(join(cwd,'content/posts'),{recursive:true});mkdirSync(join(cwd,'design-system/showcase/public'),{recursive:true});run(cwd)}finally{rmSync(cwd,{recursive:true,force:true})}}
const front='---\ntitle: Test & Math\npublished: 2026-10-24\ntags: [AI]\n---\n';
const execute=cwd=>{const p=spawnSync(process.execPath,[script],{cwd,encoding:'utf8'});assert.equal(p.status,0,p.stderr);return JSON.parse(readFileSync(join(cwd,'design-system/showcase/src/blog/content.generated.json'),'utf8'))};
test('migrated Markdown renders inline/block math, highlighted code and unique CJK anchors',()=>fixture(cwd=>{
 writeFileSync(join(cwd,'content/posts/example.md'),front+'## 公式\n\n$Q$ 与 $K$\n\n$$\nQK^\\top\n$$\n\n## 公式\n\n```python\nprint(1)\n```');
 const [post]=execute(cwd);assert.deepEqual(post.headings.map(h=>h.slug),['公式','公式-1']);assert.ok(post.html.includes('katex-display'));assert.ok(!post.html.includes('$Q$'));assert.ok(post.html.includes('hljs-built_in'));assert.equal(post.published,'2026-10-24');assert.ok(post.words>0);
 const rss=readFileSync(join(cwd,'design-system/showcase/public/rss.xml'),'utf8');assert.ok(rss.includes('Test &amp; Math'));
}));
test('drafts are excluded and raw HTML is escaped',()=>fixture(cwd=>{
 writeFileSync(join(cwd,'content/posts/public.md'),front+'<script>alert(1)</script>\n');
 writeFileSync(join(cwd,'content/posts/draft.md'),front.replace('tags: [AI]','draft: true')+'secret');
 const posts=execute(cwd);assert.equal(posts.length,1);assert.ok(!posts[0].html.includes('<script>'));assert.ok(posts[0].html.includes('&lt;script&gt;'));assert.ok(!readFileSync(join(cwd,'design-system/showcase/public/rss.xml'),'utf8').includes('/posts/draft/'));
}));
