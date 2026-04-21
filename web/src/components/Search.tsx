'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { SearchItem } from '@/lib/docs';

interface Props {
  index: SearchItem[];
  onClose: () => void;
}

const RECENT_KEY = 'niprep_searches';
const SUGGESTED = ['event loop', 'promises', 'TypeScript generics', 'system design', 'SQL joins', 'Docker', 'JWT', 'SOLID'];

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

function matchItems(query: string, items: SearchItem[]): SearchItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  function score(item: SearchItem): number {
    const title = item.title.toLowerCase();
    const section = item.section.toLowerCase();
    const excerpt = item.excerpt.toLowerCase();
    const path = item.path.toLowerCase();

    let points = 0;
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
  const inputRef    = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef    = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(backdropRef.current, { opacity: 0, duration: 0.2 });
    gsap.from(panelRef.current, { opacity: 0, y: -14, scale: 0.97, duration: 0.24, ease: 'power3.out' });
  });

  useEffect(() => { setRecents(loadRecentSearches()); }, []);
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
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {item.path}
                        </div>
                      )}
                      {item.excerpt && (
                        <div className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--muted)' }}>
                          <Highlight text={item.excerpt} query={query} />
                        </div>
                      )}
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
        </div>
      </div>
    </div>
  );
}
