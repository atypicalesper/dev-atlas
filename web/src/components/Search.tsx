'use client';

import { useState, useEffect, useRef, useCallback, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Search as SearchIcon, X, ArrowRight, Clock, Hash, TrendingUp, Shuffle, Heart, Layers3, Brain, Server, Bot, Wrench, FileText, Palette, RotateCcw, Map, Home, Printer, PenLine, Command, Sparkles, type LucideIcon } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { SearchItem } from '@/lib/docs';
import { getBookmarks, toggleBookmark } from '@/lib/progress';
import { useNotebook } from '@/lib/notebook';

// Fetched once per session, then reused across dialog opens
let indexCache: SearchItem[] | null = null;
let indexPromise: Promise<SearchItem[]> | null = null;

function loadSearchIndex(): Promise<SearchItem[]> {
  if (indexCache) return Promise.resolve(indexCache);
  if (!indexPromise) {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
    indexPromise = fetch(`${base}/search-index.json`)
      .then(res => res.json())
      .then((data: SearchItem[]) => {
        indexCache = data;
        return data;
      });
  }
  return indexPromise;
}

interface Props {
  onClose: () => void;
}

const RECENT_KEY = 'niprep_searches';
const SUGGESTED = ['event loop', 'promises', 'TypeScript generics', 'system design', 'SQL joins', 'Docker', 'JWT', 'SOLID'];
const SECTION_FILTERS = [
  { label: 'AI', value: 'ai', icon: Bot },
  { label: 'Node', value: 'node', icon: Server },
  { label: 'React', value: 'react', icon: Brain },
  { label: 'Engineering', value: 'engineering', icon: Wrench },
];
const KIND_FILTERS: Array<{ label: string; value: SearchItem['kind']; icon: typeof FileText }> = [
  { label: 'Guides', value: 'guide', icon: FileText },
  { label: 'Interview', value: 'interview', icon: Layers3 },
  { label: 'Cheatsheets', value: 'cheatsheet', icon: Heart },
];

const PALETTE_THEMES = ['light', 'paper', 'dark', 'midnight', 'ocean', 'forest', 'dawn', 'slate'];

interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  keywords: string;
  run: () => void;
}

function scoreAction(action: PaletteAction, q: string): number {
  if (!q) return 1;
  const label = action.label.toLowerCase();
  let points = 0;
  if (label.includes(q)) points += 50;
  for (const token of q.split(/\s+/).filter(Boolean)) {
    if (label.includes(token)) points += 14;
    if (action.keywords.includes(token)) points += 8;
  }
  return points;
}

function loadRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveSearch(query: string, existing: string[]): string[] {
  if (!query.trim()) return existing;
  const updated = [query, ...existing.filter(s => s !== query)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  return updated;
}

function parseQuery(raw: string): {
  text: string;
  section?: string;
  kind?: SearchItem['kind'];
} {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const textTokens: string[] = [];
  let section: string | undefined;
  let kind: SearchItem['kind'] | undefined;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower.startsWith('section:')) {
      section = lower.replace('section:', '');
      continue;
    }
    if (lower.startsWith('kind:')) {
      const nextKind = lower.replace('kind:', '');
      if (nextKind === 'cheatsheet' || nextKind === 'interview' || nextKind === 'guide') {
        kind = nextKind;
        continue;
      }
    }
    textTokens.push(token);
  }

  return { text: textTokens.join(' ').toLowerCase().trim(), section, kind };
}

function itemHref(item: SearchItem): string {
  const base = '/' + item.slug.join('/');
  return item.headingId ? `${base}#${item.headingId}` : base;
}

/** Bounded edit distance — returns maxDist + 1 as soon as it is exceeded. */
function editDistance(a: string, b: string, maxDist: number): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }
    if (best > maxDist) return maxDist + 1;
    prev = row;
  }
  return prev[b.length];
}

/** Typo tolerance: 1 edit for short words, 2 for longer ones. */
function fuzzyMatches(token: string, text: string): boolean {
  if (token.length < 4) return false;
  const maxDist = token.length >= 8 ? 2 : 1;
  for (const word of text.split(/[^a-z0-9]+/)) {
    if (word.length < 3) continue;
    if (editDistance(token, word, maxDist) <= maxDist) return true;
  }
  return false;
}

