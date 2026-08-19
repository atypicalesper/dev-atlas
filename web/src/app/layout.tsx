import type { Metadata } from 'next';
import { Fraunces, Work_Sans, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { buildNavTree } from '@/lib/docs';
import Shell from '@/components/Shell';
import { NotebookProvider } from '@/lib/notebook';
import './globals.css';

// Self-hosted at build time — avoids the stylesheet -> Google CSS -> font binary
// request chain that CSS @import forces onto the critical path.
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-fraunces',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-work-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// The CSP meta, JSON-LD and Clarity tag are injected into the exported HTML by
// scripts/postbuild-html.mjs. React 19 hoists <script> and <meta> out of wherever
// they are authored, which reordered the document on hydration and remounted
// every page (React error #418).

const SITE_URL = 'https://atypicalesper.github.io/dev-atlas';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'dev atlas',
    template: '%s — dev atlas',
  },
  description: 'The complete developer knowledge base. JavaScript, TypeScript, React, Node.js, Python, AI/ML, system design, DSA, databases, cloud, and more.',
  keywords: ['developer knowledge base', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'system design', 'DSA', 'interview prep', 'AI', 'cloud', 'AWS'],
  authors: [{ name: 'Tarun Singh', url: 'https://atypicalesper.github.io' }],
  referrer: 'strict-origin-when-cross-origin',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'dev atlas',
    title: 'dev atlas — developer knowledge base',
    description: 'The complete developer knowledge base. JavaScript, TypeScript, React, Node.js, Python, AI/ML, system design, DSA, databases, cloud, and more.',
    locale: 'en_US',
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: 'dev atlas — the complete developer knowledge base' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'dev atlas — developer knowledge base',
    description: 'The complete developer knowledge base. JavaScript, TypeScript, React, Node.js, Python, AI/ML, system design, DSA, databases, cloud, and more.',
    images: [`${SITE_URL}/og.png`],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: `${basePath}/logo.svg`, type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nav = buildNavTree();

  return (
    <html
      lang="en"
      translate="no"
      className={`${fraunces.variable} ${workSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} themes={['light', 'paper', 'dark', 'midnight', 'ocean', 'forest', 'dawn', 'slate']}>
          <NotebookProvider>
            <Shell nav={nav}>
              {children}
            </Shell>
          </NotebookProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
