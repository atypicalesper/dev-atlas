'use client';

import { useEffect } from 'react';

/** Attaches copy buttons to code blocks rendered as static HTML on the server. */
export default function CodeCopyButtons({ contentKey }: { contentKey: string }) {
  useEffect(() => {
    const container = document.querySelector('.prose');
    if (!container) return;

    container.querySelectorAll<HTMLElement>('pre').forEach(pre => {
      if (pre.querySelector('.copy-btn')) return;

      pre.style.position = 'relative';

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.onclick = async () => {
        const code = pre.querySelector('code')?.textContent ?? '';
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        } catch {
          // clipboard not available (e.g. non-HTTPS)
        }
      };
      pre.appendChild(btn);
    });
  }, [contentKey]);

  return null;
}