/** "eventloop" should still find "event loop". */
function matchesIgnoringSeparators(token: string, text: string): boolean {
  if (token.length < 6) return false;
  return text.replace(/[^a-z0-9]+/g, '').includes(token);
}

function matchItems(query: string, items: SearchItem[]): SearchItem[] {
  const parsed = parseQuery(query);
  const q = parsed.text;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (!q && !parsed.section && !parsed.kind) return [];

  function score(item: SearchItem): number {
    const title = item.title.toLowerCase();
    const section = item.section.toLowerCase();
    const excerpt = item.excerpt.toLowerCase();
    const path = item.path.toLowerCase();
    const heading = (item.headingText ?? '').toLowerCase();

    let points = 0;
    if (parsed.section) {
      if (section === parsed.section) points += 60;
      else if (!section.includes(parsed.section)) return 0;
    }
    if (parsed.kind) {
      if (item.kind === parsed.kind) points += 40;
      else return 0;
    }

    if (item.headingText) {
      // Heading entries: score mainly on the heading text match
      if (heading === q) points += 160;
      else if (heading.startsWith(q)) points += 100;
      else if (heading.includes(q)) points += 70;
      for (const token of tokens) {
        if (heading.includes(token)) points += 20;
      }
      if (title.includes(q)) points += 20;
      // Fall back to forgiving matches only when nothing matched exactly
      if (points === 0) {
        if (matchesIgnoringSeparators(q, heading)) points += 30;
        else if (tokens.every(token => fuzzyMatches(token, heading))) points += 14;
      }
      // Slightly penalise heading items so exact title matches surface first
      points = Math.max(0, points - 5);
    } else {
      if (title === q) points += 140;
      if (title.startsWith(q)) points += 90;
      if (title.includes(q)) points += 60;
      if (path.includes(q)) points += 45;
      if (section.includes(q)) points += 20;
      if (excerpt.includes(q)) points += 15;
      for (const token of tokens) {
        if (title.includes(token)) points += 18;
        if (path.includes(token)) points += 12;
        if (section.includes(token)) points += 8;
        if (excerpt.includes(token)) points += 4;
      }
      if (tokens.every(token => title.includes(token) || path.includes(token) || excerpt.includes(token))) {
        points += 24;
      }
      // Fall back to forgiving matches only when nothing matched exactly
      if (points === 0) {
        if (matchesIgnoringSeparators(q, title)) points += 40;
        else if (matchesIgnoringSeparators(q, path)) points += 22;
        else if (tokens.every(token => fuzzyMatches(token, title))) points += 18;
        else if (tokens.every(token => fuzzyMatches(token, path))) points += 10;
      }
    }

    return points;
  }

  // Deduplicate: for heading items, only show if score > doc-level score for same slug
  const scored = items
    .map(item => ({ item, score: score(item) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  // Cap at 10 results, at most 3 heading items
  const out: SearchItem[] = [];
  let headingCount = 0;
  for (const { item } of scored) {
    if (item.headingText) {
      if (headingCount >= 3) continue;
      headingCount++;
    }
    out.push(item);
    if (out.length >= 10) break;
  }
  return out;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function Search({ onClose }: Props) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { notebook, toggleNotebook } = useNotebook();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SearchItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [recents, setRecents]   = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [index, setIndex]       = useState<SearchItem[]>(() => indexCache ?? []);
  const inputRef    = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(backdropRef.current, { opacity: 0, duration: 0.2 });
    gsap.from(panelRef.current, { opacity: 0, y: -14, scale: 0.97, duration: 0.24, ease: 'power3.out' });
  });

  useEffect(() => {
    setRecents(loadRecentSearches());
    setBookmarks(getBookmarks());
    if (!indexCache) loadSearchIndex().then(setIndex);
  }, []);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    setResults(matchItems(query, index));
    setSelected(0);
  }, [query, index]);

  const handleClose = useCallback(
    (saveQuery?: string) => {
      if (saveQuery) setRecents(prev => saveSearch(saveQuery, prev));
      onClose();
    },
    [onClose],
  );

  const openRandom = useCallback(() => {
    const random = index[Math.floor(Math.random() * index.length)];
    if (!random) return;
    handleClose();
    router.push('/' + random.slug.join('/'));
  }, [index, handleClose, router]);

  const openBookmarked = useCallback(() => {
    const firstBookmark = bookmarks[0];
    if (!firstBookmark) return;
    handleClose();
    router.push('/' + firstBookmark);
  }, [bookmarks, handleClose, router]);

  // ── Command-palette actions ─────────────────────────────────────────────
  const actions: PaletteAction[] = (() => {
    const go = (href: string) => () => { handleClose(); router.push(href); };
    return [
      { id: 'random', label: 'Open a random doc', icon: Shuffle, keywords: 'random surprise lucky shuffle', run: () => openRandom() },
      { id: 'review', label: 'Go to Review mode', icon: RotateCcw, keywords: 'review srs spaced repetition flashcards missed due', run: go('/review') },
      { id: 'pathway', label: 'Open My Pathways', icon: Map, keywords: 'pathway path plan saved sequence', run: go('/pathway') },
      { id: 'sprint', label: 'Open DSA Sprint', icon: Sparkles, keywords: 'dsa sprint special algorithms leetcode practice', run: go('/special') },
      { id: 'home', label: 'Go to Home', icon: Home, keywords: 'home start atlas index dashboard', run: go('/') },
      { id: 'notebook', label: notebook ? 'Turn off notebook mode' : 'Turn on notebook mode', icon: PenLine, keywords: 'notebook sketch hand drawn rough doodle handwritten', run: () => { handleClose(); toggleNotebook(); } },
      { id: 'shortcuts', label: 'Show keyboard shortcuts', icon: Command, keywords: 'shortcuts keyboard keys help hotkeys', run: () => { handleClose(); window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' })); } },
      { id: 'print', label: 'Print this page', icon: Printer, keywords: 'print pdf save export paper', run: () => { handleClose(); window.print(); } },
      ...PALETTE_THEMES.map((t): PaletteAction => ({
        id: `theme-${t}`,
        label: `Switch to ${t.charAt(0).toUpperCase()}${t.slice(1)} theme`,
        hint: 'theme',
        icon: Palette,
        keywords: `theme ${t} color colour appearance dark light mode`,
        run: () => { handleClose(); setTheme(t); },
      })),
    ];
  })();

  const isCommandMode = query.trimStart().startsWith('>');
  const actionQuery = (isCommandMode ? query.trimStart().slice(1) : query).trim().toLowerCase();
  const matchedActions: PaletteAction[] = (() => {
    const cap = isCommandMode ? 8 : 3;
    if (!isCommandMode && !actionQuery) return [];
    return actions
      .map(a => ({ a, s: scoreAction(a, actionQuery) }))
      .filter(e => e.s > 0)
      .sort((x, y) => y.s - x.s)
      .map(e => e.a)
      .slice(0, cap);
  })();

  const docResults = isCommandMode ? [] : results;
  const totalSelectable = matchedActions.length + docResults.length;

  const runSelected = useCallback(() => {
    if (selected < matchedActions.length) {
      matchedActions[selected]?.run();
      return;
    }
    const item = docResults[selected - matchedActions.length];
    if (!item) return;
    handleClose(query);
    router.push(itemHref(item));
  }, [selected, matchedActions, docResults, handleClose, query, router]);

  const applyFilter = useCallback((fragment: string) => {
    setQuery(current => {
      const parsed = parseQuery(current);
      const pieces = [parsed.text].filter(Boolean);
      if (fragment.startsWith('section:')) {
        if (parsed.kind) pieces.push(`kind:${parsed.kind}`);
        pieces.push(fragment);
      } else if (fragment.startsWith('kind:')) {
        if (parsed.section) pieces.push(`section:${parsed.section}`);
        pieces.push(fragment);
      } else {
        pieces.push(fragment);
      }
      return pieces.join(' ').trim();
    });
  }, []);

  const toggleResultBookmark = useCallback((slug: string, e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = toggleBookmark(slug);
    setBookmarks(current => {
      const next = saved ? [slug, ...current.filter(entry => entry !== slug)] : current.filter(entry => entry !== slug);
      return next.slice(0, 50);
    });
  }, []);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, totalSelectable - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && totalSelectable > 0) {
        e.preventDefault();
        runSelected();
      }
    },
    [handleClose, totalSelectable, runSelected],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={() => handleClose()}
    >
      <div
        ref={panelRef}
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <SearchIcon size={17} style={{ color: 'var(--muted)' }} className="shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search docs, or type > for commands…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--fg)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-[var(--card-bg)] transition-colors"
              aria-label="Clear"
            >
              <X size={14} style={{ color: 'var(--muted)' }} />
            </button>
          )}
          <button
            onClick={() => handleClose()}
            className="p-1 rounded hover:bg-[var(--card-bg)] transition-colors"
            aria-label="Close search"
          >
            <X size={15} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        <div className="px-4 py-2 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap gap-2">
            {SECTION_FILTERS.map(filter => {
              const Icon = filter.icon;
              const active = parseQuery(query).section === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => applyFilter(`section:${filter.value}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: active ? 'var(--sidebar-active)' : 'transparent',
                    color: active ? 'var(--sidebar-active-text)' : 'var(--muted)',
                  }}
                >
                  <Icon size={11} />
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {KIND_FILTERS.map(filter => {
              const Icon = filter.icon;
              const active = parseQuery(query).kind === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => applyFilter(`kind:${filter.value}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: active ? 'var(--sidebar-active)' : 'transparent',
                    color: active ? 'var(--sidebar-active-text)' : 'var(--muted)',
                  }}
                >
                  <Icon size={11} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {(matchedActions.length > 0 || docResults.length > 0) ? (
          <div className="max-h-[24rem] overflow-y-auto">
            {matchedActions.length > 0 && (
              <>
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
                >
                  <Command size={11} /> Actions
                </div>
                <ul className="py-1.5">
                  {matchedActions.map((action, i) => {
                    const Icon = action.icon;
                    const isSel = i === selected;
                    return (
                      <li key={action.id}>
                        <button
                          onClick={() => action.run()}
                          onMouseEnter={() => setSelected(i)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{ backgroundColor: isSel ? 'var(--sidebar-active)' : undefined }}
                        >
                          <Icon size={15} className="shrink-0" style={{ color: isSel ? 'var(--sidebar-active-text)' : 'var(--muted)' }} />
                          <span className="flex-1 text-sm font-medium" style={{ color: isSel ? 'var(--sidebar-active-text)' : 'var(--fg)' }}>
                            {action.label}
                          </span>
                          {action.hint && (
                            <span className="rounded-full px-1.5 py-0.5 text-[10px] uppercase" style={{ backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-active-text)' }}>
                              {action.hint}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {docResults.length > 0 && (
              <>
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', borderTop: matchedActions.length > 0 ? '1px solid var(--border)' : undefined }}
                >
                  {docResults.length} result{docResults.length !== 1 ? 's' : ''}
                </div>
                <ul className="py-1.5">
                  {docResults.map((item, i) => {
                    const idx = matchedActions.length + i;
                    const isSel = idx === selected;
                    return (
                    <li key={item.headingId ? `${item.slug.join('/')}#${item.headingId}` : item.slug.join('/')}>
                      <Link
                        href={itemHref(item)}
                        onClick={() => handleClose(query)}
                        onMouseEnter={() => setSelected(idx)}
                        className="flex items-start gap-3 px-4 py-2.5 transition-colors"
                        style={{ backgroundColor: isSel ? 'var(--sidebar-active)' : undefined }}
                      >
                        {item.headingText && (
                          <Hash size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--muted)' }} />
                        )}
                        <div className="flex-1 min-w-0">
                          {item.headingText ? (
                            <>
                              <div
                                className="text-sm font-medium leading-snug"
                                style={{ color: isSel ? 'var(--sidebar-active-text)' : 'var(--fg)' }}
                              >
                                <Highlight text={item.headingText} query={query} />
                              </div>
                              <div className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                                in {item.title} · {item.section}
                              </div>
                            </>
                          ) : (
                            <>
                              <div
                                className="text-sm font-medium leading-snug"
                                style={{ color: isSel ? 'var(--sidebar-active-text)' : 'var(--fg)' }}
                              >
                                <Highlight text={item.title} query={query} />
                              </div>
                              {item.section && (
                                <div className="mt-0.5 flex items-center gap-2">
                                  <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                    {item.path}
                                  </div>
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[10px] uppercase"
                                    style={{ backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-active-text)' }}
                                  >
                                    {item.kind}
                                  </span>
                                </div>
                              )}
                              {item.excerpt && (
                                <div className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--muted)' }}>
                                  <Highlight text={item.excerpt} query={query} />
                                </div>
                              )}
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  onClick={e => toggleResultBookmark(item.slug.join('/'), e)}
                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors hover:bg-[var(--sidebar-hover)]"
                                  style={{
                                    borderColor: 'var(--border)',
                                    backgroundColor: bookmarks.includes(item.slug.join('/')) ? 'var(--sidebar-active)' : 'transparent',
                                    color: bookmarks.includes(item.slug.join('/')) ? 'var(--sidebar-active-text)' : 'var(--muted)',
                                  }}
                                >
                                  <Heart size={10} fill={bookmarks.includes(item.slug.join('/')) ? 'currentColor' : 'none'} />
                                  {bookmarks.includes(item.slug.join('/')) ? 'Saved' : 'Save'}
                                </button>
                                <button
                                  onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    applyFilter(`section:${item.section.toLowerCase()}`);
                                  }}
                                  className="rounded-full border px-2 py-0.5 text-[10px] transition-colors hover:bg-[var(--sidebar-hover)]"
                                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                                >
                                  More {item.section}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <ArrowRight size={13} className="shrink-0 mt-1" style={{ color: 'var(--muted)' }} />
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

        ) : query && !isCommandMode && index.length === 0 ? (
          /* Index still in flight — not the same thing as no matches */
          <div className="px-4 py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading search index…</p>
          </div>

        ) : query ? (
          /* No results */
          <div className="px-4 py-6 text-center">
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
              {isCommandMode ? 'No matching commands' : <>No results for &ldquo;{query}&rdquo;</>}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isCommandMode ? 'Try: theme, review, random, notebook, print' : 'Try: event loop, generics, Redis, Docker, JWT, SOLID…'}
            </p>
          </div>

        ) : (
          /* Empty state: recents + suggested */
          <div className="py-2 max-h-[22rem] overflow-y-auto">
            {recents.length > 0 && (
              <div className="mb-1">
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--muted)' }}
                >
                  <Clock size={11} /> Recent
                </div>
                {recents.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="w-full px-4 py-2 text-sm text-left flex items-center gap-2.5 transition-colors hover:bg-[var(--sidebar-hover)]"
                    style={{ color: 'var(--fg)' }}
                  >
                    <Clock size={13} style={{ color: 'var(--muted)' }} className="shrink-0" />
                    {s}
                  </button>
                ))}
                <div className="border-t mx-4 my-1" style={{ borderColor: 'var(--border)' }} />
              </div>
            )}

            <div>
              <div
                className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--muted)' }}
              >
                <TrendingUp size={11} /> Popular topics
              </div>
              <div className="px-4 py-2 flex flex-wrap gap-2">
                {SUGGESTED.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-3 py-1 rounded-full text-xs transition-colors border hover:bg-[var(--sidebar-hover)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t mx-4 my-1" style={{ borderColor: 'var(--border)' }} />

            <div>
              <div
                className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted)' }}
              >
                Quick Actions
              </div>
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                <button
                  onClick={openRandom}
                  className="px-3 py-1 rounded-full text-xs transition-colors border hover:bg-[var(--sidebar-hover)] inline-flex items-center gap-1.5"
                  style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                >
                  <Shuffle size={11} />
                  Random doc
                </button>
                <button
                  onClick={() => setQuery('kind:cheatsheet')}
                  className="px-3 py-1 rounded-full text-xs transition-colors border hover:bg-[var(--sidebar-hover)] inline-flex items-center gap-1.5"
                  style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                >
                  <Layers3 size={11} />
                  Cheatsheets
                </button>
                <button
                  onClick={openBookmarked}
                  disabled={bookmarks.length === 0}
                  className="px-3 py-1 rounded-full text-xs transition-colors border hover:bg-[var(--sidebar-hover)] inline-flex items-center gap-1.5 disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                >
                  <Heart size={11} />
                  First bookmark
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer hints */}
        <div
          className="flex items-center gap-4 px-4 py-2 border-t text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <span><kbd className="kbd">↑↓</kbd> navigate</span>
          <span><kbd className="kbd">↵</kbd> open</span>
          <span><kbd className="kbd">esc</kbd> close</span>
          <span><kbd className="kbd">&gt;</kbd> commands</span>
        </div>
      </div>
    </div>
  );
}
