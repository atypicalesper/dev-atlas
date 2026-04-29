export type Difficulty = 'Foundations' | 'Production' | 'Interview' | 'Boss Battle';

const SKILL_RULES: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: 'async', patterns: [/event-loop/i, /promise/i, /async/i, /await/i, /concurrency/i] },
  { tag: 'auth', patterns: [/auth/i, /oauth/i, /jwt/i, /webauthn/i, /passkey/i] },
  { tag: 'sql', patterns: [/sql/i, /postgres/i, /query/i, /index/i, /mvcc/i, /transaction/i] },
  { tag: 'caching', patterns: [/cache/i, /redis/i, /cdn/i] },
  { tag: 'debugging', patterns: [/debug/i, /profil/i, /observability/i, /troubleshoot/i, /memory-leak/i] },
  { tag: 'rag', patterns: [/rag/i, /retriev/i, /vector/i, /embedding/i] },
  { tag: 'llm-security', patterns: [/prompt-injection/i, /ai-security/i, /safety/i] },
  { tag: 'system-design', patterns: [/system-design/i, /distributed/i, /microservice/i, /cqrs/i, /event-sourcing/i] },
  { tag: 'frontend', patterns: [/react/i, /next/i, /render/i, /browser/i, /css/i, /a11y/i] },
  { tag: 'cloud', patterns: [/aws/i, /lambda/i, /eventbridge/i, /terraform/i, /cdk/i, /dynamodb/i] },
  { tag: 'testing', patterns: [/test/i, /playwright/i, /vitest/i, /contract/i, /mock/i] },
  { tag: 'python', patterns: [/python/i, /pandas/i, /numpy/i, /pytorch/i, /fastapi/i] },
  { tag: 'networking', patterns: [/dns/i, /http/i, /tls/i, /tcp/i, /udp/i, /websocket/i, /sse/i] },
];

function contentSignals(slug: string[], title: string): string {
  return [...slug, title].join(' ').toLowerCase();
}

export function inferDocSkills(slug: string[], title: string): string[] {
  const haystack = contentSignals(slug, title);
  const skills = SKILL_RULES
    .filter(rule => rule.patterns.some(pattern => pattern.test(haystack)))
    .map(rule => rule.tag);

  if (skills.length === 0 && slug[0]) {
    skills.push(slug[0]);
  }

  return skills.slice(0, 4);
}

export function inferDifficulty(slug: string[], wordCount: number): Difficulty {
  const path = slug.join('/').toLowerCase();
  if (path.includes('tricky') || path.includes('advanced') || wordCount > 2600) return 'Boss Battle';
  if (path.includes('interview') || path.includes('rapid-fire') || path.includes('cheat')) return 'Interview';
  if (wordCount > 1200 || path.includes('deep-dive') || path.includes('production')) return 'Production';
  return 'Foundations';
}
