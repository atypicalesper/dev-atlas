'use client';

import { useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { getCompletedSet, toggleComplete } from '@/lib/progress';

interface Props {
  href: string;
}

export default function CompleteButton({ href }: Props) {
  const slug = href.replace(/^\/+/, '');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(getCompletedSet().has(slug));
  }, [slug]);

  function handleToggle() {
    setDone(toggleComplete(slug));
  }

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
      style={{
        borderColor: done ? 'var(--success)' : 'var(--border)',
        backgroundColor: done ? 'color-mix(in srgb, var(--success) 14%, transparent)' : 'var(--card-bg)',
        color: done ? 'var(--success)' : 'var(--fg)',
      }}
      aria-pressed={done}
      aria-label={done ? 'Completed' : 'Mark complete'}
      title={done ? 'Mark as not done' : 'Mark this page as complete'}
    >
      <CircleCheck size={13} fill={done ? 'currentColor' : 'none'} stroke={done ? 'var(--card-bg)' : 'currentColor'} />
      <span className="hidden sm:inline">{done ? 'Completed' : 'Mark complete'}</span>
    </button>
  );
}
