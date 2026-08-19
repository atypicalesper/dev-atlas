'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { getBookmarks, toggleBookmark } from '@/lib/progress';

interface Props {
  href: string;
}

export default function FavoriteButton({ href }: Props) {
  const slug = href.replace(/^\/+/, '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getBookmarks().includes(slug));
  }, [slug]);

  function handleToggle() {
    setSaved(toggleBookmark(slug));
  }

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: saved ? 'var(--sidebar-active)' : 'var(--card-bg)',
        color: saved ? 'var(--sidebar-active-text)' : 'var(--fg)',
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Bookmarked' : 'Bookmark'}
      title={saved ? 'Remove bookmark' : 'Save to bookmarks'}
    >
      <Heart size={13} fill={saved ? 'currentColor' : 'none'} />
      <span className="hidden sm:inline">{saved ? 'Bookmarked' : 'Bookmark'}</span>
    </button>
  );
}
