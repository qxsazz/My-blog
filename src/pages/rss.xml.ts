import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { entries, entryUrl } from '@/lib';
import { site } from '@/config';
export async function GET(context: APIContext) {
  return rss({ title: site.title, description: site.description, site: context.site!, items: (await entries()).map(p=>({ title:p.data.title, description:p.data.description, pubDate:p.data.date, link:entryUrl(p) })), customData: '<language>zh-cn</language>' });
}
