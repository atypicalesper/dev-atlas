import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDocContent, getDirInfo, getPrevNext, getAllDocSlugs, getAllDirSlugs, extractHeadings, extractExcerpt, humanize, getRelatedDocs, getPracticeDoc, getCompareDoc } from '@/lib/docs';
import MarkdownContent from '@/components/MarkdownContent';
import TableOfContents from '@/components/TableOfContents';
import ReadingProgress from '@/components/ReadingProgress';
import DocPageClient from '@/components/DocPageClient';
import PrevNextNav from '@/components/PrevNextNav';
import NotebookProseDecor from '@/components/NotebookProseDecor';
import AddToPathwayButton from '@/components/AddToPathwayButton';
import FavoriteButton from '@/components/FavoriteButton';
import LearningToolkit from '@/components/LearningToolkit';
import PredictTheOutput from '@/components/PredictTheOutput';
import SectionQuiz from '@/components/SectionQuiz';
import DirGrid from '@/components/DirGrid';
import { getDocQuiz, getSectionQuiz } from '@/lib/quizzes';
import { getPredictBlocks } from '@/lib/predict';
import { Clock, FolderOpen, ChevronRight, Zap } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

function readingTime(markdown: string): string {
  const words = markdown.trim().split(/\s+/).length;
  const mins  = Math.ceil(words / 250);
  return `${mins} min read`;
}

function readingVibe(markdown: string): string {
  const words = markdown.trim().split(/\s+/).length;
  const mins  = Math.ceil(words / 250);
  if (mins <= 6) return 'Quick Win';
  if (mins <= 14) return 'Deep Dive';
  return 'Boss Battle';
}


export async function generateStaticParams() {
  const fileSlugs = getAllDocSlugs();
  const dirSlugs = getAllDirSlugs();
  return [...fileSlugs, ...dirSlugs].map(slug => ({ slug }));
}

const SITE_URL = 'https://atypicalesper.github.io/dev-atlas';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const canonical = `${SITE_URL}/${slug.join('/')}/`;
  const doc = getDocContent(slug);
  if (doc) {
    const description = extractExcerpt(doc.content);
    return {
      title: doc.title,
      description,
      alternates: { canonical },
      openGraph: { title: `${doc.title} — dev atlas`, description, url: canonical },
      twitter:   { title: `${doc.title} — dev atlas`, description },
    };
  }
  const dir = getDirInfo(slug);
  if (dir) {
    const description = `${dir.title} — ${dir.children.length} sections in the dev atlas developer knowledge base.`;
    return {
      title: dir.title,
      description,
      alternates: { canonical },
      openGraph: { title: `${dir.title} — dev atlas`, description, url: canonical },
      twitter:   { title: `${dir.title} — dev atlas`, description },
    };
  }
  return { title: 'Not Found' };
}

