'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useLayoutEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Brain, Server, Layers, Wrench, Database, Cloud, Code2, Bot, Network, ClipboardList, BookOpen, Play, Sparkles, Dice5, Heart, Flame, Trophy, Compass, ArrowRightLeft, RotateCcw, Binary, type LucideIcon } from 'lucide-react';
import { getVisitedCountBySection, getRecent, getBookmarkCount, getVisitStreak, getVisitedSet, getBookmarks, getTopSkills, getMissedQuizQuestions, getInProgressDocs, type InProgressDoc } from '@/lib/progress';
import { useNotebook } from '@/lib/notebook';
import { getSrsStats } from '@/lib/srs';
import RoughBorder from '@/components/RoughBorder';
import ShareProgressCard from '@/components/ShareProgressCard';
import TopicOfTheDay from '@/components/TopicOfTheDay';
import type { DocSummary } from '@/lib/docs';

const SECTIONS: { icon: LucideIcon; title: string; slug: string; desc: string; badge?: string }[] = [
  {
    icon: Brain,
    title: 'JavaScript',
    slug: 'javascript',
    desc: 'Event loop, closures, prototypes, async/await, generators, TypeScript type system, generics, decorators, async patterns, concurrency models, functional & OOP programming',
  },
  {
    icon: Server,
    title: 'Node.js',
    slug: 'node',
    desc: 'V8, libuv, streams, buffers, worker threads, cluster, child processes, HTTP internals, performance profiling, memory leaks, databases, SQL, NoSQL, Redis, API design, REST, GraphQL, gRPC, WebSockets',
  },
  {
    icon: Layers,
    title: 'React & Frontend',
    slug: 'react',
    desc: 'React 19, hooks, concurrent features, state management, Next.js App Router, Server Actions, browser internals, critical rendering path, Core Web Vitals, bundle optimization, Bun, Deno, edge runtimes',
  },
  {
    icon: Wrench,
    title: 'Engineering',
    slug: 'engineering',
    desc: 'System design, HLD/LLD, SOLID, microservices, DevOps, Docker, Kubernetes, CI/CD, testing (Jest, E2E), security (OWASP), interview practice, behavioral STAR stories',
  },
  {
    icon: Binary,
    title: 'DSA',
    slug: 'dsa',
    desc: 'Big-O, sliding window, two pointers, binary search patterns, trees and graphs, dynamic programming, backtracking, heaps, tries, union-find, monotonic stack, bit manipulation, intervals',
  },
  {
    icon: Database,
    title: 'Databases',
    slug: 'databases',
    desc: 'SQL deep dive, indexing (B-trees, covering indexes), transactions & ACID, isolation levels, PostgreSQL internals, Redis patterns, MongoDB, connection pooling, sharding, replication, schema design, CQRS, event sourcing',
  },
  {
    icon: Cloud,
    title: 'Cloud',
    slug: 'cloud',
    desc: 'AWS core services (EC2, S3, RDS, Lambda), IAM deep dive, DynamoDB data modelling, SQS vs SNS vs EventBridge, ECS vs EKS vs Lambda, Terraform vs CDK, observability and cost debugging',
  },
  {
    icon: Code2,
    title: 'Python',
    slug: 'python',
    desc: 'Python essentials, NumPy, Pandas, matplotlib/seaborn, scikit-learn, PyTorch, FastAPI, async Python, OpenAI/Anthropic/HuggingFace SDKs, structured outputs, prompt caching, tooling',
  },
  {
    icon: Bot,
    title: 'AI / ML',
    slug: 'ai',
    desc: 'LLM APIs, prompt engineering, RAG, vector DBs, LangChain, LangGraph, agentic AI, MCP, AI in production, fine-tuning, RAGAS evaluation, reasoning models, local LLMs, observability, cost optimization',
  },
  {
    icon: Network,
    title: 'Networks',
    slug: 'networks',
    desc: 'OSI & TCP/IP models, IP addressing, subnetting, CIDR, TCP/UDP, DNS, HTTP/2/3, TLS handshake, routing, NAT, firewalls, VPC, security groups, load balancers, CDN, troubleshooting',
  },
  {
    icon: ClipboardList,
    title: 'Cheatsheets',
    slug: 'cheatsheets',
    desc: 'All quick-reference cheatsheets in one place — JavaScript, React, Frontend, Backend, DSA patterns, System Design. Optimised for last-minute interview revision.',
    badge: 'NEW',
  },
];

