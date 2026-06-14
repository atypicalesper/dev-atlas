'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Code2,
  Flame,
  Layers3,
  LucideIcon,
  Pointer,
  RefreshCcw,
  Sparkles,
  Target,
  TimerReset,
  Zap,
} from 'lucide-react';

const STORAGE_KEY = 'devatlas_special_progress_v2';

const THEME = {
  pageBackground: `
    radial-gradient(circle at 12% 12%, rgba(244, 184, 111, 0.22), transparent 28%),
    radial-gradient(circle at 88% 10%, rgba(134, 168, 255, 0.14), transparent 24%),
    radial-gradient(circle at 60% 100%, rgba(255, 224, 189, 0.34), transparent 26%),
    linear-gradient(180deg, #fbf5ec 0%, #f8efe2 44%, #f5ecdf 100%)
  `,
  heroBackground: 'linear-gradient(135deg, rgba(255, 251, 245, 0.94), rgba(251, 243, 230, 0.98))',
  panelBackground: 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(252,247,240,0.9))',
  panelBackgroundSoft: 'rgba(255,255,255,0.74)',
  chipBackground: 'rgba(255, 239, 214, 0.82)',
  chipBorder: 'rgba(190, 133, 63, 0.18)',
  border: 'rgba(103, 75, 44, 0.12)',
  borderStrong: 'rgba(171, 122, 62, 0.2)',
  text: '#2b2018',
  textMuted: '#5e4a3a',
  textSoft: '#7d6857',
  eyebrow: '#9f6a2f',
  accent: '#ca7c3e',
  accentSoft: '#e7b37d',
  success: '#2f8d56',
  warning: '#bf7a34',
  danger: '#cc6f54',
  info: '#4c77c8',
  progressTrack: 'rgba(107, 78, 50, 0.08)',
};

type TaskStatus = 'not-started' | 'tried' | 'solved' | 'revise';

type Task = {
  id: string;
  text: string;
  href?: string;
  pattern?: string;
};

type TaskProgress = {
  status: TaskStatus;
  updatedAt: number;
};

type Section = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  tasks: Task[];
};

const STATUS_ORDER: TaskStatus[] = ['not-started', 'tried', 'solved', 'revise'];

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  'not-started': { label: 'Not started', color: '#7d6857', bg: 'rgba(255,255,255,0.66)', border: 'rgba(103, 75, 44, 0.12)' },
  tried: { label: 'Tried', color: '#a8692f', bg: 'rgba(255, 228, 191, 0.72)', border: 'rgba(198, 135, 55, 0.22)' },
  solved: { label: 'Solved', color: '#2f8d56', bg: 'rgba(214, 245, 223, 0.82)', border: 'rgba(83, 165, 110, 0.24)' },
  revise: { label: 'Revise', color: '#b85f46', bg: 'rgba(255, 224, 214, 0.82)', border: 'rgba(214, 116, 82, 0.24)' },
};

const FUNDAMENTALS: Section = {
  id: 'fundamentals',
  eyebrow: 'Foundation',
  title: 'Master JavaScript First',
  description: 'If the language feels shaky, DSA will feel slower than it should. This is your speed layer.',
  icon: Code2,
  tasks: [
    { id: 'js-arrays', text: 'Arrays: map, filter, reduce, splice, slice, sort', pattern: 'Language fluency' },
    { id: 'js-destructuring', text: 'Destructuring, spread/rest, mutation vs immutability', pattern: 'Language fluency' },
    { id: 'js-maps', text: 'Objects vs Map vs Set, and when each wins', pattern: 'Hashing mindset' },
    { id: 'js-closures', text: 'Closures, scope, hoisting, TDZ, references vs copies', pattern: 'Language fluency' },
    { id: 'js-event-loop', text: 'Event loop fluency: sync, microtasks, macrotasks', pattern: 'Async reasoning' },
    { id: 'js-strings', text: 'Strings, indexing, substring/slice, and pointer-safe traversal', pattern: 'Language fluency' },
    { id: 'js-sorting', text: 'Custom comparators, stable expectations, and numeric sort behavior', pattern: 'Language fluency' },
    { id: 'js-recursion', text: 'Recursion basics, stack frames, and base-case design', pattern: 'Recursive thinking' },
    { id: 'js-complexity', text: 'Instantly identify O(1), O(log n), O(n), O(n log n), O(n²)', pattern: 'Complexity' },
  ],
};

