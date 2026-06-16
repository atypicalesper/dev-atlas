import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="nf-page">
      <div className="nf-scanline" aria-hidden />

      <div className="nf-digits">
        <span className="nf-digit">4</span>
        <span className="nf-digit nf-digit--accent">0</span>
        <span className="nf-digit">4</span>
      </div>

      <div className="nf-pulse" aria-hidden />

      <h1 className="nf-tagline">Off the atlas</h1>

      <p className="nf-sub">
        This page isn&apos;t on the map. It may have been moved, renamed, or
        you wandered past the edge of the known world.
      </p>

      <div className="nf-actions">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
        <Link
          href="/engineering/12-interview-practice/00-cheat-sheet/01-last-day-reference"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 border inline-flex items-center gap-2"
          style={{ color: 'var(--fg)', borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
        >
          <ClipboardList size={14} />
          Cheat Sheet
        </Link>
      </div>
    </div>
  );
}
