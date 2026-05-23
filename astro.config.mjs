import { defineConfig } from 'astro/config';
import remarkCnQuotes from './src/lib/remark-cn-quotes.mjs';
import remarkChat from './src/lib/remark-chat.mjs';
import rehypeDropCap from './src/lib/rehype-drop-cap.mjs';

export default defineConfig({
  site: 'https://echo-novel.innei.in',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  markdown: {
    smartypants: false,
    remarkPlugins: [remarkChat, remarkCnQuotes],
    rehypePlugins: [rehypeDropCap],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      defaultColor: false,
      wrap: true,
    },
  },
  vite: {
    server: {
      watch: { ignored: ['**/.pi/**', '**/.superpowers/**'] },
    },
  },
});
