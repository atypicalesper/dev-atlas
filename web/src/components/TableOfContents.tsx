'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import type { Heading } from '@/lib/docs';
import { useNotebook } from '@/lib/notebook';
import RoughBorder from './RoughBorder';

interface Props {
  headings: Heading[];
}

export default function TableOfContents({ headings }: Props) {
  const [active, setActive] = useState('');
  const [open, setOpen] = useState(false);
  const { notebook } = useNotebook();

  useEffect(() => {
    if (headings.length === 0) return;

    const OFFSET = 100; // px from viewport top — heading is "passed" once it crosses this line

    const onScroll = () => {
      let current = headings[0].id;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= OFFSET) {
          current = h.id;
        }
      }
      setActive(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set correct active on mount / section change
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <>
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium shadow-lg"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          <List size={13} />
          On this page
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="max-h-[70vh] w-full rounded-t-3xl border px-4 py-4"
            style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>On this page</div>
              <button onClick={() => setOpen(false)} className="text-xs" style={{ color: 'var(--accent)' }}>
                Close
              </button>
            </div>
            <div className="overflow-y-auto">
              <TocList headings={headings} active={active} onSelect={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:block w-48 shrink-0 self-start sticky top-8">
        <div
          className="relative rounded-xl p-3"
          style={{
            backgroundColor: notebook ? 'var(--card-bg)' : 'transparent',
            borderColor: notebook ? 'transparent' : undefined,
          }}
        >
          {notebook && <RoughBorder roughness={1.4} strokeWidth={1.2} />}
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--muted)' }}
          >
            On this page
          </p>
          <TocList headings={headings} active={active} />
        </div>
      </aside>
    </>
  );
}

function TocList({
  headings,
  active,
  onSelect,
}: {
  headings: Heading[];
  active: string;
  onSelect?: () => void;
}) {
  return (
    <ul className="space-y-0.5 border-l" style={{ borderColor: 'var(--border)' }}>
      {headings.map(h => {
        const isActive = active === h.id;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={onSelect}
              className="block text-[12px] leading-snug py-0.5 hover:text-[var(--accent)]"
              style={{
                paddingLeft: h.depth === 3 ? '1.25rem' : '0.625rem',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                fontWeight: isActive ? 600 : 400,
                borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                marginLeft: '-1px',
                transition: 'color 0.2s, border-color 0.2s, font-weight 0s',
              }}
            >
              {h.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
