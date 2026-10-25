# dominator · 个人空间

正式地址：**https://blog.model-gate.fun/**。

静态个人博客，采用 Astro、TypeScript 和 Markdown。冰蓝星夜主题与个人头像保持一致，支持浅色冰霜模式。首页、文稿、手记、思考、时间线及关于页由统一内容源生成。

## 开发

```bash
npm ci
npm run dev
npm run build
npm run preview
```

`npm run build` 先运行 Astro / TypeScript 检查，再生成 `dist/`。

## 写作

当前预填 **6 篇文稿、4 篇手记、3 则思考**，用于展示完整阅读效果；可直接替换 Markdown 内容。

```text
src/content/posts/          # 文稿
src/content/notes/          # 手记
src/content/thinking/       # 思考
```

```markdown
---
title: 标题
description: 一句话摘要
date: 2026-10-24
updated: 2026-10-24
category: 技术
tags: [开发, 思考]
pinned: false
draft: false
---

从这里开始写。
```

`updated` 可选；`pinned: true` 用于文稿置顶；`draft: true` 的内容不会进入列表、详情、搜索、时间线或 RSS。手记还可填写 `mood`。文件名决定详情路径。

首页的近期笔墨、碎念、来信、数量和字数，均根据内容集合生成。手记按年份排列，时间线按真实年月分组；标签及其数量由文稿计算，筛选状态可以通过链接分享。文稿排序支持最新、最早、最近更新。

## 项目结构

```text
.openai/hosting.json          # 既有 Sites 项目身份
src/config.ts                # 身份、头像、中文介绍、主题与导航
src/content.config.ts        # 内容 schema
src/lib.ts                   # 内容读取、日期与阅读时长
src/content/                 # Markdown
src/components/              # 导航、页脚、背景、搜索与标签弹层
src/layouts/                 # 站点与文章布局
src/pages/                   # 各栏目与详情路由
src/scripts/site.ts          # 主题、弹层、移动导航、复制链接
src/scripts/posts-browser.ts # 标签筛选、排序与 URL 状态
src/scripts/transitions.ts   # 站内跳转生命周期与加载过场
src/components/MegaMenu.astro # 首页菜单：此间统计、页面目录与联系入口
src/components/NavContent.astro # 文稿、手记、时光、更多的差异化菜单
src/scripts/navigation.ts    # 悬停、键盘、触屏与面板定位
src/scripts/collection-filters.ts # 手记专栏与时光类型的 URL 筛选
src/components/MenuPage.astro # 人设、灵魂、迭代等独立页面
src/styles/mega-menu.css     # 桌面信纸菜单与移动端面板
src/styles/tokens.css        # 深浅主题语义变量与旧组件兼容别名
src/styles/midnight.css      # 中文排版、首页节奏与公共组件精修
src/styles/global.css        # 原有尺寸、排版与响应式
src/styles/stellar.css       # 冰蓝星夜 / 浅色冰霜
src/styles/content.css       # 有正文的栏目与文章样式
src/styles/reading.css       # 信纸阅读、文稿正文与过场动画
src/styles/fonts.css         # 本地字体声明
public/images/avatar.png     # 头像
public/audio/clair-de-lune.mp3 # 月光，Laurens Goedhart 的 CC BY 3.0 录音
src/components/MusicPlayer.astro # 持久化星夜电台
src/scripts/music-player.ts  # 播放、进度、音量与存储
public/licenses/             # 字体许可与来源记录
```

原公共设计系统与相关许可保存在 `design-system/`，旧演示配置保存在 `docs/previous-showcase/`。页面不展示开发来源说明；源文件许可和字体信息仍按原样保留。

## 路由

- `/` 首页；`/posts/` 文稿；`/notes/` 手记；`/thinking/` 思考；`/timeline/` 时间线。
- `/posts/<文件名>/`、`/notes/<文件名>/`、`/thinking/<文件名>/` 是内容详情。
- `/about/`、`/about-site/` 为个人与站点介绍。
- `/friends/`、`/projects/`、`/says/`、`/travelling/` 为更多栏目。
- `/gallery/` 与 `/message/` 目前显示诚实的空状态，不伪造照片、访客或留言。
- `/archive/` 兼容旧入口；`/preview/post/`、`/preview/note/` 已跳转到可阅读的文章。
- `/persona/` 人设、`/soul/` 灵魂、`/changelog/` 迭代、`/friends/about/` 关于友链、`/consulting/` 咨询说明、`/support/` 赞助说明。
- `/rss.xml` 与 sitemap 在构建时生成。

