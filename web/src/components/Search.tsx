'use client';

import { useState, useEffect, useRef, useCallback, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X, ArrowRight, Clock, TrendingUp, Shuffle, Heart, Layers3, Brain, Server, Bot, Wrench, FileText } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { SearchItem } from '@/lib/docs';
import { getBookmarks, toggleBookmark } from '@/lib/progress';

interface Props {
  index: SearchItem[];
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

    let points = 0;
    if (parsed.section) {
      if (section === parsed.section) points += 60;
      else if (!section.includes(parsed.section)) return 0;
    }
    if (parsed.kind) {
      if (item.kind === parsed.kind) points += 40;
      else return 0;
    }
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

    return points;
  }

  return items
    .map(item => ({ item, score: score(item) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map(entry => entry.item)
    .slice(0, 9);
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

export default function Search({ index, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SearchItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [recents, setRecents]   = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
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

  const openSelected = useCallback(() => {
    const item = results[selected];
    if (!item) return;
    handleClose(query);
    router.push('/' + item.slug.join('/'));
  }, [results, selected, handleClose, query, router]);

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
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) {
        e.preventDefault();
        openSelected();
      }
    },
    [results, selected, handleClose, openSelected],
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
            placeholder="Search topics, concepts, keywords…"
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
        {results.length > 0 ? (
          <>
            <div
              className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
            >
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            <ul className="py-1.5 max-h-[22rem] overflow-y-auto">
              {results.map((item, i) => (
                <li key={item.slug.join('/')}>
                  <Link
                    href={'/' + item.slug.join('/')}
                    onClick={() => handleClose(query)}
                    onMouseEnter={() => setSelected(i)}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors"
                    style={{ backgroundColor: i === selected ? 'var(--sidebar-active)' : undefined }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium leading-snug"
                        style={{ color: i === selected ? 'var(--sidebar-active-text)' : 'var(--fg)' }}
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
                    </div>
                    <ArrowRight size={13} className="shrink-0 mt-1" style={{ color: 'var(--muted)' }} />
                  </Link>
                </li>
              ))}
            </ul>
          </>

        ) : query ? (
          /* No results */
          <div className="px-4 py-6 text-center">
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Try: event loop, generics, Redis, Docker, JWT, SOLID…
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
          <span><kbd className="kbd">section:</kbd> or chips</span>
        </div>
      </div>
    </div>
  );
}
