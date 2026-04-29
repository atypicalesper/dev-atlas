import { getAllDocSlugs, getDocSummaries } from '@/lib/docs';
import ReviewClient from './ReviewClient';

export const metadata = { title: 'Review Mode' };

export default function ReviewPage() {
  const docs = getDocSummaries();
  const pageCounts: Record<string, number> = {};
  for (const slug of getAllDocSlugs()) {
    if (slug[0]) {
      pageCounts[slug[0]] = (pageCounts[slug[0]] ?? 0) + 1;
    }
  }

  return <ReviewClient docs={docs} pageCounts={pageCounts} />;
}
