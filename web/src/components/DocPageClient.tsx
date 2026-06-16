'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { recordVisit } from '@/lib/progress';
import BackToTop from './BackToTop';

interface Props {
  slug: string[];
  title: string;
  prevHref?: string;
  nextHref?: string;
}

export default function DocPageClient({ slug, title, prevHref, nextHref }: Props) {
  const router = useRouter();

  // Record visit + scroll to top on each new page
  useEffect(() => {
    recordVisit(slug, title);
    window.scrollTo({ top: 0 });
  }, [slug.join('/')]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard nav: [ = prev doc, ] = next doc, j / k = next / prev heading
  useEffect(() => {
    const HEADING_OFFSET = 90;

    function jumpHeading(direction: 1 | -1) {
      const heads = Array.from(
        document.querySelectorAll('.prose h2[id], .prose h3[id]'),
      ) as HTMLElement[];
      if (heads.length === 0) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';

      let target: HTMLElement | undefined;
      if (direction === 1) {
        target = heads.find(h => h.getBoundingClientRect().top > HEADING_OFFSET + 4);
      } else {
        for (const h of heads) {
          if (h.getBoundingClientRect().top < HEADING_OFFSET - 4) target = h;
        }
      }
      if (target) target.scrollIntoView({ behavior, block: 'start' });
    }

    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '[' && prevHref) { router.push(prevHref); window.scrollTo({ top: 0 }); }
      if (e.key === ']' && nextHref) { router.push(nextHref); window.scrollTo({ top: 0 }); }
      if (e.key === 'j') { e.preventDefault(); jumpHeading(1); }
      if (e.key === 'k') { e.preventDefault(); jumpHeading(-1); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevHref, nextHref, router]);

  return <BackToTop />;
}
