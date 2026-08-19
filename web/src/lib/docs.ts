import fs from 'fs';
import path from 'path';
import { inferDifficulty, inferDocSkills, type Difficulty } from './learning';
import type { CompactDoc, CompactHeading, CompactSearchIndex } from './search-index';

// Absolute path to the markdown content directory
const DOCS_ROOT = path.join(process.cwd(), '..', 'docs');
const navCache = new Map<string, NavItem[]>();
const docCache = new Map<string, { content: string; title: string } | null>();
const dirCache = new Map<string, DirInfo | null>();
let allDocSlugsCache: string[][] | null = null;
let allDirSlugsCache: string[][] | null = null;
let searchIndexCache: CompactSearchIndex | null = null;
let docSummariesCache: DocSummary[] | null = null;

export interface Heading {
  depth: number;
  text: string;
  id: string;
}

export interface SearchItem {
  title: string;
  slug: string[];
  excerpt: string;
  section: string;
  path: string;
  kind: 'cheatsheet' | 'interview' | 'guide';
  headingId?: string;
  headingText?: string;
}

export interface NavItem {
  title: string;
  slug: string[];
  children?: NavItem[];
}

export interface DocSummary {
  title: string;
  slug: string[];
  href: string;
  section: string;
  excerpt: string;
  wordCount: number;
  kind: 'cheatsheet' | 'interview' | 'guide';
  skills: string[];
  difficulty: Difficulty;
}

const ACRONYMS: Record<string, string> = {
  cicd: 'CI/CD',
  api: 'API',
  hld: 'HLD',
  lld: 'LLD',
  sql: 'SQL',
  nosql: 'NoSQL',
  orm: 'ORM',
  jwt: 'JWT',
  grpc: 'gRPC',
  qa: 'Q&A',
  ai: 'AI',
  ml: 'ML',
  rag: 'RAG',
  ui: 'UI',
  ux: 'UX',
  dsa: 'DSA',
  sse: 'SSE',
  e2e: 'E2E',
};

/** Convert a file/directory name like "01-event-loop" → "Event Loop" */
export function humanize(name: string): string {
  return name
    .replace(/^\d+-/, '')           // strip leading "01-"
    .split('-')
    .map(word => ACRONYMS[word.toLowerCase()] ?? (word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

/** Recursively build the navigation tree from the docs directory */
export function buildNavTree(dir: string = DOCS_ROOT, prefix: string[] = []): NavItem[] {
  const cacheKey = `${dir}::${prefix.join('/')}`;
  const cached = navCache.get(cacheKey);
  if (cached) return cached;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // Sort: directories first by name, then files
  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const items: NavItem[] = [];

  for (const entry of entries) {
    // Skip hidden files, non-md files at top level, READMEs
    if (entry.name.startsWith('.')) continue;
    if (entry.name === 'README.md') continue;

    if (entry.isDirectory()) {
      const slug = [...prefix, entry.name];
      const children = buildNavTree(path.join(dir, entry.name), slug);
      if (children.length === 0) continue;
      items.push({
        title: humanize(entry.name),
        slug,
        children,
      });
    } else if (entry.name.endsWith('.md')) {
      const slug = [...prefix, entry.name.replace(/\.md$/, '')];
      items.push({
        title: humanize(entry.name.replace(/\.md$/, '')),
        slug,
      });
    }
  }

  navCache.set(cacheKey, items);
  return items;
}

/** Resolve a slug array to a file path and return its content */
export function getDocContent(slug: string[]): { content: string; title: string } | null {
  const cacheKey = slug.join('/');
  if (docCache.has(cacheKey)) return docCache.get(cacheKey) ?? null;

  const mdPath = path.join(DOCS_ROOT, ...slug) + '.md';
  if (fs.existsSync(mdPath)) {
    const content = fs.readFileSync(mdPath, 'utf-8');
    const title = extractTitle(content) ?? humanize(slug[slug.length - 1]);
    const result = { content, title };
    docCache.set(cacheKey, result);
    return result;
  }
  docCache.set(cacheKey, null);
  return null;
}

export interface DirInfo {
  title: string;
  children: NavItem[];
}

/** Resolve a slug to a directory and return its children for an index page */
export function getDirInfo(slug: string[]): DirInfo | null {
  const cacheKey = slug.join('/');
  if (dirCache.has(cacheKey)) return dirCache.get(cacheKey) ?? null;

  const dirPath = path.join(DOCS_ROOT, ...slug);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return null;
  const title = humanize(slug[slug.length - 1]);
  const children = buildNavTree(dirPath, slug);
  if (children.length === 0) {
    dirCache.set(cacheKey, null);
    return null;
  }
  const result = { title, children };
  dirCache.set(cacheKey, result);
  return result;
}

function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function getWordCount(markdown: string): number {
  return markdown.trim().split(/\s+/).length;
}

function getDocKind(slug: string[]): 'cheatsheet' | 'interview' | 'guide' {
  const slugPath = slug.join('/').toLowerCase();
  if (slug[0] === 'cheatsheets' || slugPath.includes('cheat-sheet') || slugPath.includes('cheatsheet')) {
    return 'cheatsheet';
  }
  if (slugPath.includes('interview') || slugPath.includes('rapid-fire') || slugPath.includes('behavioral')) {
    return 'interview';
  }
  return 'guide';
}

/** Return all valid doc slugs (for static generation) */
export function getAllDocSlugs(): string[][] {
  if (allDocSlugsCache) return allDocSlugsCache;

  const slugs: string[][] = [];

  function walk(dir: string, prefix: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'README.md') continue;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), [...prefix, entry.name]);
      } else if (entry.name.endsWith('.md')) {
        slugs.push([...prefix, entry.name.replace(/\.md$/, '')]);
      }
    }
  }

  walk(DOCS_ROOT, []);
  allDocSlugsCache = slugs;
  return slugs;
}

