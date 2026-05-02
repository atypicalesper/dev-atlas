'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Brain, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { QuizPack } from '@/lib/quizzes';
import { recordQuizAnswer } from '@/lib/progress';
import { recordSrsReview } from '@/lib/srs';

interface Props {
  quiz: QuizPack;
}

export default function SectionQuiz({ quiz }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const firstAttemptRef = useRef<Set<number>>(new Set());
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.questions.length;

  const score = useMemo(
    () => quiz.questions.reduce((sum, question, index) => sum + (answers[index] === question.correctId ? 1 : 0), 0),
    [answers, quiz.questions],
  );

  return (
    <section className="mb-8 rounded-3xl border p-5 sm:p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            <Brain size={12} />
            Interactive Quiz
          </div>
          <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--fg)' }}>
            {quiz.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {quiz.description}
          </p>
        </div>

        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          <div className="font-semibold">{allAnswered ? `${score}/${quiz.questions.length}` : `${answeredCount}/${quiz.questions.length}`}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            {allAnswered ? 'Score' : 'Answered'}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {quiz.questions.map((question, index) => {
          const selectedId = answers[index];
          const isCorrect = selectedId === question.correctId;
          const hasAnswered = Boolean(selectedId);

          return (
            <div
              key={question.prompt}
              className="rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                    Question {index + 1}
                  </div>
                  <div className="mt-2 text-sm font-medium leading-relaxed" style={{ color: 'var(--fg)' }}>
                    {question.prompt}
                  </div>
                </div>
                {hasAnswered && (
                  isCorrect ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> : <XCircle size={18} style={{ color: '#ef4444' }} />
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {question.options.map(option => {
                  const isSelected = selectedId === option.id;
                  const isAnswer = option.id === question.correctId;
                  const showCorrect = hasAnswered && isAnswer;
                  const showWrong = hasAnswered && isSelected && !isAnswer;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        setAnswers(current => ({ ...current, [index]: option.id }));
                        const cardId = `${question.sourceHref}::${index}`;
                        const correct = option.id === question.correctId;
                        recordQuizAnswer({
                          id: cardId,
                          quizId: quiz.title,
                          prompt: question.prompt,
                          sourceHref: question.sourceHref,
                          sourceLabel: question.sourceLabel,
                          section: quiz.section,
                          correct,
                        });
                        if (!firstAttemptRef.current.has(index)) {
                          firstAttemptRef.current.add(index);
                          recordSrsReview(
                            {
                              id: cardId,
                              kind: 'quiz',
                              prompt: question.prompt,
                              sourceHref: question.sourceHref,
                              sourceLabel: question.sourceLabel,
                              section: quiz.section,
                            },
                            correct ? 4 : 2,
                          );
                        }
                      }}
                      className="rounded-xl border px-3 py-3 text-left text-sm transition-colors hover:bg-[var(--sidebar-hover)]"
                      style={{
                        borderColor: showCorrect ? 'var(--success)' : showWrong ? '#ef4444' : 'var(--border)',
                        backgroundColor: isSelected ? 'var(--sidebar-active)' : 'transparent',
                        color: isSelected ? 'var(--sidebar-active-text)' : 'var(--fg)',
                      }}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="mt-4 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: isCorrect ? 'var(--success)' : '#ef4444' }}>
                    {isCorrect ? 'Correct' : 'Review'}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {question.explanation}
                  </p>
                  <Link
                    href={question.sourceHref}
                    className="mt-3 inline-flex text-xs font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Review: {question.sourceLabel}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          These questions are derived from the section’s current atlas content and link back to the underlying docs.
        </div>
        <button
          onClick={() => {
            setAnswers({});
            firstAttemptRef.current = new Set();
          }}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
          style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          <RotateCcw size={12} />
          Reset quiz
        </button>
      </div>
    </section>
  );
}
