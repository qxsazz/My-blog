export const postCategories = ['设计', '技术', '研究', '游戏', '经验', '杂谈'] as const;
/** Keep older category bookmarks usable after the taxonomy change. */
export const normalizePostCategory = (category: string) => category === '创造' ? '经验' : category === '写作' ? '设计' : category;
