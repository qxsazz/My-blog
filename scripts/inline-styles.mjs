import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Ship each page with its complete CSS so a cached page never loses its appearance
// when a previous release's hashed stylesheet is no longer available.
const output = path.resolve('dist');
async function* pages(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, item.name);
    if (item.isDirectory()) yield* pages(name);
    else if (item.isFile() && name.endsWith('.html')) yield name;
  }
}
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
let count = 0;
for await (const file of pages(output)) {
  const html = await readFile(file, 'utf8');
  let result = '';
  let cursor = 0;
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (attribute(tag, 'rel') !== 'stylesheet') continue;
    const href = attribute(tag, 'href');
    if (!href || /^(?:https?:)?\/\//i.test(href)) throw new Error(`Expected a local stylesheet in ${file}`);
    const url = new URL(href, `https://site.invalid/${path.relative(output, file).split(path.sep).join('/')}`);
    const local = path.resolve(output, `.${decodeURIComponent(url.pathname)}`);
    if (!local.startsWith(output + path.sep)) throw new Error('Stylesheet is outside build output');
    const css = (await readFile(local, 'utf8'))
      .replace(/@charset\s+["'][^"']+["'];?/gi, '')
      .replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi, (full, quoted, single, raw) => {
        const reference = (quoted ?? single ?? raw).trim();
        if (/^(?:[a-z]+:|\/|#)/i.test(reference)) return full;
        const asset = new URL(reference, url);
        return `url("${asset.pathname}${asset.search}${asset.hash}")`;
      })
      .replace(/<\/style/gi, '<\\/style');
    const media = attribute(tag, 'media');
    if (media && !/^[\w\s():,./-]+$/.test(media)) throw new Error('Unexpected stylesheet media');
    result += html.slice(cursor, match.index) + `<style data-site-styles${media ? ` media="${media}"` : ''}>${css}</style>`;
    cursor = match.index + tag.length;
  }
  result += html.slice(cursor);
  await writeFile(file, result);
  count++;
}
console.log(`Embedded styles in ${count} HTML pages.`);
