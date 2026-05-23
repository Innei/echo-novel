#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('../src/content/chapters/', import.meta.url);
const MAX_SCAN_LINES = 60;
const MIN_LEN = 4;
const MAX_LEN = 60;

const splitFrontmatter = (text) => {
  if (!text.startsWith('---\n')) return { fm: null, body: text };
  const end = text.indexOf('\n---', 4);
  if (end < 0) return { fm: null, body: text };
  const fm = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n/, '');
  return { fm, body };
};

const hasEpigraph = (fm) => /^epigraph:\s*/m.test(fm);

const pickEpigraph = (body) => {
  const lines = body.split('\n').slice(0, MAX_SCAN_LINES);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('```') || trimmed.startsWith('---')) continue;

    // Look for "...", “...”, or 「...」
    const patterns = [
      /["“]([^"“”]{1,80}?)["”]/,
      /「([^「」]{1,80}?)」/,
    ];
    for (const pat of patterns) {
      const m = trimmed.match(pat);
      if (m) {
        const candidate = m[1].trim();
        if (candidate.length >= MIN_LEN && candidate.length <= MAX_LEN) {
          return candidate;
        }
      }
    }
  }
  return null;
};

const escapeForYaml = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const main = async () => {
  const entries = (await readdir(ROOT)).filter((f) => f.endsWith('.md')).sort();
  let added = 0;
  let skipped = 0;
  let empty = 0;

  for (const file of entries) {
    const path = join(ROOT.pathname, file);
    const text = await readFile(path, 'utf8');
    const { fm, body } = splitFrontmatter(text);
    if (!fm) {
      console.warn(`! ${file}: no frontmatter, skipping`);
      continue;
    }
    if (hasEpigraph(fm)) {
      skipped += 1;
      continue;
    }
    const epi = pickEpigraph(body);
    if (!epi) {
      empty += 1;
      console.log(`  ${file}: no candidate`);
      continue;
    }
    const newFm = `${fm.trimEnd()}\nepigraph: "${escapeForYaml(epi)}"`;
    const newText = `---\n${newFm}\n---\n\n${body}`;
    await writeFile(path, newText, 'utf8');
    added += 1;
    console.log(`✓ ${file}: ${epi}`);
  }

  console.log(`\n${added} added, ${skipped} already had epigraph, ${empty} no candidate`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
