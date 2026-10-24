# dominator · Yohaku Showcase fork

本工程以 [Innei/Yohaku](https://github.com/Innei/Yohaku) 公开的 `design-system/showcase` 为底座进行二次开发。旧的 Astro/Fuwari 工程已从当前源树移除。

- 基础：React 19、Vite 8、Tailwind CSS 4、TypeScript 6。
- 沿用上游主题 Hook、原生 tokens、Showcase、模板与规范校验。
- 上游来源、提交和许可见 [UPSTREAM.md](./UPSTREAM.md) 与 [design-system/LICENSE](./design-system/LICENSE)。
- 完整博客 Web 前端未公开；本项目使用的是公开 React Showcase，未声称持有闭源 Web 源码。

## 开发

Node.js 24，pnpm 9.14.4（本派生仓库的独立工作区配置）。

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm preview
```

原始 Showcase 保留在 `design-system/showcase/src/DesignSystemApp.tsx`，可通过 `/design/` 访问。博客入口是 `design-system/showcase/src/App.tsx`，主题仍使用上游 `theme.ts`。

## 写文章

文章放在 `content/posts/*.md`：

```yaml
---
title: 文章标题
published: 2026-10-24
description: 一段摘要
tags: [AI, 工程实践]
category: 技术
draft: false
---
```

正文支持 Markdown、代码高亮、行内/块级数学公式与自动目录。构建会生成文章数据、RSS 与 Sitemap。搜索直接检索已公开文章的标题、标签与正文，支持中文。文章渲染时禁止原始 HTML，避免内容注入。

## 项目结构

```text
content/posts/                       Markdown 内容
design-system/src/                   原生 Tailwind 4 设计 tokens
design-system/showcase/src/App.tsx   博客应用与路由
design-system/showcase/src/blog/     React 锁链卡片、播放器与博客样式
design-system/showcase/src/theme.ts  上游主题逻辑，补充存储不可用的兼容处理
design-system/showcase/src/DesignSystemApp.tsx  原始 Showcase
scripts/generate-content.mjs         Markdown、数学与内容索引
scripts/build.mjs                    Vite 客户端 + React SSR 静态预渲染
.openai/hosting.json                 现有 Sites 项目与静态目录
```

音乐与悬挂卡片是 React 组件，在博客站内导航时保持挂载。播放器默认关闭，用户点击后才播放；锁链卡片支持拖动、键盘和减少动态效果设置。

## 发布

输出目录为 `dist/`。首页、归档、专题、关于、设计系统及文章页面均生成独立 HTML，直接打开深层链接无需 SPA 回退。CSS 随页面内嵌，字体、图片和 JS 使用同源绝对路径。Sites 项目和公开子域名 `blog.model-gate.fun` 沿用已有绑定。

旧工程备份位于工作区的 `/workspace/artifacts/dominator-before-yohaku-replacement.tar.gz`，并保留于旧源仓库历史中。当前后续二开以本目录为准。
