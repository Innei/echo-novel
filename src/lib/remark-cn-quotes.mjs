import { visit } from 'unist-util-visit';

const OPEN_D = '“';
const CLOSE_D = '”';
const OPEN_S = '‘';
const CLOSE_S = '’';

const CONTAINERS = new Set([
  'paragraph',
  'heading',
  'listItem',
  'blockquote',
  'tableCell',
]);

const CHINESE = /[一-鿿＀-￯]/u;
const OPEN_PREV = /^$|[\s\n　（(【「『《〈—\-]/u;
const CLOSE_PREV = /[一-鿿a-zA-Z0-9，。：；、？！,.:;?!）)】」』》〉…]/u;
const OPEN_NEXT = /[一-鿿a-zA-Z0-9（(【「『《〈]/u;
const CLOSE_NEXT = /^$|[\s\n　，。：；、？！,.:;?!）)】」』》〉…]/u;

function classify(prev, next) {
  let openScore = 0;
  let closeScore = 0;
  if (OPEN_PREV.test(prev)) openScore++;
  if (CLOSE_PREV.test(prev)) closeScore++;
  if (OPEN_NEXT.test(next)) openScore++;
  if (CLOSE_NEXT.test(next)) closeScore++;
  if (openScore > closeScore) return 'open';
  if (closeScore > openScore) return 'close';
  return null;
}

function transform(textNodes) {
  if (textNodes.length === 0) return;
  const joined = textNodes.map((n) => n.value).join('');
  const decisions = new Array(joined.length).fill(null);
  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i];
    if (ch !== '"' && ch !== "'") continue;
    const prev = i === 0 ? '' : joined[i - 1];
    const next = i === joined.length - 1 ? '' : joined[i + 1];
    decisions[i] = classify(prev, next);
  }

  let pendingDouble = 'open';
  let pendingSingle = 'open';
  const out = [];
  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i];
    if (ch === '"') {
      const decision = decisions[i] ?? pendingDouble;
      pendingDouble = decision === 'open' ? 'close' : 'open';
      out.push(decision === 'open' ? OPEN_D : CLOSE_D);
    } else if (ch === "'") {
      const decision = decisions[i] ?? pendingSingle;
      pendingSingle = decision === 'open' ? 'close' : 'open';
      out.push(decision === 'open' ? OPEN_S : CLOSE_S);
    } else {
      out.push(ch);
    }
  }

  const newJoined = out.join('');
  let cursor = 0;
  for (const node of textNodes) {
    const len = node.value.length;
    node.value = newJoined.slice(cursor, cursor + len);
    cursor += len;
  }
}

export default function remarkCnQuotes() {
  return (tree) => {
    visit(tree, (node) => {
      if (!CONTAINERS.has(node.type)) return;
      const textNodes = [];
      visit(node, 'text', (t) => {
        textNodes.push(t);
      });
      transform(textNodes);
    });
  };
}
