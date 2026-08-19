import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({ gfm: true, breaks: false });

const renderer = new marked.Renderer();

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = (lang ?? '').trim();
  // Rendered in the browser by MermaidDiagrams, which only loads on pages
  // that actually contain a diagram.
  if (language === 'mermaid') {
    return `<div class="mermaid-diagram" data-mermaid="${escapeHtml(text)}"></div>`;
  }
  if (!language) {
    return `<pre><code class="hljs">${escapeHtml(text)}</code></pre>`;
  }
  const resolvedLang = hljs.getLanguage(language) ? language : 'plaintext';
  let highlighted: string;
  try {
    highlighted = hljs.highlight(text, { language: resolvedLang }).value;
  } catch {
    highlighted = hljs.highlightAuto(text).value;
  }
  return `<pre><span class="code-lang">${escapeHtml(language)}</span><code class="hljs language-${resolvedLang}">${highlighted}</code></pre>`;
};

renderer.heading = function ({ text, depth }: { text: string; depth: number }) {
  const plain = text.replace(/<[^>]+>/g, '');
  const id = plain
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

/**
 * Rewrites relative `.md` links to real routes. Authored links are relative to
 * the file on disk, but pages are served with a trailing slash, so resolving
 * them in the browser lands one directory too deep.
 */
function resolveDocLink(href: string, fromSlug: string[]): string {
  if (!href.endsWith('.md')) return href;
  if (/^[a-z]+:/i.test(href) || href.startsWith('/')) return href;

  const parts = fromSlug.slice(0, -1);
  for (const segment of href.replace(/\.md$/, '').split('/')) {
    if (segment === '.' || segment === '') continue;
    if (segment === '..') parts.pop();
    else parts.push(segment);
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}/${parts.join('/')}/`;
}

/** Runs at build time only — highlight.js must never reach the browser. */
export function renderMarkdown(markdown: string, slug: string[] = []): string {
  const localRenderer = new marked.Renderer();
  Object.assign(localRenderer, renderer);
  localRenderer.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const resolved = resolveDocLink(href, slug);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${resolved}"${titleAttr}>${text}</a>`;
  };
  return marked(markdown, { renderer: localRenderer }) as string;
}
