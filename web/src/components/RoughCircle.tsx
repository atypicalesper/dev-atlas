'use client';

import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { useTheme } from 'next-themes';

interface Props {
  roughness?: number;
  strokeWidth?: number;
}

/** Hand-drawn rough.js ellipse that fills its positioned parent — used to
 *  "circle" a mark for emphasis in notebook mode, mirroring RoughBorder. */
export default function RoughCircle({ roughness = 2, strokeWidth = 1.5 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const draw = () => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const { width: w, height: h } = svg.getBoundingClientRect();
      if (!w || !h) return;

      const stroke = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const rc = rough.svg(svg);
      svg.appendChild(
        rc.ellipse(w / 2, h / 2, w - 3, h - 3, { roughness, strokeWidth, stroke, fill: 'none' }),
      );
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(svg.parentElement ?? svg);
    return () => ro.disconnect();
  }, [resolvedTheme, roughness, strokeWidth]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'visible',
      }}
    />
  );
}
