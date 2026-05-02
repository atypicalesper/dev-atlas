const SRS_KEY = 'devatlas_srs';
const DAY_MS = 24 * 60 * 60 * 1000;

export type SrsKind = 'quiz' | 'predict';

export type SrsQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SrsCardSeed {
  id: string;
  kind: SrsKind;
  prompt: string;
  sourceHref: string;
  sourceLabel: string;
  section: string;
}

export interface SrsCardState extends SrsCardSeed {
  ef: number;
  reps: number;
  intervalDays: number;
  dueAt: number;
  lastReviewedAt: number;
  lastQuality: SrsQuality;
}

interface SrsStore {
  [id: string]: SrsCardState;
}

function readStore(): SrsStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY) ?? '{}') as SrsStore;
  } catch {
    return {};
  }
}

function writeStore(store: SrsStore): void {
  localStorage.setItem(SRS_KEY, JSON.stringify(store));
}

function applySm2(prev: SrsCardState | null, quality: SrsQuality, now: number): Omit<SrsCardState, keyof SrsCardSeed> {
  const prevEf = prev?.ef ?? 2.5;
  const prevReps = prev?.reps ?? 0;
  const prevInterval = prev?.intervalDays ?? 0;

  const efDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const ef = Math.max(1.3, prevEf + efDelta);

  let reps: number;
  let intervalDays: number;

  if (quality < 3) {
    reps = 0;
    intervalDays = 1;
  } else if (prevReps === 0) {
    reps = 1;
    intervalDays = 1;
  } else if (prevReps === 1) {
    reps = 2;
    intervalDays = 6;
  } else {
    reps = prevReps + 1;
    intervalDays = Math.max(1, Math.round(prevInterval * ef));
  }

  return {
    ef,
    reps,
    intervalDays,
    dueAt: now + intervalDays * DAY_MS,
    lastReviewedAt: now,
    lastQuality: quality,
  };
}

export function recordSrsReview(seed: SrsCardSeed, quality: SrsQuality): SrsCardState | null {
  if (typeof window === 'undefined') return null;
  const store = readStore();
  const prev = store[seed.id] ?? null;
  const now = Date.now();
  const next: SrsCardState = { ...seed, ...applySm2(prev, quality, now) };
  store[seed.id] = next;
  writeStore(store);
  return next;
}

export function getSrsCard(id: string): SrsCardState | null {
  if (typeof window === 'undefined') return null;
  return readStore()[id] ?? null;
}

export function getDueCards(now = Date.now(), limit = 20): SrsCardState[] {
  if (typeof window === 'undefined') return [];
  return Object.values(readStore())
    .filter(card => card.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, limit);
}

export interface SrsStats {
  total: number;
  due: number;
  learning: number;
  mature: number;
  nextDueAt: number | null;
}

export function getSrsStats(now = Date.now()): SrsStats {
  if (typeof window === 'undefined') return { total: 0, due: 0, learning: 0, mature: 0, nextDueAt: null };
  const cards = Object.values(readStore());
  let due = 0;
  let learning = 0;
  let mature = 0;
  let nextDueAt: number | null = null;
  for (const card of cards) {
    if (card.dueAt <= now) due += 1;
    if (card.intervalDays >= 21) mature += 1;
    else learning += 1;
    if (card.dueAt > now && (nextDueAt === null || card.dueAt < nextDueAt)) {
      nextDueAt = card.dueAt;
    }
  }
  return { total: cards.length, due, learning, mature, nextDueAt };
}

export function describeInterval(card: SrsCardState, now = Date.now()): string {
  if (card.dueAt <= now) {
    const overdueDays = Math.floor((now - card.dueAt) / DAY_MS);
    if (overdueDays <= 0) return 'due now';
    return `${overdueDays}d overdue`;
  }
  const days = Math.max(1, Math.round((card.dueAt - now) / DAY_MS));
  if (days === 1) return 'due tomorrow';
  return `due in ${days}d`;
}
