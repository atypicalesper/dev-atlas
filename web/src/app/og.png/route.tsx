import { ImageResponse } from 'next/og';

// Served as a real .png path so GitHub Pages sends image/png — social crawlers
// reject the extensionless file Next's opengraph-image convention emits.
export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0b0d14',
          backgroundImage: 'radial-gradient(circle at 20% 15%, #2a2f52 0%, transparent 55%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 104, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.03em' }}>
          dev&nbsp;<span style={{ color: '#818cf8' }}>atlas</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 38, color: '#94a3b8', lineHeight: 1.35, maxWidth: 900 }}>
          The complete developer knowledge base
        </div>
        <div style={{ marginTop: 48, display: 'flex', gap: 18, fontSize: 26, color: '#cbd5e1' }}>
          <span>JavaScript</span><span style={{ color: '#475569' }}>·</span>
          <span>Node</span><span style={{ color: '#475569' }}>·</span>
          <span>React</span><span style={{ color: '#475569' }}>·</span>
          <span>System Design</span><span style={{ color: '#475569' }}>·</span>
          <span>DSA</span><span style={{ color: '#475569' }}>·</span>
          <span>AI</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
