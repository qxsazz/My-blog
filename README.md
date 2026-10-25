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
src/styles/global.css        # 尺寸、排版与响应式
src/styles/stellar.css       # 冰蓝星夜 / 浅色冰霜
src/styles/content.css       # 有正文的栏目与文章样式
src/styles/reading.css       # 信纸阅读、文稿正文与过场动画
src/styles/fonts.css         # 本地字体声明
public/images/avatar.png     # 头像
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
- `/rss.xml` 与 sitemap 在构建时生成。

## 主题与交互

默认深色；页脚可选择浅色、深色或跟随系统，偏好保存在 localStorage。背景采用 SVG 星尘、冷光与轨道线，支持关闭，并尊重减少动效偏好。搜索在浏览器本地完成，支持 `⌘K / Ctrl+K`。

站内链接采用 Astro ClientRouter 切换：正文淡出，准备超过 140ms 时显示冰蓝圆环与中文短句，新正文淡入。星空 DOM 持续保留，浏览器前进、后退和页内目录锚点仍由路由管理；加载超过 12 秒时退回普通导航。减少动效偏好会关闭位移、入场与圆环动画。

手记详情采用中央叠层信纸、左侧近期手记和右侧目录；文稿详情采用宽版正文与内容提要。正文支持标题层级、引用、表格、代码高亮与复制、图片说明、嵌套目录、阅读进度和宋体/黑体切换。字体选择保存在本地；手机端使用可展开的目录与阅读设置。

未接入评论、点赞统计、登录或邮件后台。RSS 可以直接订阅。邮箱和 GitHub 未提供时不显示入口。

## 发布

部署目录 `dist/`；默认域名 `https://blog.model-gate.fun`，可由环境变量 `SITE_URL` 覆盖。复用 `.openai/hosting.json` 中的项目身份，不另建站点。正式发布源码在 `/workspace/sites/blog-model-gate`；`/workspace/My-blog` 同步保留可二开的项目文件。
