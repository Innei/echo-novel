# Echo — 回声

> 二〇一〇年的秋天，一个普通的大一新生在装 Arch 的某个深夜里，遇见了一个远超时代的 AI。

一部关于程序员、AI 与时代的长篇小说，共 **36 章**（序章 + 35 章），约 30 万字。

本仓库为小说的静态站源码，使用 [Astro](https://astro.build) 构建，部署于 [Cloudflare Workers](https://workers.cloudflare.com)（Static Assets）。

---

## 开发

```bash
pnpm install
pnpm dev          # 本地预览，默认 http://localhost:4321
pnpm build        # 产出 dist/
pnpm preview      # 预览构建产物
pnpm deploy       # build + wrangler deploy
```

## 目录结构

```
.
├── src/
│   ├── content/
│   │   └── chapters/      # 36 章 markdown
│   ├── components/        # Nav / Terminal / ChapterList
│   ├── layouts/           # Base.astro
│   ├── pages/
│   │   ├── index.astro    # 首页
│   │   └── chapters/[slug].astro
│   ├── styles/global.css
│   └── content.config.ts  # content collection 定义
├── public/                # 静态资源
├── astro.config.mjs
├── wrangler.toml          # Cloudflare Workers 部署
└── OUTLINE.md             # 大纲（含剧透，仅作仓库参考）
```

## 章节路由

| Slug | 章节 |
| --- | --- |
| `/chapters/prologue` | 序章 |
| `/chapters/1` … `/chapters/35` | 第 1 章 … 番外 |

## 部署

```bash
pnpm deploy
# 等同 astro build && wrangler deploy
```

须先 `npx wrangler login` 登录 Cloudflare。

## 设计

- **暗夜终端 × 文学衬线**：UI 用 JetBrains Mono，正文用 Noto Serif SC
- 双主题（dark / light），跟随系统 + 手动切换
- 阅读页中文排版优化：首行缩进、行高 1.95、最大宽 38em
- View Transitions：章节间无刷新切换
- 顶部阅读进度条

## License

文本内容版权归原作者所有，未经许可不得转载。代码部分采用 MIT。
