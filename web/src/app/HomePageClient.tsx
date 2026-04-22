'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useLayoutEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Brain, Server, Layers, Wrench, Database, Cloud, Code2, Bot, Network, ClipboardList, BookOpen, Play, Sparkles, Dice5, Heart, Flame, Trophy, type LucideIcon } from 'lucide-react';
import { getVisitedCountBySection, getRecent, getBookmarkCount, getVisitStreak } from '@/lib/progress';
import { useNotebook } from '@/lib/notebook';
import RoughBorder from '@/components/RoughBorder';
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
    desc: 'System design, HLD/LLD, SOLID, microservices, DevOps, Docker, Kubernetes, CI/CD, testing (Jest, E2E), security (OWASP), DSA, algorithms, interview practice, behavioral STAR stories',
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
    desc: 'AWS core services (IAM, EC2, S3, RDS, Lambda, SQS/SNS, ECS), Terraform, CDK, serverless patterns, Step Functions, EventBridge, DynamoDB, CloudFront, observability, cost optimization',
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
  challengeDocs: Array<{ title: string; href: string }>;
}

export default function HomePageClient({ pageCounts, docs, featuredDoc, challengeDocs }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const [visitedCounts, setVisitedCounts] = useState<Record<string, number>>({});
  const [recentSlug, setRecentSlug] = useState<{ slug: string; title: string } | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [surpriseDoc, setSurpriseDoc] = useState<DocSummary>(featuredDoc);

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
  }, []);

  useGSAP(() => {
    gsap.from(heroRef.current, {
      opacity: 0,
      y: -30,
      duration: 0.7,
      ease: 'power3.out',
    });

  }, { scope: gridRef, dependencies: [] });

  const { notebook } = useNotebook();
  const totalVisited = Object.values(visitedCounts).reduce((a, b) => a + b, 0);

  function pickSurprise() {
    const pool = docs.filter(doc => doc.slug.join('/') !== surpriseDoc.slug.join('/'));
    const next = pool[Math.floor(Math.random() * pool.length)] ?? featuredDoc;
    setSurpriseDoc(next);
  }

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-5xl mx-auto" ref={gridRef}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div ref={heroRef} className="mb-10">
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
            <h1 className="text-4xl font-bold hero-title">
              dev <span style={{ color: 'var(--accent)' }}>atlas</span>
            </h1>
          </div>
        </div>

        <p className="text-lg mb-6 max-w-2xl" style={{ color: 'var(--muted)' }}>
          The complete developer knowledge base — JavaScript, TypeScript, React, Node.js, Python, AI/ML, system design, DSA, databases, and more.
        </p>

        <div className="flex gap-3 flex-wrap">
          <Link
            href="/engineering/12-interview-practice/00-cheat-sheet/01-last-day-reference"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 hover:shadow-lg inline-flex items-center gap-2"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <ClipboardList size={14} />
            Last-Day Cheat Sheet
          </Link>
          <Link
            href="/javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 border inline-flex items-center gap-2"
            style={{ color: 'var(--fg)', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
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
        </div>

      </div>{/* end hero */}

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 mb-10">
        <Link
          href={`/${featuredDoc.slug.join('/')}`}
          className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
            Today in Atlas
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>{featuredDoc.title}</div>
          <div className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{featuredDoc.excerpt}</div>
        </Link>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Your Momentum
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatTile icon={Flame} value={String(streak)} label="Day streak" />
            <StatTile icon={Heart} value={String(bookmarkCount)} label="Bookmarks" />
            <StatTile icon={Trophy} value={String(totalVisited)} label="Pages seen" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 mb-10">
        <Link
          href={`/${surpriseDoc.slug.join('/')}`}
          className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            <Dice5 size={12} />
            Surprise Pick
          </div>
          <div className="text-base font-semibold" style={{ color: 'var(--fg)' }}>{surpriseDoc.title}</div>
          <div className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{surpriseDoc.excerpt}</div>
        </Link>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Challenge Mode
          </div>
          <div className="space-y-2">
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

      <div className="mb-10">
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
          ['285+', 'Topic Files'],
          ['1200+', 'Code Examples'],
          ['700+', 'Interview Q&As'],
          ['9',    'Categories'],
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
