import { cp, mkdir, writeFile, readFile, rename } from 'node:fs/promises';
// Astro writes dist as usual. Package those exact pages and assets beside a small Worker.
await rename('dist', '.presence-static-build');
await mkdir('dist/server', { recursive: true });
await rename('.presence-static-build', 'dist/client');
await mkdir('dist/.openai', { recursive: true });
await cp('.openai/hosting.json', 'dist/.openai/hosting.json');
await cp('worker/index.js', 'dist/server/index.js');
await cp('drizzle', 'dist/drizzle', { recursive: true });
const config = {
  name: 'dominator-presence', main: 'index.js', compatibility_date: '2026-05-01',
  assets: { directory: '../client', binding: 'ASSETS', run_worker_first: ['/api/*'] },
  d1_databases: [{ binding: 'DB', database_name: 'dominator-presence', database_id: '00000000-0000-0000-0000-000000000000', migrations_dir: '../drizzle' }],
};
await writeFile('dist/server/wrangler.json', JSON.stringify(config, null, 2) + '\n');
const module = await import('../worker/index.js');
if (typeof module.default.fetch !== 'function') throw new Error('Worker missing fetch');
JSON.parse(await readFile('dist/.openai/hosting.json', 'utf8'));
console.log('Packaged Astro static pages, presence Worker and D1 migrations.');
