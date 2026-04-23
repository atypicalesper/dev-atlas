import { getAllDocSlugs, getDocContent, getDocSummaries } from '@/lib/docs';
import HomePageClient from './HomePageClient';

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function HomePage() {
  // Count markdown files per top-level section for progress bars
  const slugs = getAllDocSlugs();
  const pageCounts: Record<string, number> = {};
  for (const slug of slugs) {
    if (slug[0]) {
      pageCounts[slug[0]] = (pageCounts[slug[0]] ?? 0) + 1;
    }
  }

  const docs = getDocSummaries();
  const today = isoDate(new Date());
  const featuredIndex = hashString(today) % docs.length;
  const featuredDoc = docs[featuredIndex];
  const surpriseIndex = hashString(today + ':surprise') % docs.length;
  const initialSurpriseDoc = docs[surpriseIndex].slug.join('/') === featuredDoc.slug.join('/')
    ? docs[(surpriseIndex + 1) % docs.length]
    : docs[surpriseIndex];

  const challengeSlugs = [
    ['engineering', '12-interview-practice', '00-cheat-sheet', '01-last-day-reference'],
    ['react', '17-frontend-perf', '01-core-web-vitals'],
    ['ai', '03-rag-and-vector-databases', '04-advanced-rag-patterns'],
  ];
  const challengeDocs = challengeSlugs
    .map(slug => {
      const doc = getDocContent(slug);
      return doc ? { title: doc.title, href: '/' + slug.join('/') } : null;
    })
    .filter(Boolean) as Array<{ title: string; href: string }>;

  return (
    <HomePageClient
      pageCounts={pageCounts}
      docs={docs}
      featuredDoc={featuredDoc}
      initialSurpriseDoc={initialSurpriseDoc}
      challengeDocs={challengeDocs}
    />
  );
}
