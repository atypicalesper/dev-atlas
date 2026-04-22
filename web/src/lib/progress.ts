const VISITED_KEY = 'niprep_visited';
const RECENT_KEY  = 'niprep_recent';
const BOOKMARKS_KEY = 'devatlas_bookmarks';
const VISIT_DAYS_KEY = 'devatlas_visit_days';

export interface RecentPage {
  slug: string;   // e.g. "01-javascript-fundamentals/01-event-loop/01-event-loop-deep-dive"
  title: string;
  ts: number;
}

function isoDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function getRawVisited(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VISITED_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/** Record a page visit. Call on doc page mount. */
export function recordVisit(slug: string[], title: string): void {
  if (typeof window === 'undefined') return;
  const key = slug.join('/');

  // Mark visited (deduplicated)
  const visited = getRawVisited();
  if (!visited.includes(key)) {
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited, key]));
  }

  // Update recents (most recent first, deduplicated)
  const recent = getRecent().filter(r => r.slug !== key);
  recent.unshift({ slug: key, title, ts: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 6)));

  const today = isoDay(Date.now());
  const visitDays = getVisitDays();
  if (!visitDays.includes(today)) {
    localStorage.setItem(VISIT_DAYS_KEY, JSON.stringify([...visitDays, today].sort()));
  }
}

/** How many pages in a given top-level section have been visited. */
export function getVisitedCountBySection(sectionSlug: string): number {
  if (typeof window === 'undefined') return 0;
  return getRawVisited().filter(s => s.startsWith(sectionSlug + '/')).length;
}

/** All visited slugs as a Set. */
export function getVisitedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  return new Set(getRawVisited());
}

/** Last N visited pages (most recent first). */
export function getRecent(): RecentPage[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as RecentPage[];
  } catch {
    return [];
  }
}

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function toggleBookmark(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  const bookmarks = getBookmarks();
  const exists = bookmarks.includes(slug);
  const next = exists ? bookmarks.filter(entry => entry !== slug) : [slug, ...bookmarks];
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next.slice(0, 50)));
  return !exists;
}

export function getBookmarkCount(): number {
  return getBookmarks().length;
}

export function getVisitDays(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(VISIT_DAYS_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function getVisitStreak(): number {
  const days = new Set(getVisitDays());
  let streak = 0;
  const cursor = new Date();

  while (days.has(isoDay(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
