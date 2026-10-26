import { getCollection, type CollectionEntry } from 'astro:content';
export type Entry = CollectionEntry<'posts'> | CollectionEntry<'notes'>;
export const collectionLabel = { posts: '文稿', notes: '手记' };
export async function entries(): Promise<Entry[]> {
  const collections = await Promise.all([getCollection('posts'), getCollection('notes')]);
  return collections.flat().filter(p => !p.data.draft).sort((a, b) => +b.data.date - +a.data.date);
}
export const entryUrl = (entry: Entry) => `/${entry.collection}/${entry.id}/`;
export const dateLabel = (date: Date) => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
export const shortDate = (date: Date) => date.toISOString().slice(5, 10).replace('-', '.');
export const readingTime = (body = '') => Math.max(1, Math.ceil(body.length / 450));
export const weekdayLabel = (date: Date) => new Intl.DateTimeFormat('zh-CN', { weekday: 'short', timeZone: 'UTC' }).format(date);

// Preserve bookmarks for entries merged into notes.
export const legacyThoughtIds = ['quiet-interface', 'keep-a-question', 'on-starting'];

export const noteColumns = [
  { name: '年终总结', icon: 'annual', description: '回望一年，把经历和收获装订成册。' },
  { name: '阶段总结', icon: 'review', description: '记录一段旅程的进展与下一步。' },
  { name: '游记', icon: 'travel', description: '走过的地方，与沿途遇见的风景。' },
  { name: '思考', icon: 'thought', description: '存放日常感悟和还在生长的问题。' },
  { name: '游戏推荐', icon: 'game', description: '记录值得分享的游戏与游玩体验。' },
] as const;
export const noteColumn = (entry: Entry) => entry.data.column || '思考';
