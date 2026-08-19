import type { SearchItem } from './docs';

// The index is emitted in a normalised shape: doc-level metadata is stored once
// and heading entries reference their doc by index. Serialising a flat
// SearchItem[] repeated title/slug/section/path/kind for all 5.5k entries.
export type CompactDoc = [
  title: string,
  slug: string,
  excerpt: string,
  section: string,
  path: string,
  kind: SearchItem['kind'],
];

export type CompactHeading = [docIndex: number, text: string, id: string];

export interface CompactSearchIndex {
  docs: CompactDoc[];
  headings: CompactHeading[];
}

export function expandSearchIndex(compact: CompactSearchIndex): SearchItem[] {
  const items: SearchItem[] = [];

  for (const [title, slug, excerpt, section, path, kind] of compact.docs) {
    items.push({ title, slug: slug.split('/'), excerpt, section, path, kind });
  }

  for (const [docIndex, text, id] of compact.headings) {
    const [title, slug, , section, path, kind] = compact.docs[docIndex];
    items.push({
      title,
      slug: slug.split('/'),
      excerpt: text,
      section,
      path,
      kind,
      headingId: id,
      headingText: text,
    });
  }

  return items;
}
