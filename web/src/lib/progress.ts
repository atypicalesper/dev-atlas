import { inferDocSkills } from './learning';

const VISITED_KEY = 'niprep_visited';
const RECENT_KEY  = 'niprep_recent';
const BOOKMARKS_KEY = 'devatlas_bookmarks';
const VISIT_DAYS_KEY = 'devatlas_visit_days';
const SKILL_COUNTS_KEY = 'devatlas_skill_counts';
const QUIZ_RESULTS_KEY = 'devatlas_quiz_results';
const READ_PROGRESS_KEY = 'devatlas_read_progress';
const COMPLETED_KEY = 'devatlas_completed';

/** Fired whenever the completed set changes, so sidebars/rings can refresh live. */
export const COMPLETED_EVENT = 'devatlas-completed-change';

export interface RecentPage {
  slug: string;   // e.g. "01-javascript-fundamentals/01-event-loop/01-event-loop-deep-dive"
  title: string;
  ts: number;
}

export interface MissedQuizQuestion {
  id: string;
  quizId: string;
  prompt: string;
  sourceHref: string;
  sourceLabel: string;
  section: string;
  lastAnsweredAt: number;
}

interface QuizResultEntry extends MissedQuizQuestion {
  correct: boolean;
}

function isoDay(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

  const skillCounts = getSkillCounts();
  for (const skill of inferDocSkills(slug, title)) {
    skillCounts[skill] = (skillCounts[skill] ?? 0) + 1;
  }
  localStorage.setItem(SKILL_COUNTS_KEY, JSON.stringify(skillCounts));
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

/** Slugs the user has explicitly marked as completed/mastered. */
export function getCompletedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function isComplete(slugKey: string): boolean {
  return getCompletedSet().has(slugKey);
}

/** Toggle completion for a doc. Returns the new completed state. */
export function toggleComplete(slugKey: string): boolean {
  if (typeof window === 'undefined') return false;
  const set = getCompletedSet();
  const nowComplete = !set.has(slugKey);
  if (nowComplete) set.add(slugKey);
  else set.delete(slugKey);
  localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
  window.dispatchEvent(new Event(COMPLETED_EVENT));
  return nowComplete;
}

export function getCompletedCount(): number {
  return getCompletedSet().size;
}

/** How many completed docs live under a given top-level section. */
export function getCompletedCountBySection(sectionSlug: string): number {
  if (typeof window === 'undefined') return 0;
  let count = 0;
  for (const key of getCompletedSet()) {
    if (key.startsWith(sectionSlug + '/')) count += 1;
  }
  return count;
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
  const cursor = new Date();

  if (!days.has(isoDay(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(isoDay(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getSkillCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(SKILL_COUNTS_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

export function getTopSkills(limit = 4): Array<{ skill: string; count: number }> {
  return Object.entries(getSkillCounts())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

function getQuizResultsMap(): Record<string, QuizResultEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(QUIZ_RESULTS_KEY) ?? '{}') as Record<string, QuizResultEntry>;
  } catch {
    return {};
  }
}

export function recordQuizAnswer(entry: {
  id: string;
  quizId: string;
  prompt: string;
  sourceHref: string;
  sourceLabel: string;
  section: string;
  correct: boolean;
}): void {
  if (typeof window === 'undefined') return;
  const results = getQuizResultsMap();
  results[entry.id] = {
    ...entry,
    lastAnsweredAt: Date.now(),
  };
  localStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));
}

export function getMissedQuizQuestions(limit = 12): MissedQuizQuestion[] {
  return Object.values(getQuizResultsMap())
    .filter(entry => !entry.correct)
    .sort((a, b) => b.lastAnsweredAt - a.lastAnsweredAt)
    .slice(0, limit);
}

interface ReadProgressEntry {
  pct: number;
  updatedAt: number;
}

function getReadProgressMap(): Record<string, ReadProgressEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(READ_PROGRESS_KEY) ?? '{}') as Record<string, ReadProgressEntry>;
  } catch {
    return {};
  }
}

/** Persist max scroll percentage reached on a doc. Only updates when pct grows. */
export function recordReadProgress(slugKey: string, pct: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const map = getReadProgressMap();
  const prev = map[slugKey]?.pct ?? 0;
  if (clamped <= prev && map[slugKey]) return;
  map[slugKey] = { pct: Math.max(prev, clamped), updatedAt: Date.now() };
  localStorage.setItem(READ_PROGRESS_KEY, JSON.stringify(map));
}

export function getDocProgressPct(slugKey: string): number {
  if (typeof window === 'undefined') return 0;
  return getReadProgressMap()[slugKey]?.pct ?? 0;
}

export interface InProgressDoc {
  slug: string;
  title: string;
  pct: number;
  updatedAt: number;
}

/** Recently visited docs that are partially read (5–94% scrolled), most recent first. */
export function getInProgressDocs(limit = 4): InProgressDoc[] {
  if (typeof window === 'undefined') return [];
  const map = getReadProgressMap();
  const recents = getRecent();
  const out: InProgressDoc[] = [];
  for (const recent of recents) {
    const entry = map[recent.slug];
    if (!entry) continue;
    if (entry.pct < 5 || entry.pct >= 95) continue;
    out.push({ slug: recent.slug, title: recent.title, pct: entry.pct, updatedAt: entry.updatedAt });
    if (out.length >= limit) break;
  }
  return out;
}
