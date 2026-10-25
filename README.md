# 余白 · dominator

一个用于继续二次开发的静态个人博客，使用 **Astro + TypeScript + Markdown**。以 Innei 当前站点的暖纸底色、铜棕强调、留白排版和季节动效为参考；组件与插画为本项目实现。无需数据库或后端。

## 开始

```bash
npm install
npm run dev
```

开发地址：`http://localhost:4321`。

```bash
npm run check    # Astro / TypeScript 检查
npm run build    # 检查并生成 dist/
npm run preview # 预览构建结果
```

## 项目结构

```text
public/
├── favicon.svg
├── images/                 # 自有 SVG 头像与秋景插画
└── licenses/               # 字体 OFL 许可
src/
├── config.ts               # 名称、介绍、邮箱、GitHub、导航
├── content.config.ts       # 文章与手记的内容 schema
├── content/
│   ├── posts/*.md          # 文稿
│   └── notes/*.md          # 手记
├── components/
│   ├── Header.astro        # 桌面与手机导航
│   ├── Footer.astro        # 页脚、主题和背景效果设置
│   ├── EntryList.astro     # 文章列表
│   ├── Search.astro        # 本地全文搜索
│   └── Icon.astro          # SVG 图标
├── layouts/
│   ├── Base.astro          # 站点骨架、元数据和字体
│   └── Article.astro       # 文章、目录、阅读时长、下一篇
├── pages/
│   ├── index.astro         # 首页
│   ├── posts/              # 文稿列表、分类筛选及详情
│   ├── notes/              # 手记列表及详情
│   ├── archive.astro       # 时间归档
│   ├── about.astro         # 关于
│   ├── rss.xml.ts          # RSS
│   └── 404.astro           # 404 页面
├── scripts/site.ts         # 主题、搜索、筛选、导航、滚动效果
├── styles/global.css       # 设计变量、页面样式和响应式
└── lib.ts                  # 内容读取、日期和阅读时长
```

## 个性化与后续二开

1. 修改 `src/config.ts` 的名称、简介、邮箱和 GitHub。站名为 **余白**，创建者为 **dominator**。邮箱和 GitHub 留空时会自动隐藏，不会生成虚假的联系入口。
2. 修改 `src/pages/index.astro` 的首页介绍、引言及季节卡片；更新 `src/pages/about.astro` 的个人介绍。
3. 替换 `public/images/avatar.svg` 和 `autumn.svg`。若修改图片文件名，同时更新组件中的引用。
4. 在 `src/content/posts/`、`src/content/notes/` 添加自己的 Markdown，删除示例文章。
5. 在 `src/styles/global.css` 顶部调整设计变量。
6. 部署前设置 `SITE_URL` 为真实域名，重新构建，确保 canonical、RSS、sitemap 使用正确地址。

### 新增内容

```markdown
---
title: 文章标题
description: 一句话介绍
date: 2026-10-24
category: 技术
tags: [Astro, 博客]
draft: false
---

从这里开始写。

## 一个章节

支持 Markdown、代码高亮、表格、引用和图片。
```

文件名决定地址：`src/content/posts/hello.md` → `/posts/hello/`。`draft: true` 的内容不出现在列表、搜索、RSS 或静态详情页。日期按 UTC 格式化，避免部署机器时区改变显示结果。

### 设计参数

| 用途 | 默认值 | 修改位置 |
| --- | --- | --- |
| 浅色背景 | `#fefdfa` | `--paper` |
| 主文字 | `#34352f` | `--ink` |
| 铜棕强调色 | `#aa5e26` | `--accent` |
| 深色背景 | `#1c1c1e` | `[data-theme='dark']` |
| 深色强调色 | `#dd996e` | `[data-theme='dark']` |
| 英文 / 界面 | DM Sans + 系统中文黑体 | `--font-sans` |
| 中文文章 / 标题 | Noto Serif SC | `--font-serif` |
| 首页标题 | 桌面 40px / 手机 31px | `--text-hero` 和响应式规则 |
| 区块标题 | 桌面 26px / 手机 24px | `--text-section` |
| 文章正文 | 桌面 17px / 手机 16px | `--text-body` |
| 交互过渡 | 250ms | `--duration` |

参考站使用的 Yohaku Sans / MiSans 未直接复制；本项目采用 **SIL OFL 开源字体替代**，经 npm 本地打包，不依赖外部字体 CDN。字体许可保存在 `public/licenses/`。

### 动效与交互

- 首页分层淡入、挥手、光标闪烁、标签微光、缓慢飘动的季节点缀。
- 滚动进入的区块淡入，插画与链接悬停反馈。
- 尊重 `prefers-reduced-motion`；正文和导航不依赖动画才能访问。
- 浅色、深色、跟随系统三种主题，选择保存在 localStorage。
- 背景效果开关保存在 localStorage。
- 点击搜索，或使用 `⌘K / Ctrl+K`；支持标题、摘要、标签、分类与正文的本地搜索。`Esc` 关闭、`↓` 进入结果、`Enter` 打开首项。
- 手机折叠菜单、文稿分类筛选、复制链接、文章目录和返回顶部。

### 扩展边界

当前是纯静态博客，不含登录、数据库、评论服务或邮件订阅后端。RSS 可直接使用；配置邮箱后，「写信」使用 mailto。搜索索引直接包含在生成的 HTML 中，适合个人博客；内容大量增长时，可迁移到 Pagefind 等构建时索引方案。

后续增加功能可以从以下位置入手：

- 评论：在 `Article.astro` 末尾接入 Giscus 等服务。
- 新栏目：增加内容集合、路由和导航配置。
- 换皮：优先修改 CSS 变量，再调整独立组件。
- 持久设置：`site.ts` 目前只保存主题和动效，未来可接入统一偏好模块。

## 部署

执行 `npm run build`，将 `dist/` 部署到支持静态文件的平台。常见配置：

- 构建命令：`npm run build`
- 输出目录：`dist`
- 环境变量：`SITE_URL=https://你的域名`
- Node.js：建议 22.12+ 或 24 LTS

默认假设部署在域名根目录；若部署到 GitHub Pages 项目子路径，需要配置 Astro `base`，并同步调整根绝对路径链接和资源地址。不要直接用 `file://` 打开构建目录。

## 验证

已通过 `astro check` 和静态构建。浏览器检查覆盖站内页面、本地搜索与无结果状态、键盘快捷键、主题持久化、分类筛选、手机菜单、背景效果持久化，以及 375 / 390 / 768 / 1440px 下的横向溢出检查。

## v0.2 · dominator

创建者身份统一到首页、关于页、文章署名、页面 author 元数据与页脚。新增字母 d 个人标识、正在构建区域和建站手记；首页介绍、精选卡片和项目卡片集中到 `src/config.ts`。其余早期文章保留为排版示例，可逐步替换。

## 正式站点

线上地址：https://blog.model-gate.fun/ 。Sites 项目身份保存在 `.openai/hosting.json`；后续应更新这个既有站点，不创建新站点。正式发布源码位于 `/workspace/sites/blog-model-gate`。原 Yohaku 设计系统源码保留在发布仓库的 `design-system/`，原演示构建配置保留在 `docs/previous-showcase/`。