## 主题与交互

默认深色；页脚可选择浅色、深色或跟随系统，偏好保存在 localStorage。背景采用 SVG 星尘、冷光与轨道线，支持关闭，并尊重减少动效偏好。搜索在浏览器本地完成，支持 `⌘K / Ctrl+K`。

站内链接采用 Astro ClientRouter 切换：正文淡出，准备超过 140ms 时显示冰蓝圆环与中文短句，新正文淡入。星空 DOM 持续保留，浏览器前进、后退和页内目录锚点仍由路由管理；加载超过 12 秒时退回普通导航。减少动效偏好会关闭位移、入场与圆环动画。

手记详情采用白色叠层稿纸、蓝色分类书签、日期/概要及首字放大的宋体正文，左侧近期手记、右侧目录与阅读进度；深浅模式均保留白色纸面，外层背景跟随主题。文稿详情采用宽版正文与内容提要。正文支持标题层级、引用、表格、代码高亮与复制、图片说明、嵌套目录、阅读进度和宋体/黑体切换。字体选择保存在本地；手机端使用可展开的目录与阅读设置。

导航按栏目提供不同菜单：首页为此间统计与十个独立页面；文稿为分类与最近五篇文章；手记为专栏与最近三封手记；时光为内容类型与近期动态；更多为友链、项目、一言、跃迁。思考保持直接跳转。统计由已发布内容计算，建站天数从 `site.since` 起按 UTC 自然日包含首日计算，并在访问时更新。邮箱与 GitHub 未配置时不显示对应图标。

桌面端支持悬停、独立展开按钮、ArrowDown 进入菜单、Escape 关闭、Tab 移出关闭；直接点击导航文字仍进入栏目。每次只展开一个面板，定位自动限制在视口内。手机端用分栏目的原生折叠菜单承载相同内容。

菜单筛选链接可分享：`/posts/?category=设计`、`/notes/?category=日常`、`/timeline/?type=notes`；手记全部专栏位于 `/notes/columns/`。文稿分类可与标签筛选组合。咨询与赞助页面说明目前尚未开放。

未接入评论、点赞统计、登录或邮件后台。RSS 可以直接订阅。邮箱和 GitHub 未提供时不显示入口。

## Midnight Editorial 精修

视觉规则与验证范围见 `DESIGN.md`。首页采用紧凑的内容式首屏、1168px 主辅版心、轻量来信区和信笺页脚；文稿采用 864px 正文与右侧目录；中英文混排沿用 MiSans / Yohaku Sans，正文 16px / 28px，主标题 36px / 45px、700 字重，二级标题 24px / 30px、700 字重。手机自然换行并保留折叠目录；手记沿用独立的信纸版式。深浅主题共用语义 tokens，不添加额外字体或动画依赖。

弹窗保持单一打开状态，锁定根元素与 body 的滚动，关闭后恢复焦点。背景继续由同一组 SVG/CSS 节点呈现，减少粒子与中央装饰；主题、背景效果与阅读字体仍保存在 localStorage。

## 发布

部署目录 `dist/`；默认域名 `https://blog.model-gate.fun`，可由环境变量 `SITE_URL` 覆盖。复用 `.openai/hosting.json` 中的项目身份，不另建站点。正式发布源码在 `/workspace/sites/blog-model-gate`；`/workspace/My-blog` 同步保留可二开的项目文件。


## 星夜电台

全站右下角音符与页脚「背景音乐」控制同一个原生音频播放器，曲目为德彪西《月光》，采用 Laurens Goedhart 2011 年演奏的 CC BY 3.0 录音；不是赵成珍版。完整来源和转换说明在 `public/licenses/music-credits.md`，播放器内保留演奏者与许可链接。

默认关闭、音量 20%，首次点击才加载 MP3。支持暂停/继续、拖动进度、音量与单曲循环；音量和位置保存在 `dominator-music-state`。Astro ClientRouter 切换与前进后退时持续播放同一音频节点；整页刷新后保持暂停，用户点击播放时恢复位置。关闭背景效果或 reduced motion 不会停止用户主动播放的音乐，但关闭音符条装饰动画。可通过 `src/config.ts` 的 `site.music` 更换曲目与授权信息。
