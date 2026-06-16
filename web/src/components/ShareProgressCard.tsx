'use client';

import { useCallback, useState } from 'react';
import { Share2 } from 'lucide-react';

interface Props {
  streak: number;
  pagesRead: number;
  bookmarks: number;
  topSkill?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function ShareProgressCard({ streak, pagesRead, bookmarks, topSkill }: Props) {
  const [busy, setBusy] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    try {
      const styles = getComputedStyle(document.documentElement);
      const v = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
      const bg = v('--bg', '#0b0d14');
      const fg = v('--fg', '#e2e8f0');
      const accent = v('--accent', '#818cf8');
      const muted = v('--muted', '#94a3b8');
      const border = v('--border', '#222a3a');

      const W = 1200, H = 630, scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(scale, scale);

      try {
        await Promise.all([
          document.fonts.load('600 40px Fraunces'),
          document.fonts.load('600 150px Fraunces'),
          document.fonts.load('400 22px Inter'),
        ]);
      } catch {
        /* fonts may already be loaded or unavailable; canvas falls back to serif/sans */
      }

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(W - 200, 140, 0, W - 200, 140, 460);
      glow.addColorStop(0, hexToRgba(accent, 0.24));
      glow.addColorStop(1, hexToRgba(accent, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      roundRect(ctx, 40, 40, W - 80, H - 80, 28);
      ctx.stroke();

      // Wordmark
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.font = '600 44px Fraunces, Georgia, serif';
      ctx.fillStyle = fg;
      ctx.fillText('dev ', 84, 138);
      const devWidth = ctx.measureText('dev ').width;
      ctx.fillStyle = accent;
      ctx.fillText('atlas', 84 + devWidth, 138);
      ctx.font = '400 22px Inter, sans-serif';
      ctx.fillStyle = muted;
      ctx.fillText('my developer knowledge-base progress', 86, 172);

      // Hero streak
      ctx.font = '600 156px Fraunces, Georgia, serif';
      ctx.fillStyle = accent;
      ctx.fillText(String(streak), 80, 400);
      ctx.font = '400 32px Inter, sans-serif';
      ctx.fillStyle = fg;
      ctx.fillText(streak === 1 ? 'day streak' : 'day streak', 88, 448);

      // Right-aligned stat stack
      const stats: Array<[string, string]> = [
        ['pages read', String(pagesRead)],
        ['bookmarks', String(bookmarks)],
      ];
      if (topSkill) stats.push(['top skill', topSkill]);
      ctx.textAlign = 'right';
      let y = 300;
      for (const [label, value] of stats) {
        ctx.font = '600 60px Fraunces, Georgia, serif';
        ctx.fillStyle = fg;
        ctx.fillText(value, W - 84, y);
        ctx.font = '400 22px Inter, sans-serif';
        ctx.fillStyle = muted;
        ctx.fillText(label, W - 84, y + 32);
        y += 108;
      }

      ctx.textAlign = 'left';
      ctx.font = '400 20px Inter, sans-serif';
      ctx.fillStyle = muted;
      ctx.fillText('atypicalesper.github.io/dev-atlas', 84, H - 72);

      await new Promise<void>(resolve => {
        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dev-atlas-progress.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }
          resolve();
        }, 'image/png');
      });
    } finally {
      setBusy(false);
    }
  }, [streak, pagesRead, bookmarks, topSkill]);

  return (
    <button
      onClick={generate}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-[var(--sidebar-hover)] disabled:opacity-50"
      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      title="Download a shareable progress card"
    >
      <Share2 size={11} />
      {busy ? 'Rendering…' : 'Share'}
    </button>
  );
}