/** Breadcrumb strip shared by doc and dir pages */
function Breadcrumb({ slug }: { slug: string[] }) {
  return (
    <nav className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--muted)' }}>
      <Link href="/" className="hover:underline" style={{ color: 'var(--accent)' }}>Home</Link>
      {slug.map((segment, i) => {
        const href  = '/' + slug.slice(0, i + 1).join('/');
        const label = humanize(segment);
        const isLast = i === slug.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            <ChevronRight size={12} />
            {isLast ? (
              <span style={{ color: 'var(--fg)' }}>{label}</span>
            ) : (
              <Link href={href} className="hover:underline">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocContent(slug);

  // ── Directory index page ────────────────────────────────────────────────
  if (!doc) {
    const dir = getDirInfo(slug);
    if (!dir) notFound();
    const sectionQuiz = getSectionQuiz(slug);

    return (
      <div className="page-content max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Breadcrumb slug={slug} />

        <div className="flex items-center gap-3 mt-6 mb-2">
          <FolderOpen size={22} style={{ color: 'var(--accent)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>{dir.title}</h1>
        </div>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          {dir.children.length} {dir.children.length === 1 ? 'section' : 'sections'}
        </p>

        {sectionQuiz && <SectionQuiz quiz={sectionQuiz} />}

        <DirGrid items={dir.children} />
      </div>
    );
  }

  // ── Regular doc page ────────────────────────────────────────────────────

  const { prev, next } = getPrevNext(slug);
  const headings = extractHeadings(doc.content);
  const relatedDocs = getRelatedDocs(slug, 3);
  const practiceDoc = getPracticeDoc(slug);
  const compareDoc = getCompareDoc(slug);
  const docQuiz = getDocQuiz(slug);
  const predictBlocks = getPredictBlocks(slug);
  const prevHref = prev ? '/' + prev.slug.join('/') : undefined;
  const nextHref = next ? '/' + next.slug.join('/') : undefined;

  const pageUrl = `${SITE_URL}/${slug.join('/')}/`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      ...slug.map((segment, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: humanize(segment),
        item: `${SITE_URL}/${slug.slice(0, i + 1).join('/')}/`,
      })),
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: extractExcerpt(doc.content),
    url: pageUrl,
    publisher: {
      '@type': 'Organization',
      name: 'dev atlas',
      url: SITE_URL,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <ReadingProgress slug={slug} />
      <DocPageClient
        slug={slug}
        title={doc.title}
        prevHref={prevHref}
        nextHref={nextHref}
      />

      <div className="page-content flex gap-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex-1 min-w-0">

          {/* Breadcrumb + meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <Breadcrumb slug={slug} />

            <div className="flex flex-wrap items-center gap-2">
              <span className="reading-badge">
                <Clock size={11} />
                {readingTime(doc.content)}
              </span>
              <span className="reading-badge">
                <Zap size={11} />
                {readingVibe(doc.content)}
              </span>
              <FavoriteButton href={`/${slug.join('/')}`} />
              <AddToPathwayButton title={doc.title} href={`/${slug.join('/')}`} />
            </div>
          </div>

          {/* Markdown content */}
          <MarkdownContent markdown={doc.content} />
          <NotebookProseDecor />
          <PredictTheOutput
            blocks={predictBlocks}
            slug={slug}
            docTitle={doc.title}
            section={slug[0] ? humanize(slug[0]) : ''}
          />
          {docQuiz && <SectionQuiz quiz={docQuiz} />}
          <LearningToolkit
            title={doc.title}
            excerpt={extractExcerpt(doc.content, 180)}
            headings={headings.map(heading => heading.text)}
            practiceHref={practiceDoc?.href}
            practiceTitle={practiceDoc?.title}
            compareHref={compareDoc?.href}
            compareTitle={compareDoc?.title}
          />

          {(relatedDocs.length > 0 || practiceDoc || compareDoc) && (
            <div className="mt-10 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
              <div className="mb-3 text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                Keep the streak going
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {relatedDocs[0] && (
                  <RecommendationCard
                    label="Learn next"
                    title={relatedDocs[0].title}
                    excerpt={relatedDocs[0].excerpt}
                    href={`/${relatedDocs[0].slug.join('/')}`}
                  />
                )}
                {practiceDoc && (
                  <RecommendationCard
                    label="Practice this"
                    title={practiceDoc.title}
                    excerpt={practiceDoc.excerpt}
                    href={practiceDoc.href}
                  />
                )}
                {compareDoc && (
                  <RecommendationCard
                    label="Compare with"
                    title={compareDoc.title}
                    excerpt={compareDoc.excerpt}
                    href={compareDoc.href}
                  />
                )}
              </div>
            </div>
          )}

          {/* Prev / Next navigation */}
          <PrevNextNav prev={prev ?? undefined} next={next ?? undefined} prevHref={prevHref} nextHref={nextHref} />
        </div>

        {/* Table of contents — xl screens only */}
        <TableOfContents headings={headings} />
      </div>
    </>
  );
}

function RecommendationCard({
  label,
  title,
  excerpt,
  href,
}: {
  label: string;
  title: string;
  excerpt: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{title}</div>
      <div className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{excerpt}</div>
    </Link>
  );
}
