'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { NavItem } from '@/lib/docs';
import { useNotebook } from '@/lib/notebook';
import RoughBorder from './RoughBorder';

interface Props {
  items: NavItem[];
}

function flatCount(item: NavItem): number {
  if (!item.children) return 1;
  return item.children.reduce((sum, child) => sum + flatCount(child), 0);
}

export default function DirGrid({ items }: Props) {
  const { notebook } = useNotebook();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((child, i) => {
        const href = '/' + child.slug.join('/');
        const stagger = { '--stagger': `${i * 60}ms` } as React.CSSProperties;

        if (child.children) {
          const count = flatCount(child);
          return (
            <div
              key={href}
              className="dir-card relative rounded-xl border p-5"
              style={{
                ...stagger,
                backgroundColor: 'var(--card-bg)',
                borderColor: notebook ? 'transparent' : 'var(--card-border)',
              }}
            >
              {notebook && <RoughBorder />}
              <div className="flex items-center justify-between mb-3">
                <Link
                  href={href}
                  className="font-semibold text-sm hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
                  style={{ color: 'var(--fg)' }}
                >
                  {child.title}
                  <ChevronRight size={13} style={{ color: 'var(--muted)' }} />
                </Link>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ml-2"
                  style={{ backgroundColor: 'var(--sidebar-active)', color: 'var(--sidebar-active-text)' }}
                >
                  {count} {count === 1 ? 'file' : 'files'}
                </span>
              </div>
              <ul className="space-y-1.5">
                {child.children.map(gc => (
                  <li key={gc.slug.join('/')}>
                    <Link
                      href={'/' + gc.slug.join('/')}
                      className="text-xs hover:underline"
                      style={{ color: 'var(--muted)' }}
                    >
                      {gc.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className="dir-card relative rounded-xl border p-5 block transition-all hover:-translate-y-1 hover:shadow-md group"
            style={{
              ...stagger,
              backgroundColor: 'var(--card-bg)',
              borderColor: notebook ? 'transparent' : 'var(--card-border)',
            }}
          >
            {notebook && <RoughBorder />}
            <span className="font-semibold text-sm group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--fg)' }}>
              {child.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
