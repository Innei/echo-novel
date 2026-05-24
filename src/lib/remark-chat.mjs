import { visit } from 'unist-util-visit';

/**
 * Parse a ```chat code block into structured messages.
 *
 * Format:
 *   > hello?              ← user EN (starts with ">")
 *   < 你好？              ← user CN (starts with "<")
 *
 *   Hello. How can...     ← Echo EN (no prefix)
 *   < 你好。有什么...     ← Echo CN (starts with "<")
 *
 *   $ ls -la              ← Echo invokes a shell command (starts with "$ ")
 *   ~ drwxr-xr-x ...      ← stdout from the command (starts with "~ ")
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
    } else if (line.startsWith('$')) {
      // ── Echo's tool invocation (shell command) ──
      messages.push({
        role: 'cmd',
        text: line.replace(/^\$\s?/, ''),
      });
      i++;
    } else if (line.startsWith('~')) {
      // ── Command stdout / return ──
      messages.push({
        role: 'output',
        text: line.replace(/^~\s?/, ''),
      });
      i++;
    } else {
      // ── Echo message (English, no prefix) ──
      const enLines = [];
      while (
        i < lines.length &&
        !lines[i].startsWith('>') &&
        !lines[i].startsWith('<') &&
        !lines[i].startsWith('$') &&
        !lines[i].startsWith('~')
      ) {
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

function isTerminalRole(role) {
  return role === 'cmd' || role === 'output';
}

function renderChatHTML(messages) {
  let html = '<div class="chat-block">';
  html += '<div class="chat-body">';

  for (let mi = 0; mi < messages.length; mi++) {
    const msg = messages[mi];

    if (msg.role === 'user') {
      for (const enLine of msg.en.split('\n')) {
        html += `<div class="chat-line chat-line--input"><span class="chat-prompt">&gt;</span> <span class="chat-en">${escapeHtml(enLine)}</span></div>`;
      }
    } else if (msg.role === 'cmd') {
      html += `<div class="chat-line chat-line--cmd"><span class="chat-prompt">$</span> <span class="chat-en">${escapeHtml(msg.text)}</span></div>`;
    } else if (msg.role === 'output') {
      html += `<div class="chat-line chat-line--output"><span class="chat-en">${escapeHtml(msg.text)}</span></div>`;
    } else {
      // Echo response
      const enLines = msg.en.split('\n');
      for (const enLine of enLines) {
        if (enLine.trim() === '') {
          html += '<div class="chat-line chat-line--empty">&nbsp;</div>';
        } else {
          html += `<div class="chat-line chat-line--echo"><span class="chat-en">${escapeHtml(enLine)}</span></div>`;
        }
      }
    }

    // Chinese translation (if present) — only for user/echo, not cmd/output
    if (msg.cn) {
      for (const cnLine of msg.cn.split('\n')) {
        if (cnLine.trim() === '') {
          html += '<div class="chat-line chat-line--cn-empty">&nbsp;</div>';
        } else {
          html += `<div class="chat-line chat-line--cn"><span class="chat-cn">${escapeHtml(cnLine)}</span></div>`;
        }
      }
    }

    // Blank line between messages (except last) — but suppress between
    // consecutive terminal lines (cmd→output, output→output, cmd→cmd)
    if (mi < messages.length - 1) {
      const next = messages[mi + 1];
      const bothTerminal = isTerminalRole(msg.role) && isTerminalRole(next.role);
      if (!bothTerminal) {
        html += '<div class="chat-line chat-line--empty">&nbsp;</div>';
      }
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