const GUIDED_PATHS = [
  {
    title: 'Frontend',
    desc: 'HTML, CSS, DOM, React, Next.js, and performance in one run.',
    href: '/react/00-frontend-fundamentals/01-html-semantics-accessibility',
  },
  {
    title: 'Backend',
    desc: 'HTTP, Node internals, databases, API design, and reliability.',
    href: '/node/00-backend-fundamentals/01-http-and-rest',
  },
  {
    title: 'AI Engineer',
    desc: 'Prompting, RAG, agents, evaluations, and production LLM systems.',
    href: '/ai/00-roadmap/01-ai-developer-roadmap',
  },
  {
    title: 'Interview Sprint',
    desc: 'Cheatsheets, rapid-fire Q&A, and system design practice.',
    href: '/engineering/12-interview-practice/00-cheat-sheet/01-last-day-reference',
  },
];

interface Props {
  pageCounts: Record<string, number>;
  docs: DocSummary[];
  featuredDoc: DocSummary;
  initialSurpriseDoc: DocSummary;
  challengeDocs: Array<{ title: string; href: string }>;
  compareDocs: Array<{ title: string; href: string }>;
}

export default function HomePageClient({ pageCounts, docs, featuredDoc, initialSurpriseDoc, challengeDocs, compareDocs }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const [visitedCounts, setVisitedCounts] = useState<Record<string, number>>({});
  const [recentSlug, setRecentSlug] = useState<{ slug: string; title: string } | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [surpriseDoc, setSurpriseDoc] = useState<DocSummary>(initialSurpriseDoc);
  const [quickWins, setQuickWins] = useState<DocSummary[]>([]);
  const [oldBookmark, setOldBookmark] = useState<DocSummary | null>(null);
  const [topSkills, setTopSkills] = useState<Array<{ skill: string; count: number }>>([]);
  const [missedCount, setMissedCount] = useState(0);
  const [srsDue, setSrsDue] = useState(0);
  const [srsTotal, setSrsTotal] = useState(0);
  const [inProgressDocs, setInProgressDocs] = useState<InProgressDoc[]>([]);

  useLayoutEffect(() => {
    const counts: Record<string, number> = {};
    for (const s of SECTIONS) {
      counts[s.slug] = getVisitedCountBySection(s.slug);
    }
    setVisitedCounts(counts);

    const recent = getRecent();
    if (recent.length > 0) {
      setRecentSlug({ slug: recent[0].slug, title: recent[0].title });
    }
    setBookmarkCount(getBookmarkCount());
    setStreak(getVisitStreak());

    const visited = getVisitedSet();
    const quickWinPool = docs
      .filter(doc => !visited.has(doc.slug.join('/')))
      .sort((a, b) => a.wordCount - b.wordCount)
      .slice(0, 3);
    setQuickWins(quickWinPool);

    const bookmarkSlugs = getBookmarks();
    const bookmarkedDoc = bookmarkSlugs.length > 0
      ? docs.find(doc => doc.slug.join('/') === bookmarkSlugs[bookmarkSlugs.length - 1]) ?? null
      : null;
    setOldBookmark(bookmarkedDoc);
    setTopSkills(getTopSkills(4));
    setMissedCount(getMissedQuizQuestions().length);
    const srs = getSrsStats();
    setSrsDue(srs.due);
    setSrsTotal(srs.total);
    setInProgressDocs(getInProgressDocs(2));
  }, [docs]);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from(heroRef.current, {
      opacity: 0,
      y: -30,
      duration: 0.7,
      ease: 'power3.out',
    });

  }, { scope: gridRef, dependencies: [] });

  const { notebook } = useNotebook();
  const totalVisited = Object.values(visitedCounts).reduce((a, b) => a + b, 0);
  // First-time visitors get no progress dashboard — it would be a wall of zeros
  const hasHistory = totalVisited > 0 || recentSlug !== null || bookmarkCount > 0 || srsTotal > 0;
  const weakestSections = SECTIONS
    .map(section => {
      const visited = visitedCounts[section.slug] ?? 0;
      const total = pageCounts[section.slug] ?? 0;
      const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
      return { ...section, visited, total, pct };
    })
    .filter(section => section.visited > 0 && section.total > 0 && section.pct < 100)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2);

  function pickSurprise() {
    const currentKey = surpriseDoc.slug.join('/');
    const featuredKey = featuredDoc.slug.join('/');
    const pool = docs.filter(doc => {
      const key = doc.slug.join('/');
      return key !== currentKey && key !== featuredKey;
    });
    const next = pool[Math.floor(Math.random() * pool.length)] ?? initialSurpriseDoc;
    setSurpriseDoc(next);
  }

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-5xl mx-auto" ref={gridRef}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative isolate mb-10">
        {/* Editorial background orbs */}
        <div className="atlas-orbs" aria-hidden>
          <span className="atlas-orb atlas-orb-1" />
          <span className="atlas-orb atlas-orb-2" />
          <span className="atlas-orb atlas-orb-3" />
        </div>
        {/* Gradient glow behind title */}
        <div className="relative mb-3">
          {/* Dot grid background */}
          <div
            className="absolute -inset-6 rounded-2xl pointer-events-none opacity-[0.035] dark:opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--fg) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div
            className="absolute -inset-4 rounded-2xl opacity-[0.12] pointer-events-none blur-2xl"
            style={{ background: 'radial-gradient(ellipse at top left, var(--accent) 0%, transparent 70%)' }}
          />
          <div className="relative flex items-center gap-4">
            <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.svg`} alt="logo" width={72} height={72} className="logo-img object-contain shrink-0 drop-shadow-lg" unoptimized />
            <h1 className="text-5xl hero-title">
              dev <span style={{ color: 'var(--accent)' }}>atlas</span>
            </h1>
          </div>
        </div>

        <p className="text-lg mb-6 max-w-2xl" style={{ color: 'var(--muted)' }}>
          The complete developer knowledge base — JavaScript, TypeScript, React, Node.js, Python, AI/ML, system design, DSA, databases, and more.
        </p>

        <div className="flex gap-3 flex-wrap items-center">
          <Link
            href="/javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 hover:shadow-lg inline-flex items-center gap-2"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <BookOpen size={14} />
            Start Learning
          </Link>
          {recentSlug && (
            <Link
              href={`/${recentSlug.slug}`}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 border inline-flex items-center gap-2"
              style={{ color: 'var(--fg)', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              title={`Continue: ${recentSlug.title}`}
            >
              <Play size={13} />
              Continue
            </Link>
          )}
          <button
            onClick={pickSurprise}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 border inline-flex items-center gap-2"
            style={{ color: 'var(--fg)', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <Dice5 size={14} />
            Surprise Me
          </button>
          <Link
            href="/engineering/12-interview-practice/00-cheat-sheet/01-last-day-reference"
            className="text-sm font-medium underline-offset-4 hover:underline inline-flex items-center gap-1.5"
            style={{ color: 'var(--muted)' }}
          >
            <ClipboardList size={13} />
            Interview tomorrow?
          </Link>
        </div>

      </div>{/* end hero */}

      <div className="mb-10">
        <TopicOfTheDay doc={featuredDoc} />
      </div>

      {hasHistory && (
      <>
      <SectionHeading
        eyebrow="Continue learning"
        title="Pick up your momentum"
        description="The shortest path back into the atlas, based on what you have already opened."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-4 mb-6">
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            <Play size={12} />
            Resume your run
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inProgressDocs.length > 0 ? (
              inProgressDocs.map(doc => (
                <Link
                  key={doc.slug}
                  href={`/${doc.slug}`}
                  className="rounded-xl border px-4 py-4 transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Continue where you left off</div>
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{doc.pct}%</span>
                  </div>
                  <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{doc.title}</div>
                  <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${doc.pct}%`, backgroundColor: 'var(--accent)', transition: 'width 0.5s ease' }}
                    />
                  </div>
                </Link>
              ))
            ) : recentSlug ? (
              <Link
                href={`/${recentSlug.slug}`}
                className="rounded-xl border px-4 py-4 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Continue where you left off</div>
                <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{recentSlug.title}</div>
              </Link>
            ) : (
              <Link
                href={GUIDED_PATHS[0].href}
                className="rounded-xl border px-4 py-4 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Start with a guided path</div>
                <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{GUIDED_PATHS[0].desc}</div>
              </Link>
            )}

            {inProgressDocs.length < 2 && (oldBookmark ? (
              <Link
                href={oldBookmark.href}
                className="rounded-xl border px-4 py-4 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Revisit a saved tough one</div>
                <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{oldBookmark.title}</div>
              </Link>
            ) : (
              <div
                className="rounded-xl border px-4 py-4"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Build a comeback pile</div>
                <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Bookmark a few tricky reads and they will show up here for a cleaner next session.
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Your Momentum
            </div>
            <ShareProgressCard
              streak={streak}
              pagesRead={totalVisited}
              bookmarks={bookmarkCount}
              topSkill={topSkills[0] ? formatSkill(topSkills[0].skill) : undefined}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={Flame} value={String(streak)} label="Day streak" />
            <StatTile icon={Heart} value={String(bookmarkCount)} label="Bookmarks" />
            <StatTile icon={Trophy} value={String(totalVisited)} label="Pages seen" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 mb-10">
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            <Compass size={12} />
            Quick wins
          </div>
          <div className="space-y-2">
            {quickWins.map(doc => (
              <Link
                key={doc.href}
                href={doc.href}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
              >
                <span className="truncate pr-3">{doc.title}</span>
                <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted)' }}>
                  {Math.max(1, Math.ceil(doc.wordCount / 250))} min
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Weak spots
          </div>
          <div className="space-y-3">
            {weakestSections.length > 0 ? weakestSections.map(section => (
              <Link
                key={section.slug}
                href={`/${section.slug}`}
                className="block rounded-xl border px-3 py-3 transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="mb-1 text-sm font-semibold" style={{ color: 'var(--fg)' }}>{section.title}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {section.visited}/{section.total} pages visited
                </div>
              </Link>
            )) : (
              <div className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Start a second topic and this turns into a catch-up list instead of just a stats panel.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 mb-10">
        <Link
          href="/review"
          className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            <RotateCcw size={12} />
            Today&apos;s review
          </div>
          <div className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
            {srsDue + missedCount > 0 ? 'You have cards ready to review' : 'Retry missed questions and saved reads'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={{
                borderColor: srsDue > 0 ? 'var(--accent)' : 'var(--border)',
                color: srsDue > 0 ? 'var(--accent)' : 'var(--muted)',
                backgroundColor: srsDue > 0 ? 'var(--accent-glow)' : 'transparent',
              }}
            >
              {srsDue} flashcard{srsDue === 1 ? '' : 's'} due{srsTotal > 0 ? ` / ${srsTotal}` : ''}
            </span>
            <span
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={{
                borderColor: missedCount > 0 ? 'var(--accent)' : 'var(--border)',
                color: missedCount > 0 ? 'var(--accent)' : 'var(--muted)',
                backgroundColor: missedCount > 0 ? 'var(--accent-glow)' : 'transparent',
              }}
            >
              {missedCount} missed question{missedCount === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {srsDue + missedCount > 0
              ? 'Spaced-repetition flashcards and missed quiz questions, bundled into one comeback run.'
              : 'Answer quizzes and rate flashcards as you read — they collect here into a daily review queue.'}
          </div>
        </Link>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Skill momentum
          </div>
          <div className="flex flex-wrap gap-2">
            {topSkills.length > 0 ? topSkills.map(skill => (
              <span
                key={skill.skill}
                className="rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--fg)', backgroundColor: 'var(--bg)' }}
              >
                {formatSkill(skill.skill)} · {skill.count}
              </span>
            )) : (
              <div className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Read a few docs and the atlas starts surfacing the skills you are really compounding.
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      <SectionHeading
        eyebrow="Discover"
        title="Find something worth opening"
        description="A smaller, more intentional set of ways to explore instead of one long homepage feed."
      />

      <div className="grid grid-cols-1 gap-4 mb-10">
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Challenge Mode
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {challengeDocs.map(doc => (
              <Link
                key={doc.href}
                href={doc.href}
                className="block rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-[var(--sidebar-hover)]"
                style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
              >
                {doc.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 mb-10">
        <Link
          href={`/${surpriseDoc.slug.join('/')}`}
          className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md lg:self-start"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            <Dice5 size={12} />
            Surprise Pick
          </div>
          <div className="text-base font-semibold" style={{ color: 'var(--fg)' }}>{surpriseDoc.title}</div>
          <div className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{surpriseDoc.excerpt}</div>
        </Link>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div className="mb-3 flex items-center gap-2">
              <ArrowRightLeft size={14} style={{ color: 'var(--accent)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                Compare & Decide
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {compareDocs.slice(0, 2).map(doc => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{doc.title}</div>
                  <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    Perfect when you want trade-offs, not just definitions.
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                Guided Starts
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GUIDED_PATHS.map(path => (
                <Link
                  key={path.title}
                  href={path.href}
                  className="rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{path.title}</div>
                  <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{path.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Explore topics"
        title="Browse the atlas map"
        description="Once you know what mode you are in, the topic grid should be the only broad menu you need."
      />

      {/* ── Section grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SECTIONS.map((s, i) => {
          const visited = visitedCounts[s.slug] ?? 0;
          const total = pageCounts[s.slug] ?? 0;
          const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
          return (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="topic-card group block rounded-xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{
                '--stagger': `${i * 60}ms`,
                backgroundColor: 'var(--card-bg)',
                borderColor: notebook ? 'transparent' : 'var(--card-border)',
              } as React.CSSProperties}
            >
              {notebook && <RoughBorder />}
              {/* Accent bar on left edge */}
              <div className="card-accent-bar" />

              <div className="flex items-start gap-3">
                {/* Icon with subtle background */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110"
                  style={{ background: 'var(--sidebar-active)' }}
                >
                  <s.icon size={16} style={{ color: 'var(--accent)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2
                      className="font-semibold text-sm group-hover:text-indigo-400 transition-colors truncate"
                      style={{ color: 'var(--fg)' }}
                    >
                      {s.title}
                    </h2>
                    {/* NEW badge — hidden once the section has been visited */}
                    {s.badge && visited === 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {s.desc}
                  </p>

                  {/* Progress bar — only when user has visited at least one page */}
                  {visited > 0 && total > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                          {visited}/{total} pages
                        </span>
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: pct === 100 ? 'var(--success)' : 'var(--accent)' }}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct === 100 ? 'var(--success)' : 'var(--accent)',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div className="mt-10 flex gap-6 flex-wrap items-center text-sm border-t pt-6" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
        {[
          ['370+', 'Topic Files'],
          ['4300+', 'Code Examples'],
          ['700+', 'Interview Q&As'],
          ['11',   'Categories'],
        ].map(([num, label]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold tabular-nums" style={{ color: 'var(--accent)', letterSpacing: '-0.02em' }}>{num}</span>
            <span className="text-xs">{label}</span>
          </div>
        ))}

        <div className="ml-auto flex items-center gap-3">
          {/* Total visited pages */}
          {totalVisited > 0 && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                {totalVisited}
              </span>
              <span>pages read</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatSkill(skill: string) {
  return skill
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
        {eyebrow}
      </div>
      <h2 className="section-heading-title mt-1 text-2xl" style={{ color: 'var(--fg)' }}>
        {title}
      </h2>
      <p className="mt-1 text-sm max-w-2xl" style={{ color: 'var(--muted)' }}>
        {description}
      </p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
      <div className="mb-2 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
        <Icon size={14} />
        <span className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{value}</span>
      </div>
      <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}
