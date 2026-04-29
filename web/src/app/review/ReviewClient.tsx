'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Brain, CircleAlert, Flame, Heart, RotateCcw, Sparkles, Target } from 'lucide-react';
import type { DocSummary } from '@/lib/docs';
import { getBookmarks, getMissedQuizQuestions, getRecent, getSkillCounts, getTopSkills, getVisitedCountBySection, getVisitStreak } from '@/lib/progress';

interface Props {
  docs: DocSummary[];
  pageCounts: Record<string, number>;
}

interface MissedReviewItem {
  prompt: string;
  sourceHref: string;
  sourceLabel: string;
  section: string;
}

export default function ReviewClient({ docs, pageCounts }: Props) {
  const [missed, setMissed] = useState<MissedReviewItem[]>([]);
  const [bookmarks, setBookmarks] = useState<DocSummary[]>([]);
  const [streak, setStreak] = useState(0);
  const [topSkills, setTopSkills] = useState<Array<{ skill: string; count: number }>>([]);
  const [skillCounts, setSkillCounts] = useState<Record<string, number>>({});
  const [recents, setRecents] = useState<DocSummary[]>([]);
  const [weakSections, setWeakSections] = useState<Array<{ slug: string; title: string; pct: number; visited: number; total: number }>>([]);

  useEffect(() => {
    const missedEntries = getMissedQuizQuestions().map(entry => ({
      prompt: entry.prompt,
      sourceHref: entry.sourceHref,
      sourceLabel: entry.sourceLabel,
      section: entry.section,
    }));
    setMissed(missedEntries);
    setStreak(getVisitStreak());
    setTopSkills(getTopSkills(6));
    setSkillCounts(getSkillCounts());

    const bookmarkDocs = getBookmarks()
      .map(slug => docs.find(doc => doc.slug.join('/') === slug) ?? null)
      .filter(Boolean) as DocSummary[];
    setBookmarks(bookmarkDocs.slice(0, 6));

    const recentDocs = getRecent()
      .map(entry => docs.find(doc => doc.slug.join('/') === entry.slug) ?? null)
      .filter(Boolean) as DocSummary[];
    setRecents(recentDocs.slice(0, 4));

    const sections = Object.entries(pageCounts)
      .map(([slug, total]) => {
        const visited = getVisitedCountBySection(slug);
        const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
        return { slug, title: docs.find(doc => doc.slug[0] === slug)?.section ?? slug, pct, visited, total };
      })
      .filter(section => section.visited > 0 && section.pct < 100)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 4);
    setWeakSections(sections);
  }, [docs, pageCounts]);

  const quickSession = useMemo(() => {
    const picks: DocSummary[] = [];
    for (const doc of bookmarks) {
      if (!picks.find(pick => pick.href === doc.href)) picks.push(doc);
      if (picks.length === 2) break;
    }
    for (const doc of recents) {
      if (!picks.find(pick => pick.href === doc.href)) picks.push(doc);
      if (picks.length === 4) break;
    }
    return picks.slice(0, 4);
  }, [bookmarks, recents]);

  const nextSkillTargets = Object.entries(skillCounts)
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .slice(0, 4);

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
          <RotateCcw size={12} />
          Review Mode
        </div>
        <h1 className="mt-2 text-3xl font-bold" style={{ color: 'var(--fg)' }}>
          Train what you are most likely to forget
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          This is your comeback surface: missed questions, saved reads, weak spots, and the skills your atlas history says you are really building.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-8">
        <div className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            <Sparkles size={12} />
            10-minute review run
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickSession.length > 0 ? quickSession.map(doc => (
              <Link
                key={doc.href}
                href={doc.href}
                className="rounded-2xl border px-4 py-4 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{doc.title}</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {doc.difficulty} · {doc.skills.slice(0, 2).join(' · ') || doc.section}
                </div>
              </Link>
            )) : (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Start reading and bookmarking a few pages. This turns into a focused practice loop automatically.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Momentum
          </div>
          <div className="space-y-3">
            <Stat label="Day streak" value={String(streak)} icon={Flame} />
            <Stat label="Missed quiz cards" value={String(missed.length)} icon={CircleAlert} />
            <Stat label="Saved reads" value={String(bookmarks.length)} icon={Heart} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 mb-8">
        <section className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            <Target size={12} />
            Retry wrong answers
          </div>
          <div className="space-y-3">
            {missed.length > 0 ? missed.map(item => (
              <Link
                key={`${item.sourceHref}-${item.prompt}`}
                href={item.sourceHref}
                className="block rounded-2xl border px-4 py-4 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  {item.section}
                </div>
                <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                  {item.prompt}
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  Review in {item.sourceLabel}
                </div>
              </Link>
            )) : (
              <div className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Once you miss quiz questions, they start collecting here for spaced review.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            <Brain size={12} />
            Skill map
          </div>
          <div className="flex flex-wrap gap-2">
            {topSkills.length > 0 ? topSkills.map(skill => (
              <div
                key={skill.skill}
                className="rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--fg)', backgroundColor: 'var(--bg)' }}
              >
                {formatSkill(skill.skill)} · {skill.count}
              </div>
            )) : (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Read a few docs and your strongest recurring skills will show up here.
              </div>
            )}
          </div>

          {nextSkillTargets.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Build next
              </div>
              <div className="space-y-2">
                {nextSkillTargets.map(([skill, count]) => (
                  <div key={skill} className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-sm" style={{ color: 'var(--fg)' }}>{formatSkill(skill)}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{count} visits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <section className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Saved reads
          </div>
          <div className="space-y-2">
            {bookmarks.length > 0 ? bookmarks.map(doc => (
              <Link
                key={doc.href}
                href={doc.href}
                className="block rounded-xl border px-3 py-3 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{doc.title}</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {doc.difficulty} · {doc.skills.slice(0, 2).join(' · ') || doc.section}
                </div>
              </Link>
            )) : (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Bookmark hard-but-important docs and they become your review pile here.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Weak sections
          </div>
          <div className="space-y-2">
            {weakSections.length > 0 ? weakSections.map(section => (
              <Link
                key={section.slug}
                href={`/${section.slug}`}
                className="block rounded-xl border px-3 py-3 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{section.title}</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {section.visited}/{section.total} pages · {section.pct}% explored
                </div>
              </Link>
            )) : (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Once you’ve explored a few sections, your gaps show up here for easy catch-up.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Flame;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
      <div className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--fg)' }}>
        <Icon size={14} style={{ color: 'var(--accent)' }} />
        {label}
      </div>
      <div className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>{value}</div>
    </div>
  );
}

function formatSkill(skill: string) {
  return skill
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
