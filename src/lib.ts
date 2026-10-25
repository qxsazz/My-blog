import { getCollection, type CollectionEntry } from 'astro:content';
export type Entry = CollectionEntry<'posts'> | CollectionEntry<'notes'> | CollectionEntry<'thinking'>;
export const collectionLabel = { posts: '文稿', notes: '手记', thinking: '思考' };
export async function entries(): Promise<Entry[]> {
  const collections = await Promise.all([getCollection('posts'), getCollection('notes'), getCollection('thinking')]);
  return collections.flat().filter(p => !p.data.draft).sort((a, b) => +b.data.date - +a.data.date);
}
export const entryUrl = (entry: Entry) => `/${entry.collection}/${entry.id}/`;
export const dateLabel = (date: Date) => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
export const shortDate = (date: Date) => date.toISOString().slice(5, 10).replace('-', '.');
export const readingTime = (body = '') => Math.max(1, Math.ceil(body.length / 450));
export const weekdayLabel = (date: Date) => new Intl.DateTimeFormat('zh-CN', { weekday: 'short', timeZone: 'UTC' }).format(date);
