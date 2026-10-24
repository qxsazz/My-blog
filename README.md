# Yohaku React Showcase · 原始二开基线

当前运行的是 https://github.com/Innei/Yohaku 的公开 React Showcase，基于提交 `37a055bebce83e950847c92e0cfd616c593acf4d`。`design-system/` 中的公开源文件与上游一致，包含完整组件、样式、主题交互、设计文档、模板和规范测试。

旧博客的自定义 App、文章处理管道、锁链卡片、播放器和自定义布局均已从运行工程移除并归档。后续从这个原始版本开始二开。

## 运行

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm preview
```

仅保留托管适配：工作区限定为公开 `design-system`，使用 pnpm 9.14.4，构建目录通过 CLI 指向根目录 `dist/`，`.openai/hosting.json` 沿用现有 Sites 项目和子域名。

源文件入口：`design-system/showcase/src/main.tsx` 与 `App.tsx`。代码许可见 `design-system/LICENSE`。

恢复备份：`/workspace/artifacts/dominator-react-custom-before-baseline.tar.gz`。独立内容、头像和自定义组件副本在 `/workspace/archives/dominator-react-blog-content/`。
