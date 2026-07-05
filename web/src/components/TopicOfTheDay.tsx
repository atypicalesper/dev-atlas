'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, Sparkles, ArrowRight, Check, Clock } from 'lucide-react';
import { getVisitedSet } from '@/lib/progress';
import { useNotebook } from '@/lib/notebook';
import RoughBorder from './RoughBorder';
import RoughCircle from './RoughCircle';
import type { DocSummary } from '@/lib/docs';

interface Props {
  doc: DocSummary;
}

function hoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 3_600_000));
}

export default function TopicOfTheDay({ doc }: Props) {
  const slugKey = doc.slug.join('/');
  const { notebook } = useNotebook();
  const [read, setRead] = useState(false);
  const [dateLabel, setDateLabel] = useState('');
  const [resetsIn, setResetsIn] = useState(0);

  useEffect(() => {
    setRead(getVisitedSet().has(slugKey));
    setDateLabel(
      new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    );
    setResetsIn(hoursUntilMidnight());
  }, [slugKey]);

  const minutes = Math.max(1, Math.ceil(doc.wordCount / 250));

  return (
    <Link
      href={`/${slugKey}`}
      className="topic-of-day group relative block overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderColor: notebook ? 'transparent' : 'var(--accent)', backgroundColor: 'var(--card-bg)' }}
    >
      {notebook && <RoughBorder roughness={1.6} strokeWidth={1.6} />}
      {/* Accent wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ background: 'radial-gradient(ellipse at top right, var(--accent) 0%, transparent 60%)' }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            <span className="relative inline-flex items-center justify-center" style={{ padding: notebook ? '4px 5px' : undefined }}>
              {notebook && <RoughCircle roughness={2.2} strokeWidth={1.4} />}
              <Sparkles size={13} />
            </span>
            Topic of the day
            <span className="flex items-center gap-1 font-medium normal-case tracking-normal" style={{ color: 'var(--muted)' }}>
              <CalendarDays size={12} />
              {dateLabel}
            </span>
          </div>

          <h2
            className="text-2xl leading-tight"
            style={{ color: 'var(--fg)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {doc.title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
            {doc.excerpt}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="reading-badge">
              <Clock size={11} />
              {minutes} min read
            </span>
            {read ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--success)' }}>
                <Check size={13} /> Already read — nice
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                A fresh pick every day{resetsIn ? ` · resets in ${resetsIn}h` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <span
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform group-hover:scale-105"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {read ? 'Read again' : "Read today's topic"}
            <ArrowRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}
