import { buildSearchIndex } from '@/lib/docs';

export const dynamic = 'force-static';

// Emitted as a static file at build time so the 5.5k-entry index is fetched
// once on demand instead of being serialised into every page's RSC payload.
export function GET() {
  return Response.json(buildSearchIndex());
}
