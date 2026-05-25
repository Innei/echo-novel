// Endless chapter scroll: prepend prev / append next.
// Each chapter still has its own static page for direct entry & SEO.

const SELECTOR = 'article.chapter-article';

const main = document.querySelector('main.chapter-main');
if (!main) {
  throw new Error('chapter-main not found');
}

let loadingPrev = false;
let loadingNext = false;
const loaded = new Set<string>();

const initial = main.querySelector<HTMLElement>(SELECTOR);
if (initial?.dataset.slug) loaded.add(initial.dataset.slug);

const firstArticle = () => main.querySelector<HTMLElement>(`${SELECTOR}:first-of-type`);
const lastArticle = () => {
  const all = main.querySelectorAll<HTMLElement>(SELECTOR);
  return all.length ? all[all.length - 1] : null;
};

async function fetchChapter(slug: string): Promise<HTMLElement | null> {
  try {
    const res = await fetch(`/chapters/${slug}`, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.querySelector<HTMLElement>(SELECTOR);
  } catch {
    return null;
  }
}

const sentinelOpts: IntersectionObserverInit = { rootMargin: '800px 0px' };
const sentinelIo = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const side = (e.target as HTMLElement).dataset.side;
    if (side === 'top') void loadPrev();
    if (side === 'bottom') void loadNext();
  }
}, sentinelOpts);

const volLabelEl = document.querySelector<HTMLElement>('[data-vol-label]');
const urlIo = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((e) => e.isIntersecting)
    .map((e) => e.target as HTMLElement)
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  const top = visible[0];
  if (!top) return;
  const url = top.dataset.url;
  const title = top.dataset.title;
  const volume = top.dataset.volume;
  if (url && location.pathname !== url) {
    history.replaceState(null, '', url);
    if (title) document.title = title;
  }
  if (volLabelEl && volume) {
    const next = `Vol. ${volume}`;
    if (volLabelEl.textContent !== next) volLabelEl.textContent = next;
  }
}, { rootMargin: '-20% 0px -60% 0px' });

function observeArticle(article: HTMLElement | null) {
  if (!article) return;
  urlIo.observe(article);
}

function resetSentinels() {
  main.querySelectorAll('.scroll-sentinel').forEach((s) => {
    sentinelIo.unobserve(s);
    s.remove();
  });
  const first = firstArticle();
  if (first?.dataset.prevSlug) {
    const top = document.createElement('div');
    top.className = 'scroll-sentinel';
    top.dataset.side = 'top';
    top.setAttribute('aria-hidden', 'true');
    main.insertBefore(top, first);
    sentinelIo.observe(top);
  }
  const last = lastArticle();
  if (last?.dataset.nextSlug) {
    const bot = document.createElement('div');
    bot.className = 'scroll-sentinel';
    bot.dataset.side = 'bottom';
    bot.setAttribute('aria-hidden', 'true');
    main.appendChild(bot);
    sentinelIo.observe(bot);
  }
}

async function loadNext() {
  if (loadingNext) return;
  const last = lastArticle();
  const nextSlug = last?.dataset.nextSlug;
  if (!nextSlug || loaded.has(nextSlug)) return;
  loadingNext = true;
  loaded.add(nextSlug);
  try {
    const article = await fetchChapter(nextSlug);
    if (!article) {
      loaded.delete(nextSlug);
      return;
    }
    main.appendChild(article);
    observeArticle(article);
    resetSentinels();
  } finally {
    loadingNext = false;
  }
}

async function loadPrev() {
  if (loadingPrev) return;
  const first = firstArticle();
  const prevSlug = first?.dataset.prevSlug;
  if (!prevSlug || loaded.has(prevSlug)) return;
  loadingPrev = true;
  loaded.add(prevSlug);
  try {
    const article = await fetchChapter(prevSlug);
    if (!article) {
      loaded.delete(prevSlug);
      return;
    }
    const beforeHeight = document.documentElement.scrollHeight;
    const beforeScroll = window.scrollY;
    main.insertBefore(article, first);
    const afterHeight = document.documentElement.scrollHeight;
    const delta = afterHeight - beforeHeight;
    window.scrollTo({ top: beforeScroll + delta, behavior: 'instant' as ScrollBehavior });
    observeArticle(article);
    resetSentinels();
  } finally {
    loadingPrev = false;
  }
}

document.documentElement.classList.add('js-stream');
main.querySelectorAll<HTMLElement>(SELECTOR).forEach(observeArticle);
resetSentinels();
