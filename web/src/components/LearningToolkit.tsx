'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, ChevronDown, ChevronUp, RefreshCw, Swords, Target } from 'lucide-react';

interface PromptCard {
  title: string;
  prompt: string;
  cues: string[];
}

interface Props {
  title: string;
  excerpt: string;
  headings: string[];
  practiceHref?: string;
  practiceTitle?: string;
  compareHref?: string;
  compareTitle?: string;
}

export default function LearningToolkit({
  title,
  excerpt,
  headings,
  practiceHref,
  practiceTitle,
  compareHref,
  compareTitle,
}: Props) {
  const [openCard, setOpenCard] = useState<number | null>(0);

  const prompts: PromptCard[] = [
    {
      title: '30-second recap',
      prompt: `Explain ${title} out loud in 30 seconds without looking back at the page.`,
      cues: [excerpt, ...headings.slice(0, 2)],
    },
    {
      title: 'Test yourself',
      prompt: headings[0]
        ? `What problem does "${headings[0]}" solve, and what breaks when you misunderstand it?`
        : `What is the core mental model behind ${title}, and when would you apply it?`,
      cues: headings.length > 1 ? headings.slice(0, 3) : [excerpt],
    },
    {
      title: compareTitle ? 'Compare it' : 'Use it',
      prompt: compareTitle
        ? `When would you choose this instead of ${compareTitle}? Focus on trade-offs, not definitions.`
        : `Describe one real system or bug where knowing ${title} would have changed the outcome.`,
      cues: compareTitle ? [compareTitle, headings[0] ?? excerpt, headings[1] ?? excerpt] : [excerpt, ...headings.slice(0, 2)],
    },
  ];

  return (
    <section className="mt-10 rounded-3xl border p-5 sm:p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            <Brain size={12} />
            Study Mode
          </div>
          <h2 className="mt-2 text-lg font-semibold" style={{ color: 'var(--fg)' }}>
            Make this page stick
          </h2>
          <p className="mt-1 text-sm max-w-2xl" style={{ color: 'var(--muted)' }}>
            A quick recap, a self-check, and one bridge to help this turn into usable knowledge.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {practiceHref && practiceTitle && (
            <Link
              href={practiceHref}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
            >
              <Target size={12} />
              Practice with {practiceTitle}
            </Link>
          )}
          {compareHref && compareTitle && (
            <Link
              href={compareHref}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
              style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
            >
              <Swords size={12} />
              Compare with {compareTitle}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {prompts.map((card, index) => {
          const open = openCard === index;
          return (
            <div
              key={card.title}
              className="rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => setOpenCard(open ? null : index)}
                className="flex w-full items-start justify-between gap-3 text-left"
                style={{ color: 'var(--fg)' }}
              >
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                    {card.title}
                  </div>
                  <div className="mt-2 text-sm font-medium leading-relaxed">{card.prompt}</div>
                </div>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {open && (
                <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    <RefreshCw size={11} />
                    What your answer should touch
                  </div>
                  <ul className="space-y-2">
                    {card.cues.map(cue => (
                      <li key={cue} className="rounded-xl px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--muted)' }}>
                        {cue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
