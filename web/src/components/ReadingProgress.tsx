'use client';

import { useEffect, useState } from 'react';
import { recordReadProgress } from '@/lib/progress';

interface Props {
  slug?: string[];
}

export default function ReadingProgress({ slug }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let persistTimer: ReturnType<typeof setTimeout> | null = null;
    let lastPersisted = 0;
    const slugKey = slug ? slug.join('/') : '';

    function update() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = document.documentElement;
        const total = el.scrollHeight - el.clientHeight;
        const pct = total > 0 ? (el.scrollTop / total) * 100 : 0;
        setProgress(pct);

        if (slugKey && pct > lastPersisted + 2) {
          if (persistTimer) clearTimeout(persistTimer);
          persistTimer = setTimeout(() => {
            recordReadProgress(slugKey, pct);
            lastPersisted = pct;
          }, 400);
        }
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', update);
      cancelAnimationFrame(rafId);
      if (persistTimer) clearTimeout(persistTimer);
    };
  }, [slug]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[2px] origin-left transition-none"
      style={{ background: `linear-gradient(to right, var(--accent) ${progress}%, transparent ${progress}%)` }}
    />
  );
}
