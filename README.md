# dominator · 个人技术博客

基于 Astro 内容集合，使用 ChatGPT Sites 发布。公开域名为 https://blog.model-gate.fun/ 。

## 设计来源

本次视觉重构采用 [Yohaku 开源设计系统](https://github.com/Innei/Yohaku/tree/main/design-system)，来源提交 `37a055bebce83e950847c92e0cfd616c593acf4d`。直接复用中性色阶、字体角色与字号规范，按纸面、留白和内容优先的原则重写页面。Yohaku 的完整 Web 前端当前未公开，本项目没有使用其闭源实现。

`src/styles/vendor/yohaku/tokens.original.css` 保留上游原始 token；`tokens.css` 仅把 Tailwind v4 的 `@theme` 声明适配成原生 CSS 变量，供当前 Astro 工程使用。同目录保留 Innei 的 MIT 版权与许可。暗色色阶取自上游 `references/tokens.md`。

## 写文章

文章放在 `src/content/posts/`，使用 Markdown frontmatter：

```yaml
title: 文章标题
published: 2026-10-24
description: 文章摘要
tags: [AI, 工程实践]
category: 技术
draft: false
```

`corepack pnpm new-post 文章名称` 创建文章。首页与归档根据已公开文章自动更新，Pagefind 在构建时生成正文搜索索引。`src/pages/topics.astro` 为专题导航，不虚构文章或个人经历。

## 开发与验证

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm check
corepack pnpm build
node --test scripts/inline-styles.test.mjs
```

`EditorialLayout.astro` 和 `editorial.css` 构成全站视觉层；`editorial.ts` 实现搜索、主题和归档筛选。原 Fuwari 文件保留以便追溯，其根目录 MIT LICENSE 保持不变。页面由 Astro ClientRouter 切换，音乐、搜索对话框和悬挂头像使用原生持久化节点。音频仍由 `reading-audio.ts` 在本地合成，用户点击后播放。

构建后自动内嵌页面 CSS，避免 HTML 与分离样式加载不同步；保留字体、图片与脚本的绝对路径。Sites 身份和静态目录见 `.openai/hosting.json`，沿用既有项目与子域名。
