import { getAllDocSlugs, getDocContent, getDocSummaries } from '@/lib/docs';
import HomePageClient from './HomePageClient';

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
  const dayIndex = new Date().getDate() % docs.length;
  const featuredDoc = docs[dayIndex];

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

  return <HomePageClient pageCounts={pageCounts} docs={docs} featuredDoc={featuredDoc} challengeDocs={challengeDocs} />;
}
