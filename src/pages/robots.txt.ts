import type { APIRoute } from 'astro';

const SITE = 'https://echo-novel.innei.in';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain' } },
  );
