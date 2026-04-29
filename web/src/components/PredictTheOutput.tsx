'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TerminalSquare } from 'lucide-react';
import type { PredictBlock } from '@/lib/predict';

interface Props {
  blocks: PredictBlock[];
}

export default function PredictTheOutput({ blocks }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (blocks.length === 0) return null;

  return (
    <section className="mt-10 rounded-3xl border p-5 sm:p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
        <TerminalSquare size={12} />
        Predict the Output
      </div>
      <h2 className="mt-2 text-lg font-semibold" style={{ color: 'var(--fg)' }}>
        Slow down and reason before revealing the answer
      </h2>
      <p className="mt-1 text-sm max-w-2xl" style={{ color: 'var(--muted)' }}>
        These are quick code-reading drills pulled from the ideas in this doc, designed to turn passive reading into active recall.
      </p>

      <div className="mt-5 space-y-4">
        {blocks.map((block, index) => {
          const open = openIndex === index;
          return (
            <div key={block.title} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                {block.title}
              </div>
              <div className="mb-3 text-sm font-medium" style={{ color: 'var(--fg)' }}>
                {block.prompt}
              </div>
              <pre className="overflow-x-auto rounded-2xl p-4 text-xs leading-relaxed" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--fg)' }}>
                <code>{block.code}</code>
              </pre>
              <button
                onClick={() => setOpenIndex(open ? null : index)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
              >
                {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {open ? 'Hide answer' : 'Reveal answer'}
              </button>

              {open && (
                <div className="mt-4 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--success)' }}>
                    Expected output
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm" style={{ color: 'var(--fg)' }}>
                    <code>{block.answer}</code>
                  </pre>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {block.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
