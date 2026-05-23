import { visit } from 'unist-util-visit';

/**
 * Parse a ```chat code block into structured messages.
 *
 * Format C:
 *   > hello?           ← user EN (starts with ">")
 *   < 你好？           ← user CN (starts with "<")
 *
 *   Hello. How can...  ← Echo EN (no prefix)
 *   < 你好。有什么...  ← Echo CN (starts with "<")
 */
function parseChat(content) {
  const lines = content.split('\n');
  const messages = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip leading blank lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    if (line.startsWith('>')) {
      // ── User message ──
      const enLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        enLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const cnLines = [];
      while (i < lines.length && lines[i].startsWith('<')) {
        cnLines.push(lines[i].replace(/^<\s?/, ''));
        i++;
      }
      messages.push({
        role: 'user',
        en: enLines.join('\n').trim(),
        cn: cnLines.join('\n').trim(),
      });
    } else if (line.startsWith('<')) {
      // Orphan CN lines — attach to previous message
      const cnLines = [];
      while (i < lines.length && lines[i].startsWith('<')) {
        cnLines.push(lines[i].replace(/^<\s?/, ''));
        i++;
      }
      if (messages.length > 0) {
        const prev = messages[messages.length - 1];
        prev.cn = (prev.cn ? prev.cn + '\n' : '') + cnLines.join('\n');
      }
    } else {
      // ── Echo message (English, no prefix) ──
      const enLines = [];
      while (i < lines.length && !lines[i].startsWith('>') && !lines[i].startsWith('<')) {
        enLines.push(lines[i]);
        i++;
      }
      const cnLines = [];
      while (i < lines.length && lines[i].startsWith('<')) {
        cnLines.push(lines[i].replace(/^<\s?/, ''));
        i++;
      }
      const en = enLines.join('\n').trim();
      if (en) {
        messages.push({
          role: 'echo',
          en,
          cn: cnLines.join('\n').trim(),
        });
      }
    }
  }

  return messages;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderChatHTML(messages) {
  let html = '<div class="chat-block">';
  html += '<div class="chat-body">';

  for (let mi = 0; mi < messages.length; mi++) {
    const msg = messages[mi];
    const isUser = msg.role === 'user';

    if (isUser) {
      // User input — echo what was typed with > prompt
      for (const enLine of msg.en.split('\n')) {
        html += `<div class="chat-line chat-line--input"><span class="chat-prompt">&gt;</span> <span class="chat-en">${escapeHtml(enLine)}</span></div>`;
      }
    } else {
      // Echo response — plain text
      const enLines = msg.en.split('\n');
      for (const enLine of enLines) {
        if (enLine.trim() === '') {
          html += '<div class="chat-line chat-line--empty">&nbsp;</div>';
        } else {
          html += `<div class="chat-line chat-line--echo"><span class="chat-en">${escapeHtml(enLine)}</span></div>`;
        }
      }
    }

    // Chinese translation (if present)
    if (msg.cn) {
      for (const cnLine of msg.cn.split('\n')) {
        if (cnLine.trim() === '') {
          html += '<div class="chat-line chat-line--cn-empty">&nbsp;</div>';
        } else {
          html += `<div class="chat-line chat-line--cn"><span class="chat-cn">${escapeHtml(cnLine)}</span></div>`;
        }
      }
    }

    // Blank line between messages (except last)
    if (mi < messages.length - 1) {
      html += '<div class="chat-line chat-line--empty">&nbsp;</div>';
    }
  }

  html += '</div></div>';
  return html;
}

export default function remarkChat() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'chat') return;

      const messages = parseChat(node.value);
      if (messages.length === 0) return;

      const html = renderChatHTML(messages);
      parent.children.splice(index, 1, {
        type: 'html',
        value: html,
      });
    });
  };
}
