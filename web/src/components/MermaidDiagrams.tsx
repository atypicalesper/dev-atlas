'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

const LIGHT_THEMES = new Set(['light', 'paper', 'dawn']);

/**
 * Renders ```mermaid blocks. The library is imported dynamically so the ~1MB
 * bundle only loads on pages that actually contain a diagram.
 */
export default function MermaidDiagrams({ contentKey }: { contentKey: string }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('.mermaid-diagram[data-mermaid]'),
    );
    if (nodes.length === 0) return;

    let cancelled = false;

    (async () => {
      const { default: mermaid } = await import('mermaid');
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        theme: LIGHT_THEMES.has(resolvedTheme ?? '') ? 'default' : 'dark',
        securityLevel: 'strict',
        fontFamily: 'inherit',
      });

      for (const [i, node] of nodes.entries()) {
        const source = node.dataset.mermaid;
        if (!source) continue;
        try {
          const { svg } = await mermaid.render(`mermaid-${i}-${Date.now()}`, source);
          if (cancelled) return;
          node.innerHTML = svg;
        } catch {
          node.innerHTML = `<pre><code>${source.replace(/</g, '&lt;')}</code></pre>`;
        }
      }
    })();

    return () => { cancelled = true; };
  }, [contentKey, resolvedTheme]);

  return null;
}