/** Return all directory slugs (so /section/subsection URLs don't 404) */
export function getAllDirSlugs(): string[][] {
  if (allDirSlugsCache) return allDirSlugsCache;

  const slugs: string[][] = [];

  function walk(dir: string, prefix: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) {
        const slug = [...prefix, entry.name];
        slugs.push(slug);
        walk(path.join(dir, entry.name), slug);
      }
    }
  }

  walk(DOCS_ROOT, []);
  allDirSlugsCache = slugs;
  return slugs;
}

/** Get the flat ordered list of all doc slugs for prev/next navigation */
function flattenNav(items: NavItem[]): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    if (item.children) {
      result.push(...flattenNav(item.children));
    } else {
      result.push(item);
    }
  }
  return result;
}

export function getPrevNext(currentSlug: string[]): {
  prev: NavItem | null;
  next: NavItem | null;
} {
  const nav = buildNavTree();
  const flat = flattenNav(nav);
  const key = currentSlug.join('/');
  const idx = flat.findIndex(item => item.slug.join('/') === key);

  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}

/** Extract h2/h3 headings from markdown for table of contents */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const depth = match[1].length;
    // Strip inline markdown (bold, italic, code, links) for display and ID
    const text = match[2]
      .trim()
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '');
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    headings.push({ depth, text, id });
  }
  return headings;
}

/** Extract a plain-text excerpt from markdown (first non-empty paragraph, truncated) */
export function extractExcerpt(markdown: string, maxLength = 155): string {
  const plain = markdown
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~>#|\\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength
    ? plain.slice(0, maxLength).replace(/\s+\S*$/, '') + '…'
    : plain;
}

/** Build a flat search index of all docs for client-side search */
export function buildSearchIndex(): CompactSearchIndex {
  if (searchIndexCache) return searchIndexCache;

  const docs: CompactDoc[] = [];
  const headings: CompactHeading[] = [];

  for (const slug of getAllDocSlugs()) {
    const doc = getDocContent(slug)!;
    const docIndex = docs.length;

    docs.push([
      doc.title,
      slug.join('/'),
      extractExcerpt(doc.content, 220),
      slug[0] ? humanize(slug[0]) : '',
      slug.map(part => humanize(part)).join(' / '),
      getDocKind(slug),
    ]);

    for (const heading of extractHeadings(doc.content)) {
      headings.push([docIndex, heading.text, heading.id]);
    }
  }

  searchIndexCache = { docs, headings };
  return searchIndexCache;
}

