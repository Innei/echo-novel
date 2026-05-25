import { defineConfig, fontProviders } from 'astro/config';
import remarkChat from './src/lib/remark-chat.mjs';
import rehypeDropCap from './src/lib/rehype-drop-cap.mjs';

export default defineConfig({
  site: 'https://echo-novel.innei.in',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  experimental: {
    fonts: [
      {
        name: 'Source Serif 4',
        cssVariable: '--font-source-serif',
        provider: fontProviders.fontsource(),
        weights: [400, 600, 700],
        styles: ['normal', 'italic'],
        subsets: ['latin', 'latin-ext'],
        fallbacks: ['Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'Georgia', 'serif'],
      },
      {
        name: 'Noto Serif SC',
        cssVariable: '--font-noto-serif-sc',
        provider: fontProviders.fontsource(),
        weights: [400, 700],
        styles: ['normal'],
        subsets: ['chinese-simplified'],
        fallbacks: ['Source Han Serif SC', 'Songti SC', 'serif'],
      },
      {
        name: 'JetBrains Mono',
        cssVariable: '--font-jetbrains-mono',
        provider: fontProviders.fontsource(),
        weights: [400, 500, 600],
        styles: ['normal'],
        subsets: ['latin', 'latin-ext'],
        fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    ],
  },
  markdown: {
    smartypants: false,
    remarkPlugins: [remarkChat],
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
