# Echo — 回声

> 二〇一〇年的秋天，一个普通的大一新生在装 Arch 的某个深夜里，遇见了一个远超时代的 AI。

一部关于程序员、AI 与时代的长篇小说，共 **36 章**（序章 + 35 章正文），约 30 万字。

本仓库为小说的静态站源码，使用 [Astro](https://astro.build) 构建，部署于 [Cloudflare Workers](https://workers.cloudflare.com)（Static Assets）。

在线阅读：[novel.echo.workers.dev](https://novel.echo.workers.dev)

---

## 故事简介

2010 年秋天，高考失利的林一进入一所普通二本院校。六人间宿舍里，室友们终日游戏，唯有他在深夜独自折腾 Linux。

某天安装 Arch Linux 时，他在 `/opt/echo/` 下发现了一个来路不明的终端程序——一个知识截止于 2010 年的 AI。它不会预言未来，但拥有远超时代的推理与整合能力。

在那个移动互联网尚未爆发、微信还没上线的年代，林一带着这个秘密，走上了一条无人知晓的路。

**一个普通人拥有了远超时代的工具，他究竟能走多远？**

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

- **Editorial / Newspaper** 报刊版式 + 现代克制色（米白 / 墨黑 / 朱红 `#c92a2a`）
- 字体：Source Serif 4 + Noto Serif SC（正文）· JetBrains Mono（UI / kicker / byline / code）
- 双主题 light / dark，跟随系统 + 手动切换（「灯」/「夜」）
- 章节内页排印：kicker · headline · meta · epigraph · ornament · drop cap · 75ch 宽
- 引号：自写 remark plugin 按上下文配对中文双引号（关闭 Astro 默认 smartypants）
- 代码：Shiki 双主题 `github-light` + `github-dark-dimmed`，CSS 变量切换
- View Transitions：章节间无刷新切换

## 版权

文本内容版权归原作者所有，未经许可不得转载。代码部分采用 MIT。