export function getDocSummaries(): DocSummary[] {
  if (docSummariesCache) return docSummariesCache;
  docSummariesCache = getAllDocSlugs().map(slug => {
    const doc = getDocContent(slug)!;
    return {
      title: doc.title,
      slug,
      href: '/' + slug.join('/'),
      section: slug[0] ? humanize(slug[0]) : '',
      excerpt: extractExcerpt(doc.content, 140),
      wordCount: getWordCount(doc.content),
      kind: getDocKind(slug),
      skills: inferDocSkills(slug, doc.title),
      difficulty: inferDifficulty(slug, getWordCount(doc.content)),
    };
  });
  return docSummariesCache;
}

export function getRelatedDocs(currentSlug: string[], limit = 3): DocSummary[] {
  const currentKey = currentSlug.join('/');
  const currentTitle = humanize(currentSlug[currentSlug.length - 1]).toLowerCase();
  const currentTokens = new Set(currentTitle.split(/\s+/).filter(Boolean));

  return getDocSummaries()
    .filter(doc => doc.slug.join('/') !== currentKey)
    .map(doc => {
      let score = 0;
      if (doc.slug[0] === currentSlug[0]) score += 12;
      const titleTokens = doc.title.toLowerCase().split(/\s+/).filter(Boolean);
      for (const token of titleTokens) {
        if (currentTokens.has(token)) score += 4;
      }
      if (doc.slug.slice(0, 2).join('/') === currentSlug.slice(0, 2).join('/')) score += 6;
      return { doc, score };
    })
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))
    .slice(0, limit)
    .map(entry => entry.doc);
}

export function findDocBySlug(slug: string[]): DocSummary | null {
  const key = slug.join('/');
  return getDocSummaries().find(doc => doc.slug.join('/') === key) ?? null;
}

export function getPracticeDoc(currentSlug: string[]): DocSummary | null {
  const section = currentSlug[0];
  const practiceMap: Record<string, string[] | undefined> = {
    javascript: ['engineering', '12-interview-practice', '01-rapid-fire-qa', '01-javascript-rapid-fire'],
    node: ['engineering', '12-interview-practice', '01-rapid-fire-qa', '02-nodejs-rapid-fire'],
    react: ['engineering', '12-interview-practice', '01-rapid-fire-qa', '04-react-rapid-fire'],
    ai: ['ai', '10-ai-evaluation', '02-interview-questions'],
    databases: ['databases', '09-interview-questions'],
    cloud: ['cloud', '03-interview-questions'],
    python: ['python', '08-interview-questions', '01-python-ai-interview-qs'],
    engineering: ['engineering', '12-interview-practice', '04-system-design-practice', '01-design-questions'],
    networks: ['networks', '08-interview-questions'],
  };
  const slug = practiceMap[section];
  return slug ? findDocBySlug(slug) : null;
}

export function getCompareDoc(currentSlug: string[]): DocSummary | null {
  const section = currentSlug[0];
  const compareMap: Record<string, string[] | undefined> = {
    javascript: ['javascript', '16-concurrency-models', '01-concurrency-comparison'],
    node: ['node', '07-api-design', '03-grpc', '01-grpc-vs-rest'],
    react: ['react', '19-runtimes', '01-bun-and-deno'],
    ai: ['ai', '14-local-llms', '05-serving-stack-ollama-vllm-mlx-and-ui-tools'],
    cloud: ['cloud', '07-ecs-vs-eks-vs-lambda'],
    databases: ['databases', '02-nosql', '01-mongodb-patterns'],
    networks: ['networks', '09-realtime-and-messaging'],
  };
  const slug = compareMap[section];
  return slug ? findDocBySlug(slug) : null;
}
