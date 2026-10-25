/** 站点身份、主题与导航集中配置。文章与手记在内容目录中维护。 */
export const site = {
  name: 'dominator',
  author: 'dominator',
  title: 'dominator · 个人空间',
  description: 'dominator 的个人空间。',
  motto: '保持好奇，奔赴热爱。',
  avatar: '/images/avatar.png',
  theme: { default: 'dark', name: '冰蓝星夜' },
  hero: {
    greeting: '你好，我是',
    tagline: '记录思考，分享创造。于寂静处，探索更大的世界。',
    quote: '于无垠星海，留下自己的光。',
  },
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
