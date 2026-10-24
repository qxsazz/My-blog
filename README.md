# dominator · 个人技术博客

基于 Astro 与 Fuwari 的中文技术博客，使用 ChatGPT Sites 托管。
目标自定义域名为 `blog.model-gate.fun`，域名是否生效以 Sites DNS 验证结果为准。

## 本地开发

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm check
corepack pnpm build
```

文章放在 `src/content/posts/`，站点与个人资料在 `src/config.ts`，关于页在 `src/content/spec/about.md`。运行 `corepack pnpm new-post 文章名称` 创建新文章。

## 发布

`.openai/hosting.json` 保存 Sites 项目标识和静态目录 `dist`。
将源码推送至该项目的 Sites 源仓库，使用同一次提交构建的静态文件创建版本并部署。
子域名仅使用 Sites 返回的 CNAME 与验证记录，根域名无需修改。

站点支持文章归档、分类、标签、Pagefind 搜索、RSS、数学公式、代码高亮、深浅主题与移动端布局。轻音乐由 Web Audio 本地合成，默认关闭；提供钢琴旋律、氛围和弦、雨声钢琴三种场景，以及混响、音量调节与渐入渐出。音频调度位于 `src/scripts/reading-audio.ts`，播放器位于 `src/components/Ambient.astro`。

底座来自 [Fuwari](https://github.com/saicaca/fuwari)，保留 MIT LICENSE。

## 视觉风格

用户提供的原图位于 `public/images/dominator-avatar.png`，用于个人头像、导航和首页人物展示。页面采用银白、冰蓝与深夜蓝配色，新访客默认深色模式；已有主题选择会保留。壁纸有苍蓝星域、霜月极光、纯净夜色三档，可关闭星光特效，系统减少动态效果设置同样生效。

首页介绍、阅读按钮、主题入口和文章列表均已恢复。悬挂卡片位于右侧，源文件为 `src/components/widget/HangingCard.astro`，支持拖拽、方向键摆动、双击或 Home 键复位，并尊重减少动态效果设置。站点介绍文章 `src/content/posts/welcome.md` 已恢复公开显示。发布自己的文章时，在 `src/content/posts/` 中写入 Markdown 并设 `draft: false`。

## 样式发布

`pnpm build` 会在 Astro 构建后将每页使用的 CSS 嵌入 HTML，并保留字体等资源的绝对路径，避免页面与分离样式文件加载不同步。静态资源统一输出到 `assets/`。用 `node --test scripts/inline-styles.test.mjs` 验证样式嵌入和字体路径转换。