const PATTERN_PHASES: Section[] = [
  {
    id: 'phase-1',
    eyebrow: 'Phase 1',
    title: 'Core Patterns',
    description: 'This is where interview pattern recognition starts to become automatic.',
    icon: Layers3,
    tasks: [
      { id: 'two-sum', text: 'Two Sum', href: 'https://leetcode.com/problems/two-sum/', pattern: 'Arrays + Hashing' },
      { id: 'contains-duplicate', text: 'Contains Duplicate', href: 'https://leetcode.com/problems/contains-duplicate/', pattern: 'Arrays + Hashing' },
      { id: 'valid-anagram', text: 'Valid Anagram / frequency counter', href: 'https://leetcode.com/problems/valid-anagram/', pattern: 'Arrays + Hashing' },
      { id: 'group-anagrams', text: 'Group Anagrams', href: 'https://leetcode.com/problems/group-anagrams/', pattern: 'Arrays + Hashing' },
      { id: 'product-except-self', text: 'Product of Array Except Self / prefix thinking', href: 'https://leetcode.com/problems/product-of-array-except-self/', pattern: 'Arrays + Hashing' },
      { id: 'subarray-sum-k', text: 'Subarray Sum Equals K / prefix sum + hashmap', href: 'https://leetcode.com/problems/subarray-sum-equals-k/', pattern: 'Prefix Sum' },
      { id: 'valid-palindrome', text: 'Valid Palindrome / two pointers', href: 'https://leetcode.com/problems/valid-palindrome/', pattern: 'Two Pointers' },
      { id: 'move-zeroes', text: 'Move Zeroes', href: 'https://leetcode.com/problems/move-zeroes/', pattern: 'Two Pointers' },
      { id: 'two-sum-ii', text: 'Two Sum II / sorted pointers', href: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', pattern: 'Two Pointers' },
      { id: 'container-water', text: 'Container With Most Water', href: 'https://leetcode.com/problems/container-with-most-water/', pattern: 'Two Pointers' },
      { id: 'longest-substring', text: 'Longest Substring Without Repeating Characters', href: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', pattern: 'Sliding Window' },
      { id: 'max-average', text: 'Maximum Average Subarray I / fixed window', href: 'https://leetcode.com/problems/maximum-average-subarray-i/', pattern: 'Sliding Window' },
      { id: 'best-time-stock', text: 'Best Time to Buy and Sell Stock / running min', href: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', pattern: 'Sliding Window' },
      { id: 'permutation-in-string', text: 'Permutation in String / window matching', href: 'https://leetcode.com/problems/permutation-in-string/', pattern: 'Sliding Window' },
      { id: 'valid-parentheses', text: 'Valid Parentheses', href: 'https://leetcode.com/problems/valid-parentheses/', pattern: 'Stack' },
      { id: 'next-greater', text: 'Next Greater Element I / monotonic stack', href: 'https://leetcode.com/problems/next-greater-element-i/', pattern: 'Stack' },
      { id: 'daily-temperatures', text: 'Daily Temperatures / monotonic stack', href: 'https://leetcode.com/problems/daily-temperatures/', pattern: 'Stack' },
      { id: 'binary-search', text: 'Binary Search', href: 'https://leetcode.com/problems/binary-search/', pattern: 'Binary Search' },
      { id: 'first-last-position', text: 'Find First and Last Position / lower-upper bound', href: 'https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/', pattern: 'Binary Search' },
      { id: 'search-rotated', text: 'Search in Rotated Sorted Array', href: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', pattern: 'Binary Search' },
      { id: 'koko-bananas', text: 'Koko Eating Bananas / search space reduction', href: 'https://leetcode.com/problems/koko-eating-bananas/', pattern: 'Binary Search' },
    ],
  },
  {
    id: 'phase-2',
    eyebrow: 'Phase 2',
    title: 'Intermediate',
    description: 'This phase starts looking more like real interview pressure: structure changes, traversal, and priority.',
    icon: Pointer,
    tasks: [
      { id: 'reverse-linked-list', text: 'Reverse Linked List', href: 'https://leetcode.com/problems/reverse-linked-list/', pattern: 'Linked List' },
      { id: 'linked-list-cycle', text: 'Linked List Cycle', href: 'https://leetcode.com/problems/linked-list-cycle/', pattern: 'Linked List' },
      { id: 'merge-two-lists', text: 'Merge Two Sorted Lists', href: 'https://leetcode.com/problems/merge-two-sorted-lists/', pattern: 'Linked List' },
      { id: 'reorder-list', text: 'Reorder List / slow-fast + reverse + merge', href: 'https://leetcode.com/problems/reorder-list/', pattern: 'Linked List' },
      { id: 'max-depth-tree', text: 'Maximum Depth of Binary Tree / DFS', href: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', pattern: 'Trees' },
      { id: 'level-order', text: 'Binary Tree Level Order Traversal / BFS', href: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', pattern: 'Trees' },
      { id: 'diameter-tree', text: 'Diameter of Binary Tree / recursive tree DP', href: 'https://leetcode.com/problems/diameter-of-binary-tree/', pattern: 'Trees' },
      { id: 'invert-tree', text: 'Invert Binary Tree / recursion warmup', href: 'https://leetcode.com/problems/invert-binary-tree/', pattern: 'Trees' },
      { id: 'kth-largest', text: 'Kth Largest Element in an Array / heap', href: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', pattern: 'Heap' },
      { id: 'top-k-frequent', text: 'Top K Frequent Elements / heap or buckets', href: 'https://leetcode.com/problems/top-k-frequent-elements/', pattern: 'Heap' },
      { id: 'merge-k-lists', text: 'Merge k Sorted Lists / priority queue', href: 'https://leetcode.com/problems/merge-k-sorted-lists/', pattern: 'Heap' },
    ],
  },
  {
    id: 'phase-3',
    eyebrow: 'Phase 3',
    title: 'Expansion Patterns',
    description: 'These are common interview patterns that fill the gap between core fluency and full advanced territory.',
    icon: Zap,
    tasks: [
      { id: 'merge-intervals', text: 'Merge Intervals / sort + sweep', href: 'https://leetcode.com/problems/merge-intervals/', pattern: 'Intervals' },
      { id: 'insert-interval', text: 'Insert Interval', href: 'https://leetcode.com/problems/insert-interval/', pattern: 'Intervals' },
      { id: 'jump-game', text: 'Jump Game / greedy reachability', href: 'https://leetcode.com/problems/jump-game/', pattern: 'Greedy' },
      { id: 'partition-labels', text: 'Partition Labels / greedy boundaries', href: 'https://leetcode.com/problems/partition-labels/', pattern: 'Greedy' },
      { id: 'subsets', text: 'Subsets / backtracking template', href: 'https://leetcode.com/problems/subsets/', pattern: 'Backtracking' },
      { id: 'combination-sum', text: 'Combination Sum / backtracking', href: 'https://leetcode.com/problems/combination-sum/', pattern: 'Backtracking' },
      { id: 'implement-trie', text: 'Implement Trie (Prefix Tree)', href: 'https://leetcode.com/problems/implement-trie-prefix-tree/', pattern: 'Trie' },
      { id: 'word-search', text: 'Word Search / grid backtracking', href: 'https://leetcode.com/problems/word-search/', pattern: 'Backtracking' },
      { id: 'single-number', text: 'Single Number / bit manipulation', href: 'https://leetcode.com/problems/single-number/', pattern: 'Bit Manipulation' },
      { id: 'sum-two-integers', text: 'Sum of Two Integers / bit operations', href: 'https://leetcode.com/problems/sum-of-two-integers/', pattern: 'Bit Manipulation' },
    ],
  },
  {
    id: 'phase-4',
    eyebrow: 'Phase 4',
    title: 'Advanced',
    description: 'Only move here once the early patterns feel fast and obvious.',
    icon: Zap,
    tasks: [
      { id: 'num-islands', text: 'Number of Islands / graph DFS-BFS', href: 'https://leetcode.com/problems/number-of-islands/', pattern: 'Graphs' },
      { id: 'course-schedule', text: 'Course Schedule / topological sort', href: 'https://leetcode.com/problems/course-schedule/', pattern: 'Graphs' },
      { id: 'network-delay', text: 'Network Delay Time / Dijkstra', href: 'https://leetcode.com/problems/network-delay-time/', pattern: 'Graphs' },
      { id: 'rotting-oranges', text: 'Rotting Oranges / multi-source BFS', href: 'https://leetcode.com/problems/rotting-oranges/', pattern: 'Graphs' },
      { id: 'clone-graph', text: 'Clone Graph / traversal + mapping', href: 'https://leetcode.com/problems/clone-graph/', pattern: 'Graphs' },
      { id: 'climbing-stairs', text: 'Climbing Stairs / DP basics', href: 'https://leetcode.com/problems/climbing-stairs/', pattern: 'Dynamic Programming' },
      { id: 'house-robber', text: 'House Robber / DP transitions', href: 'https://leetcode.com/problems/house-robber/', pattern: 'Dynamic Programming' },
      { id: 'coin-change', text: 'Coin Change / classic DP', href: 'https://leetcode.com/problems/coin-change/', pattern: 'Dynamic Programming' },
      { id: 'longest-increasing-subsequence', text: 'Longest Increasing Subsequence', href: 'https://leetcode.com/problems/longest-increasing-subsequence/', pattern: 'Dynamic Programming' },
    ],
  },
];

const LOOP_STEPS: Task[] = [
  { id: 'loop-1', text: 'Try for 20–30 minutes before reading the answer', pattern: 'Learning loop' },
  { id: 'loop-2', text: 'If stuck, study the solution deeply rather than skimming', pattern: 'Learning loop' },
  { id: 'loop-3', text: 'Rewrite the solution from scratch yourself', pattern: 'Learning loop' },
  { id: 'loop-4', text: 'Explain why it works, plus time and space complexity', pattern: 'Learning loop' },
  { id: 'loop-5', text: 'Redo the same problem after 1 day, 3 days, and 1 week', pattern: 'Learning loop' },
];

const STACKS: Task[] = [
  { id: 'platform-neetcode', text: 'Use NeetCode for structured pattern-first progression', href: 'https://neetcode.io/', pattern: 'Tooling' },
  { id: 'platform-algomonster', text: 'Use AlgoMonster when you want deeper guided explanations', href: 'https://algo.monster/', pattern: 'Tooling' },
  { id: 'platform-leetcode', text: 'Use LeetCode for deliberate practice and timed solving', href: 'https://leetcode.com/', pattern: 'Tooling' },
  { id: 'platform-jsinfo', text: 'Use JavaScript.info to close JS concept gaps fast', href: 'https://javascript.info/', pattern: 'Tooling' },
  { id: 'ts-habits', text: 'In TypeScript, prefer `number[]`, `Map<number, number>`, `Set<number>`, and readable names', pattern: 'TypeScript' },
  { id: 'ts-record', text: 'Use `Record<string, number>` when a plain keyed object is enough and iteration semantics are simple', pattern: 'TypeScript' },
  { id: 'clean-solutions', text: 'Write readable solutions with meaningful names, edge-case handling, and clear helper functions', pattern: 'Interview hygiene' },
  { id: 'visualization', text: 'Draw arrays, move pointers manually, visualize stacks, and trace recursion trees', pattern: 'Visualization' },
];

const INTERVIEW_EXECUTION: Task[] = [
  { id: 'exec-clarify', text: 'Clarify inputs, constraints, and edge cases before you start coding', pattern: 'Interview execution' },
  { id: 'exec-pattern', text: 'Name the pattern out loud before implementation so the interviewer hears your model', pattern: 'Interview execution' },
  { id: 'exec-bruteforce', text: 'Start from the brute-force idea briefly, then explain why you are optimizing away from it', pattern: 'Interview execution' },
  { id: 'exec-complexity', text: 'State time and space complexity before finishing, not after you are asked', pattern: 'Interview execution' },
  { id: 'exec-narrate', text: 'Narrate pointer movement, hashmap purpose, and invariant changes as you code', pattern: 'Interview execution' },
  { id: 'exec-test', text: 'Dry-run your solution on one normal case and one edge case before saying done', pattern: 'Interview execution' },
];

const REVISION_SYSTEM: Task[] = [
  { id: 'revise-miss-pattern', text: 'Mark a problem for revision if you missed the pattern, even if you eventually solved it', pattern: 'Revision system' },
  { id: 'revise-slow', text: 'Mark it for revision if it took too long and felt fuzzy under time pressure', pattern: 'Revision system' },
  { id: 'revise-buggy', text: 'Mark it for revision if you needed multiple bug-fix passes for pointers, indices, or boundaries', pattern: 'Revision system' },
  { id: 'revise-template', text: 'Keep a short mental template for each pattern family you repeatedly miss', pattern: 'Revision system' },
  { id: 'revise-journal', text: 'Write one sentence on why you got it wrong: pattern miss, bug, complexity, or edge case', pattern: 'Revision system' },
  { id: 'revise-loop', text: 'Cycle misses through 1-day, 3-day, and 7-day repeats until the shape feels obvious', pattern: 'Revision system' },
];

const PITFALLS: Task[] = [
  { id: 'pitfall-random', text: 'Do not solve random problems all day without tracking what pattern you are training', pattern: 'Common mistakes' },
  { id: 'pitfall-passive', text: 'Do not read solutions passively and count that as progress', pattern: 'Common mistakes' },
  { id: 'pitfall-easies', text: 'Do not hide in easy problems once you understand the basics', pattern: 'Common mistakes' },
  { id: 'pitfall-speed', text: 'Do not optimize only for AC; optimize for recognition speed and clean explanation', pattern: 'Common mistakes' },
  { id: 'pitfall-memory', text: 'Do not trust “I understood it once” without a scheduled redo', pattern: 'Common mistakes' },
  { id: 'pitfall-sloppy', text: 'Do not use vague variable names like `x`, `temp`, or `res2` in interview code', pattern: 'Common mistakes' },
];

const NEXT_ACTIONS: Task[] = [
  { id: 'next-review-old', text: 'Review older topics every week so solved patterns do not quietly decay', pattern: 'What to do now' },
  { id: 'next-revisit-revise', text: 'Open your `revise` problems first before starting brand-new ones', pattern: 'What to do now' },
  { id: 'next-redo-pattern', text: 'Redo one older problem from each weak pattern before moving deeper into that track', pattern: 'What to do now' },
  { id: 'next-relearn-loop', text: 'If a topic feels shaky again, restart the loop: try, study, rewrite, explain, repeat', pattern: 'What to do now' },
  { id: 'next-balance', text: 'Split sessions between new pattern exposure and old pattern reinforcement', pattern: 'What to do now' },
  { id: 'next-weekly-check', text: 'At the end of each week, ask: what got faster, what still feels slow, and what needs another cycle', pattern: 'What to do now' },
];

function isProblemTask(task: Task) {
  return Boolean(task.href?.includes('leetcode.com/problems/'));
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function SpecialClient() {
  const [progress, setProgress] = useState<Record<string, TaskProgress>>({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as string[] | Record<string, TaskProgress>;
      if (Array.isArray(saved)) {
        const migrated = Object.fromEntries(saved.map(id => [id, { status: 'solved' as TaskStatus, updatedAt: Date.now() }]));
        setProgress(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } else {
        setProgress(saved);
      }
    } catch {
      setProgress({});
    }
  }, []);

  function updateStatus(id: string, status: TaskStatus) {
    setProgress(current => {
      const next = {
        ...current,
        [id]: {
          status,
          updatedAt: Date.now(),
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const allTasks = useMemo(
    () =>
      [FUNDAMENTALS, ...PATTERN_PHASES]
        .flatMap(section => section.tasks)
        .concat(LOOP_STEPS, STACKS, INTERVIEW_EXECUTION, REVISION_SYSTEM, PITFALLS, NEXT_ACTIONS),
    [],
  );
  const problemTasks = useMemo(() => allTasks.filter(isProblemTask), [allTasks]);
  const solvedCount = Object.values(progress).filter(entry => entry.status === 'solved').length;
  const reviseCount = Object.values(progress).filter(entry => entry.status === 'revise').length;
  const touchedCount = Object.values(progress).filter(entry => entry.status !== 'not-started').length;
  const totalCount = allTasks.length;
  const pct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const todayProblem = useMemo(() => {
    const today = isoDate(new Date());
    const index = hashString(today) % problemTasks.length;
    return problemTasks[index];
  }, [problemTasks]);

  const revisionProblem = useMemo(() => {
    const candidates = problemTasks.filter(task => {
      const status = progress[task.id]?.status;
      return status === 'revise' || status === 'tried';
    });
    return candidates.sort((a, b) => (progress[b.id]?.updatedAt ?? 0) - (progress[a.id]?.updatedAt ?? 0))[0] ?? null;
  }, [problemTasks, progress]);

  const redoProblem = useMemo(() => {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const candidates = problemTasks.filter(task => {
      const entry = progress[task.id];
      return entry?.status === 'solved' && now - entry.updatedAt >= threeDays;
    });
    return candidates.sort((a, b) => (progress[a.id]?.updatedAt ?? 0) - (progress[b.id]?.updatedAt ?? 0))[0] ?? null;
  }, [problemTasks, progress]);

  const patternStats = useMemo(() => {
    const buckets = new Map<string, { total: number; solved: number; revise: number; tried: number }>();
    for (const task of problemTasks) {
      const key = task.pattern ?? 'General';
      const current = buckets.get(key) ?? { total: 0, solved: 0, revise: 0, tried: 0 };
      current.total += 1;
      const status = progress[task.id]?.status ?? 'not-started';
      if (status === 'solved') current.solved += 1;
      if (status === 'revise') current.revise += 1;
      if (status === 'tried') current.tried += 1;
      buckets.set(key, current);
    }
    return [...buckets.entries()]
      .map(([pattern, stats]) => ({ pattern, ...stats, pct: Math.round((stats.solved / stats.total) * 100) }))
      .sort((a, b) => a.pct - b.pct || a.pattern.localeCompare(b.pattern));
  }, [problemTasks, progress]);

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-8 sm:py-10"
      style={{
        background: THEME.pageBackground,
      }}
    >
      <div id="overview" className="mx-auto max-w-6xl">
        <div
          className="overflow-hidden rounded-[2rem] border px-6 py-8 shadow-2xl sm:px-10"
          style={{
            background: THEME.heroBackground,
            borderColor: THEME.borderStrong,
            boxShadow: '0 30px 90px rgba(111, 80, 44, 0.12)',
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{
                  color: THEME.eyebrow,
                  backgroundColor: THEME.chipBackground,
                  border: `1px solid ${THEME.chipBorder}`,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <Sparkles size={12} />
                Special Route
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: THEME.text, fontFamily: 'var(--font-display)' }}>
                Algorithmic fluency and interview speed, turned into a live training cockpit.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8" style={{ color: THEME.textMuted }}>
                This page is now more than a roadmap. It tracks attempts, surfaces daily drills, and shows which patterns
                are actually becoming strong under repetition.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Chip label="Daily drill strip" />
                <Chip label="Attempt status memory" />
                <Chip label="Pattern mastery bars" />
                <Chip label="LeetCode jump list" />
              </div>
            </div>

            <div
              className="rounded-[1.75rem] border p-5"
              style={{
                background: THEME.panelBackground,
                borderColor: THEME.borderStrong,
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em]" style={{ color: THEME.eyebrow, fontFamily: 'JetBrains Mono, monospace' }}>
                    Solved progress
                  </div>
                  <div className="mt-1 text-2xl font-semibold" style={{ color: THEME.text }}>
                    {solvedCount}/{totalCount}
                  </div>
                </div>
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border text-xl font-semibold"
                  style={{
                    color: THEME.text,
                    borderColor: THEME.borderStrong,
                    background: `conic-gradient(${THEME.accent} ${pct * 3.6}deg, rgba(87, 64, 40, 0.08) 0deg)`,
                  }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full text-sm" style={{ backgroundColor: '#f8efe2' }}>
                    {pct}%
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <QuickMetric icon={Flame} label="Recommended pace" value="2–3 quality problems/day" />
                <QuickMetric icon={Clock3} label="Main horizon" value="4–6 months with revision" />
                <QuickMetric icon={Target} label="Primary goal" value="Recognize the pattern fast" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label="Touched" value={String(touchedCount)} />
                <MiniStat label="Need revision" value={String(reviseCount)} />
              </div>
            </div>
          </div>
        </div>

        <div id="daily-drills" className="mt-8 grid gap-4 lg:grid-cols-3">
          <DrillCard
            eyebrow="Today"
            title="Timed pattern rep"
            description="Treat this as your first 25-minute block."
            task={todayProblem}
            accent={THEME.accent}
          />
          <DrillCard
            eyebrow="Review"
            title="Come back to this one"
            description="This is where your weak spots stop slipping away."
            task={revisionProblem}
            fallback="Mark problems as tried or revise and this card will start surfacing them."
            accent={THEME.warning}
          />
          <DrillCard
            eyebrow="Redo"
            title="Three-day memory check"
            description="Solved once is not enough. Solved later is where speed comes from."
            task={redoProblem}
            fallback="Once a solved problem ages three days, it shows up here automatically."
            accent={THEME.danger}
          />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <GradientPanel id="strategy" title="Your exact strategy" eyebrow="Where you are now">
            <p className="text-sm leading-7" style={{ color: THEME.textMuted }}>
              Given your backend and production background, the missing layer is usually not engineering maturity. It is
              pattern exposure, solving speed, and interview-style instinct. That means medium problems first, strong revision,
              and obsessive repetition around pattern recognition.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Callout title="Lean into mediums" body="Avoid getting stuck in easy-only grinding. You want medium problems to become your comfort zone." />
              <Callout title="Think in patterns" body="Longest substring means sliding window. Top K means heap. Sorted array means binary search or pointers." />
            </div>
          </GradientPanel>

          <GradientPanel id="roadmap" title="Month-by-month roadmap" eyebrow="Focus order">
            <div className="space-y-3">
              {[
                ['Month 1', 'Arrays, HashMaps, Two Pointers'],
                ['Month 2', 'Sliding Window, Stack, Binary Search'],
                ['Month 3', 'Linked List, Trees'],
                ['Month 4', 'Heap, Intervals, Greedy, Backtracking'],
                ['Month 5', 'Graphs, Trie, Bit Manipulation'],
                ['Month 6', 'DP + interview speed'],
              ].map(([month, focus]) => (
                <div key={month} className="rounded-2xl border px-4 py-3" style={{ borderColor: THEME.border, backgroundColor: THEME.panelBackgroundSoft }}>
                  <div className="text-xs uppercase tracking-[0.18em]" style={{ color: THEME.eyebrow, fontFamily: 'JetBrains Mono, monospace' }}>{month}</div>
                  <div className="mt-1 text-sm font-medium" style={{ color: THEME.text }}>{focus}</div>
                </div>
              ))}
            </div>
          </GradientPanel>
        </div>

        <div id="mastery" className="mt-8 rounded-[2rem] border px-6 py-6" style={{ background: THEME.panelBackground, borderColor: THEME.borderStrong }}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em]" style={{ color: THEME.eyebrow, fontFamily: 'JetBrains Mono, monospace' }}>
                Pattern mastery
              </div>
              <h2 className="mt-2 text-2xl font-semibold" style={{ color: THEME.text, fontFamily: 'var(--font-display)' }}>
                Where your reps are compounding
              </h2>
            </div>
            <div className="text-sm" style={{ color: THEME.textSoft }}>
              Based on problems marked `solved`, not just touched
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {patternStats.map(stat => (
              <div key={stat.pattern} className="rounded-[1.35rem] border px-4 py-4" style={{ borderColor: THEME.border, backgroundColor: THEME.panelBackgroundSoft }}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: THEME.text }}>{stat.pattern}</div>
                  <div className="text-xs" style={{ color: THEME.textSoft }}>
                    {stat.solved}/{stat.total} solved
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: THEME.progressTrack }}>
                  <div className="h-full rounded-full" style={{ width: `${stat.pct}%`, background: 'linear-gradient(90deg, #d89455, #6d88d8)' }} />
                </div>
                <div className="mt-2 flex gap-3 text-xs" style={{ color: THEME.textSoft }}>
                  <span>{stat.tried} tried</span>
                  <span>{stat.revise} revise</span>
                  <span>{stat.pct}% mastery</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6">
          <ChecklistSection section={FUNDAMENTALS} progress={progress} onStatusChange={updateStatus} />
          {PATTERN_PHASES.map(section => (
            <ChecklistSection key={section.id} section={section} progress={progress} onStatusChange={updateStatus} />
          ))}

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <ChecklistColumn
              id="learning-loop"
              eyebrow="Learning loop"
              title="Use this exact repetition system"
              description="This is where raw solving becomes pattern memory."
              tasks={LOOP_STEPS}
              progress={progress}
              onStatusChange={updateStatus}
            />
            <ChecklistColumn
              id="tools-habits"
              eyebrow="Tools and habits"
              title="Platforms, TypeScript, and visual intuition"
              description="Pick the stack that keeps your reps high and your thinking clean."
              tasks={STACKS}
              progress={progress}
              onStatusChange={updateStatus}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <ChecklistColumn
              id="interview-execution"
              eyebrow="Interview execution"
              title="How to perform once the problem starts"
              description="The interviewer is grading your thinking process too, not just the final code."
              tasks={INTERVIEW_EXECUTION}
              progress={progress}
              onStatusChange={updateStatus}
            />
            <ChecklistColumn
              id="revision-system"
              eyebrow="Revision system"
              title="When a problem should come back"
              description="Revision should be triggered by confusion and slowness, not only by outright failure."
              tasks={REVISION_SYSTEM}
              progress={progress}
              onStatusChange={updateStatus}
            />
          </div>

          <ChecklistColumn
            id="common-pitfalls"
            eyebrow="Common mistakes"
            title="Things that quietly keep people stuck"
            description="These habits make people feel busy while slowing down real pattern recognition."
            tasks={PITFALLS}
            progress={progress}
            onStatusChange={updateStatus}
          />

          <ChecklistColumn
            id="what-to-do-now"
            eyebrow="What to do now"
            title="How to keep the loop alive"
            description="This is the part that keeps older topics fresh instead of letting them fade behind new ones."
            tasks={NEXT_ACTIONS}
            progress={progress}
            onStatusChange={updateStatus}
          />
        </div>

        <div className="mt-10 rounded-[2rem] border px-6 py-6" style={{ background: THEME.panelBackground, borderColor: THEME.borderStrong }}>
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.22em]" style={{ color: THEME.eyebrow, fontFamily: 'JetBrains Mono, monospace' }}>
              Most important skill
            </div>
            <h2 className="mt-2 text-2xl font-semibold" style={{ color: THEME.text, fontFamily: 'var(--font-display)' }}>
              Recognize the pattern quickly.
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: THEME.textMuted }}>
              The right problem should trigger the right mental model almost instantly. That only happens when the same
              families keep returning until they feel familiar under pressure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistSection({
  section,
  progress,
  onStatusChange,
}: {
  section: Section;
  progress: Record<string, TaskProgress>;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const stats = section.tasks.reduce(
    (acc, task) => {
      const status = progress[task.id]?.status ?? 'not-started';
      if (status === 'solved') acc.solved += 1;
      if (status === 'revise') acc.revise += 1;
      if (status === 'tried') acc.tried += 1;
      return acc;
    },
    { solved: 0, revise: 0, tried: 0 },
  );
  const Icon = section.icon;

  return (
    <section
      id={section.id}
      className="rounded-[2rem] border px-6 py-6"
      style={{
        background: THEME.panelBackground,
        borderColor: THEME.borderStrong,
      }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em]" style={{ color: THEME.eyebrow, fontFamily: 'JetBrains Mono, monospace' }}>
            <Icon size={14} />
            {section.eyebrow}
          </div>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: THEME.text, fontFamily: 'var(--font-display)' }}>{section.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7" style={{ color: THEME.textMuted }}>{section.description}</p>
        </div>
        <div className="rounded-[1.2rem] border px-4 py-3 text-sm font-medium" style={{ borderColor: THEME.border, color: THEME.text, backgroundColor: THEME.panelBackgroundSoft }}>
          <div>{stats.solved}/{section.tasks.length} solved</div>
          <div className="mt-1 text-xs" style={{ color: THEME.textSoft }}>{stats.tried} tried · {stats.revise} revise</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {section.tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            status={progress[task.id]?.status ?? 'not-started'}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </section>
  );
}

function ChecklistColumn({
  id,
  eyebrow,
  title,
  description,
  tasks,
  progress,
  onStatusChange,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  tasks: Task[];
  progress: Record<string, TaskProgress>;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  return (
    <section
      id={id}
      className="rounded-[2rem] border px-6 py-6"
      style={{
        background: THEME.panelBackground,
        borderColor: THEME.borderStrong,
      }}
    >
      <div className="text-xs uppercase tracking-[0.22em]" style={{ color: THEME.eyebrow, fontFamily: 'JetBrains Mono, monospace' }}>
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-semibold" style={{ color: THEME.text, fontFamily: 'var(--font-display)' }}>{title}</h2>
      <p className="mt-2 text-sm leading-7" style={{ color: THEME.textMuted }}>{description}</p>
      <div className="mt-5 space-y-3">
        {tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            status={progress[task.id]?.status ?? 'not-started'}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </section>
  );
}

function TaskRow({
  task,
  status,
  onStatusChange,
}: {
  task: Task;
  status: TaskStatus;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const meta = STATUS_META[status];

  return (
    <div
      className="group rounded-[1.35rem] border px-4 py-4 transition-all"
      style={{ borderColor: meta.border, backgroundColor: meta.bg }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
          style={{ borderColor: meta.border, backgroundColor: meta.bg, color: meta.color }}
        >
          {status === 'solved' ? <CheckCircle2 size={15} /> : status === 'revise' ? <RefreshCcw size={13} /> : status === 'tried' ? <TimerReset size={13} /> : <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-7" style={{ color: THEME.text }}>
            {task.text}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS_ORDER.map(option => {
              const optionMeta = STATUS_META[option];
              const active = status === option;
              return (
                <button
                  key={option}
                  onClick={() => onStatusChange(task.id, option)}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all"
                  style={{
                    borderColor: active ? optionMeta.border : THEME.border,
                    backgroundColor: active ? optionMeta.bg : 'rgba(255,255,255,0.72)',
                    color: active ? optionMeta.color : THEME.textSoft,
                  }}
                >
                  {optionMeta.label}
                </button>
              );
            })}
          </div>
          {task.href && (
            <a
              href={task.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: THEME.eyebrow }}
            >
              Open problem
              <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DrillCard({
  eyebrow,
  title,
  description,
  task,
  fallback,
  accent,
}: {
  eyebrow: string;
  title: string;
  description: string;
  task: Task | null;
  fallback?: string;
  accent: string;
}) {
  return (
    <section
      className="rounded-[1.75rem] border px-5 py-5"
      style={{
        background: THEME.panelBackground,
        borderColor: THEME.border,
      }}
    >
      <div className="text-xs uppercase tracking-[0.2em]" style={{ color: accent, fontFamily: 'JetBrains Mono, monospace' }}>
        {eyebrow}
      </div>
      <h2 className="mt-2 text-xl font-semibold" style={{ color: THEME.text, fontFamily: 'var(--font-display)' }}>{title}</h2>
      <p className="mt-2 text-sm leading-7" style={{ color: THEME.textMuted }}>{description}</p>
      {task ? (
        <div className="mt-4 rounded-[1.2rem] border px-4 py-4" style={{ borderColor: THEME.border, backgroundColor: THEME.panelBackgroundSoft }}>
          <div className="text-xs uppercase tracking-[0.18em]" style={{ color: accent, fontFamily: 'JetBrains Mono, monospace' }}>
            {task.pattern ?? 'Focus'}
          </div>
          <div className="mt-2 text-sm font-medium leading-7" style={{ color: THEME.text }}>
            {task.text}
          </div>
          {task.href && (
            <a
              href={task.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              style={{ color: THEME.eyebrow }}
            >
              Jump in
              <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      ) : (
        <div className="mt-4 text-sm leading-7" style={{ color: THEME.textSoft }}>
          {fallback ?? 'This lane fills itself once you start tracking progress.'}
        </div>
      )}
    </section>
  );
}

function GradientPanel({
  id,
  title,
  eyebrow,
  children,
}: {
  id?: string;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-[2rem] border px-6 py-6"
      style={{
        background: THEME.panelBackground,
        borderColor: THEME.borderStrong,
      }}
    >
      <div className="text-xs uppercase tracking-[0.22em]" style={{ color: THEME.eyebrow, fontFamily: 'JetBrains Mono, monospace' }}>
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-semibold" style={{ color: THEME.text, fontFamily: 'var(--font-display)' }}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Callout({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.35rem] border px-4 py-4" style={{ borderColor: THEME.border, backgroundColor: THEME.panelBackgroundSoft }}>
      <div className="text-sm font-semibold" style={{ color: THEME.text }}>{title}</div>
      <div className="mt-1 text-sm leading-7" style={{ color: THEME.textSoft }}>{body}</div>
    </div>
  );
}

function QuickMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: THEME.border, backgroundColor: THEME.panelBackgroundSoft }}>
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(230, 179, 116, 0.18)', color: THEME.eyebrow }}>
        <Icon size={14} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.18em]" style={{ color: THEME.textSoft, fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
        <div className="mt-1 text-sm font-medium" style={{ color: THEME.text }}>{value}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border px-4 py-3" style={{ borderColor: THEME.border, backgroundColor: THEME.panelBackgroundSoft }}>
      <div className="text-xs uppercase tracking-[0.16em]" style={{ color: THEME.textSoft, fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
      <div className="mt-1 text-lg font-semibold" style={{ color: THEME.text }}>{value}</div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <div
      className="rounded-full px-3 py-1.5 text-xs font-medium"
      style={{
        border: `1px solid ${THEME.chipBorder}`,
        backgroundColor: THEME.chipBackground,
        color: THEME.textMuted,
      }}
    >
      {label}
    </div>
  );
}
