/** 本轮仅复刻界面结构。内容集合保持为空，后续将文章改为 draft: false 即可发布。 */
export const site = {
  name: 'dominator',
  author: 'dominator',
  title: 'dominator · 个人空间',
  description: 'dominator 的个人空间。',
  motto: 'Stay hungry. Stay foolish.',
  email: '',
  github: '',
  since: '2026-10-24',
  nav: [
    { label: '首页', href: '/' },
    { label: '文稿', href: '/posts/' },
    { label: '手记', href: '/notes/' },
    { label: '时光', href: '/timeline/' },
    { label: '思考', href: '/thinking/' },
  ],
  more: [
    { label: '友链', description: '互联网上的朋友们', href: '/friends/' },
    { label: '项目', description: '开源项目与作品集', href: '/projects/' },
    { label: '一言', description: '言语的碎片', href: '/says/' },
    { label: '跃迁', description: '空间跃迁门', href: '/travelling/' },
  ],
};
