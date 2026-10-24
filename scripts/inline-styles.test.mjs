import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const script = fileURLToPath(new URL('./inline-styles.mjs', import.meta.url));
function fixture(run) {
  const cwd = mkdtempSync(join(tmpdir(), 'site-styles-'));
  try { mkdirSync(join(cwd, 'dist/assets'), { recursive: true }); run(cwd); }
  finally { rmSync(cwd, { recursive: true, force: true }); }
}
const execute = cwd => spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' });
test('embeds styles on root and nested pages and preserves asset URLs and media', () => fixture(cwd => {
  writeFileSync(join(cwd, 'dist/assets/site.css'), 'body{color:blue}@font-face{src:url(./font.woff2?v=1#font)}.icon{background:url(data:image/png;base64,AAAA)}');
  const html = '<html><head><link href="/assets/site.css" rel="stylesheet" media="screen"></head><body>正文</body></html>';
  mkdirSync(join(cwd, 'dist/posts/example'), { recursive: true });
  for (const page of ['index.html', 'posts/example/index.html']) writeFileSync(join(cwd, 'dist', page), html);
  assert.equal(execute(cwd).status, 0);
  for (const page of ['index.html', 'posts/example/index.html']) {
    const actual = readFileSync(join(cwd, 'dist', page), 'utf8');
    assert.match(actual, /<style data-site-styles media="screen">/);
    assert.match(actual, /url\("\/assets\/font\.woff2\?v=1#font"\)/);
    assert.match(actual, /url\(data:image\/png;base64,AAAA\)/);
    assert.ok(!actual.includes('<link'));
    assert.ok(actual.includes('正文'));
  }
  const before = readFileSync(join(cwd, 'dist/index.html'), 'utf8');
  assert.equal(execute(cwd).status, 0);
  assert.equal(readFileSync(join(cwd, 'dist/index.html'), 'utf8'), before);
}));
test('fails the build if a page references a missing stylesheet', () => fixture(cwd => {
  writeFileSync(join(cwd, 'dist/index.html'), '<link rel="stylesheet" href="/assets/missing.css">');
  assert.notEqual(execute(cwd).status, 0);
}));
