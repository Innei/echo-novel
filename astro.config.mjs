import { defineConfig } from 'astro/config';
import remarkCnQuotes from './src/lib/remark-cn-quotes.mjs';

export default defineConfig({
  site: 'https://echo-novel.pages.dev',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  markdown: {
    smartypants: false,
    remarkPlugins: [remarkCnQuotes],
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
  vite: {
    server: {
      watch: { ignored: ['**/.pi/**', '**/.superpowers/**'] },
    },
  },
});
