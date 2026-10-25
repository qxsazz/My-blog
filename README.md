# dominator · Yohaku 结构复刻

正式地址：**https://blog.model-gate.fun/**。

这一版以 [Innei](https://innei.in/) 当前页面为参照，重建导航、首页、文稿、手记、时光、思考及更多栏目。**只保留 dominator 身份与界面文案，不搬运原站文章、头像、私人资料、互动数据或后台脚本。** 文章与手记当前为空；淡灰线条是固定的版式占位，不表示正在加载。

## 运行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

构建为纯静态 HTML，无需数据库。`npm run build` 先检查 Astro / TypeScript，再生成 `dist/`。

## 路由结构

| 地址 | 结构 |
| --- | --- |
| `/` | 头像与介绍、近期笔墨时间线、碎念、来信、季节信纸、页脚 |
| `/posts/` | Blog 标题、置顶卡、排序栏、文稿列表、搜索及标签侧栏 |
| `/notes/` | 波形封面、信纸摘要、年份索引、较早手记 |
| `/timeline/` | 内容计数、年度进度、年月分组、舒 / 密 / 概览模式 |
| `/thinking/` | 窄栏纸张卡片、链接预览、互动区版式 |
| `/friends/` `/projects/` `/says/` `/travelling/` | “更多”菜单对应栏目 |
| `/about/` `/about-site/` | 创建者介绍与站点说明版式 |
| `/gallery/` `/message/` | 照片廊与留言版式 |
| `/preview/post/` `/preview/note/` | 不含正文的文稿、手记详情模板，设置 noindex |
| `/archive/` | 兼容旧链接，跳转到 `/timeline/` |
| `/rss.xml` | 只包含已发布内容，当前为空 |

没有接入真实评论、登录、点赞统计或邮件后台，界面不伪造数据。订阅直接使用 RSS。

## 项目结构

```text
.openai/hosting.json         # 保留既有 Sites 项目身份
src/
├── config.ts               # dominator 身份、导航与更多菜单
├── content.config.ts       # Markdown 内容 schema
├── content/posts/          # 早期样例保留为 draft: true，不会上线
├── content/notes/
├── components/
│   ├── Header.astro        # 顶栏、纸张下拉菜单、移动导航
│   ├── Footer.astro        # 五列页脚与主题 / 背景设置
│   ├── Background.astro    # 纸纤维、颗粒、季节叶片
│   ├── LetterCover.astro   # 手记渐频波形封面
│   ├── Placeholder.astro   # 固定版式占位
│   ├── Search.astro        # 本地搜索
│   ├── Tags.astro          # 标签弹层
│   └── Subscribe.astro     # RSS 订阅弹层
├── layouts/                # 静态站点与文章布局
├── pages/                  # 栏目与内容详情路由
├── scripts/site.ts         # 交互、主题、菜单、弹层
└── styles/
    ├── global.css          # 按页面组织的尺寸、颜色与响应式
    └── fonts.css           # 本地 Yohaku Sans 与 MiSans 字体声明
public/
├── fonts/                  # 本地字体，不依赖参考站运行
├── images/                 # dominator 字母标识
└── licenses/               # 字体许可与来源说明
```

`design-system/` 保留原仓库的 Yohaku 公共设计系统和原 MIT 许可，便于继续二开。原演示站配置保存在 `docs/previous-showcase/`。

## 对齐基准

- 根字号 14px，桌面顶栏 63px，1024px 以下使用 284px × 40px 底部浮动导航。
- 1440px 视口下顶栏宽度 1064px；文稿区宽 896px，分栏为 588px + 56px + 252px；手记信纸内宽 868px；思考和时间线宽 672px。
- 文稿标题 28px、列表标题 16px、摘要 13px、元信息 12px。
- 颜色：纸张 `#fefdfa`、正文 `#24231f`、辅助文字 `#787670`、铜棕强调 `#aa5e26`；深色纸张 `#1c1c1e`、强调 `#dd996e`。
- 字体：Yohaku Sans、MiSans、Noto Serif SC。MiSans 按当前界面字符自托管必要子集；日后新增大量界面文案时可补充子集。正文 Noto Serif SC 由 Fontsource 提供完整分段字体。
- 淡入、纸菜单、挥手、星芒、光标、流光标签、缓慢叶片效果；尊重减少动效偏好，页脚可关闭背景。

## 以后填内容

修改 `src/content/posts/*.md` 或 `src/content/notes/*.md` 的 frontmatter，将 `draft: true` 改为 `draft: false` 后构建，会生成详情页，并进入搜索和 RSS。当前栏目页面优先用于审阅版式；填充真实内容时可继续完善分类与分页的数据绑定。

不要把版式占位当成文章记录，也不要添加虚构阅读量。邮箱与 GitHub 未提供，仍保持空值。

## 发布

既有 Site ID 保存在 `.openai/hosting.json`，后续复用该身份发布到同一个域名。发布源码工作目录为 `/workspace/sites/blog-model-gate`；`/workspace/My-blog` 同步保留可二开的项目文件。正式域名已写入 Astro 配置，部署环境可用 `SITE_URL` 覆盖。打包目录为 `dist/`。
