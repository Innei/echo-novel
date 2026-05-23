import { visit } from 'unist-util-visit';

const LEADING_QUOTE = /^["“「『]/;

export default function rehypeDropCap() {
  return (tree) => {
    let firstParaHandled = false;
    visit(tree, 'element', (node) => {
      if (firstParaHandled) return;
      if (node.tagName !== 'p') return;
      firstParaHandled = true;

      const props = (node.properties ||= {});
      const className = Array.isArray(props.className) ? [...props.className] : [];
      className.push('has-drop-cap');
      props.className = className;

      const firstChild = node.children?.[0];
      if (firstChild && firstChild.type === 'text' && LEADING_QUOTE.test(firstChild.value)) {
        const quoteChar = firstChild.value[0];
        const rest = firstChild.value.slice(1);
        node.children.splice(0, 1, {
          type: 'element',
          tagName: 'span',
          properties: { className: ['dc-quote'] },
          children: [{ type: 'text', value: quoteChar }],
        }, { type: 'text', value: rest });
      }
    });
  };
}
