import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://echo-novel.innei.in';

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const chapters = await getCollection('chapters');
  const slugOf = (order: number) => (order === 0 ? 'prologue' : String(order));
  const urls = [
    { loc: `${SITE}/`, priority: '1.0' },
    ...chapters
      .sort((a, b) => a.data.order - b.data.order)
      .map((c) => ({
        loc: `${SITE}/chapters/${slugOf(c.data.order)}`,
        priority: '0.8',
      })),
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${xmlEscape(u.loc)}</loc><priority>${u.priority}</priority></url>`,
      )
      .join('\n') +
    `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
