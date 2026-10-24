# Model Gate · 个人技术博客

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

站点支持文章归档、分类、标签、Pagefind 搜索、RSS、数学公式、代码高亮、深浅主题与移动端布局。环境音由 Web Audio 本地合成，默认关闭。

底座来自 [Fuwari](https://github.com/saicaca/fuwari)，保留 MIT LICENSE。
