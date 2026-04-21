const KEY = 'devAtlasPathways';

export interface PathwayItem {
  id: string;
  text: string;
  done: boolean;
  href?: string;
}

export interface Pathway {
  id: string;
  name: string;
  items: PathwayItem[];
  createdAt: number;
}

export function loadPathways(): Pathway[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Pathway[];
  } catch {
    return [];
  }
}

export function savePathways(pathways: Pathway[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(pathways));
}

export function mkPathway(name: string): Pathway {
  return { id: crypto.randomUUID(), name: name.trim(), items: [], createdAt: Date.now() };
}

export function mkItem(text: string, href?: string): PathwayItem {
  return { id: crypto.randomUUID(), text: text.trim(), done: false, href };
}

export interface PathwayTemplate {
  id: string;
  name: string;
  description: string;
  items: Array<{ text: string; href?: string }>;
}

export const PATHWAY_TEMPLATES: PathwayTemplate[] = [
  {
    id: 'frontend-interview',
    name: 'Frontend Interview Sprint',
    description: 'Core frontend fundamentals, React, performance, and practical interview prep.',
    items: [
      { text: 'HTML Semantics & Accessibility', href: 'react/00-frontend-fundamentals/01-html-semantics-accessibility' },
      { text: 'CSS Fundamentals', href: 'react/00-frontend-fundamentals/02-css-fundamentals' },
      { text: 'DOM & Events', href: 'react/00-frontend-fundamentals/03-dom-and-events' },
      { text: 'Virtual DOM & Reconciliation', href: 'react/13-react/01-core-concepts/01-virtual-dom-and-reconciliation' },
      { text: 'Concurrent React & Suspense', href: 'react/13-react/02-advanced-patterns/03-concurrent-and-suspense' },
      { text: 'Core Web Vitals', href: 'react/17-frontend-perf/01-core-web-vitals' },
      { text: 'Render Optimization', href: 'react/13-react/02-advanced-patterns/01-render-optimization' },
      { text: 'React Rapid Fire', href: 'engineering/12-interview-practice/01-rapid-fire-qa/04-react-rapid-fire' },
    ],
  },
  {
    id: 'senior-node',
    name: 'Senior Node.js',
    description: 'Node internals, API design, performance, and production engineering patterns.',
    items: [
      { text: 'Node.js Internals Overview', href: 'node/02-nodejs-core/01-architecture/01-nodejs-internals-overview' },
      { text: 'Event Loop Phases', href: 'node/02-nodejs-core/02-event-loop-nodejs/01-phases-overview' },
      { text: 'Streams & Backpressure', href: 'node/02-nodejs-core/03-streams/06-backpressure' },
      { text: 'HTTP Agent & Connections', href: 'node/02-nodejs-core/12-http-internals/01-http-agent-and-connections' },
      { text: 'Worker Threads', href: 'node/02-nodejs-core/07-worker-threads/01-worker-threads' },
      { text: 'OpenTelemetry', href: 'node/05-performance/05-observability/01-opentelemetry' },
      { text: 'Retries, Idempotency & Deduplication', href: 'node/07-api-design/14-reliability/01-retries-idempotency-and-deduplication' },
      { text: 'Outbox Pattern', href: 'node/07-api-design/14-reliability/02-outbox-pattern' },
    ],
  },
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    description: 'Production LLM systems, structured outputs, security, and evaluation.',
    items: [
      { text: 'AI Developer Roadmap', href: 'ai/00-roadmap/01-ai-developer-roadmap' },
      { text: 'Prompt Engineering Overview', href: 'ai/02-prompt-engineering/01-overview' },
      { text: 'Advanced RAG Patterns', href: 'ai/03-rag-and-vector-databases/04-advanced-rag-patterns' },
      { text: 'MCP Overview', href: 'ai/07-mcp/01-overview' },
      { text: 'Structured Outputs & Tool Calling', href: 'ai/08-ai-in-production/05-structured-outputs-and-tool-calling' },
      { text: 'LLM Observability', href: 'ai/08-ai-in-production/03-llm-observability' },
      { text: 'Prompt Injection Defenses', href: 'ai/12-ai-security/03-prompt-injection-defenses' },
      { text: 'Eval Pipelines in CI', href: 'ai/10-ai-evaluation/04-eval-pipelines-in-ci' },
    ],
  },
  {
    id: 'system-design',
    name: 'System Design Core',
    description: 'A focused path through HLD, distributed systems, reliability, and data design.',
    items: [
      { text: 'HLD Fundamentals', href: 'engineering/08-system-design/01-hld/01-fundamentals' },
      { text: 'Distributed Systems', href: 'engineering/08-system-design/06-distributed-systems' },
      { text: 'Microservices Networking', href: 'engineering/08-system-design/04-microservices/01-microservices-networking' },
      { text: 'Production Engineering', href: 'engineering/08-system-design/03-sde3-senior-topics/02-production-engineering' },
      { text: 'Database Design', href: 'databases/08-database-design' },
      { text: 'Sharding & Scaling', href: 'databases/06-sharding-and-scaling' },
      { text: 'SQS vs SNS vs EventBridge', href: 'cloud/04-event-driven-aws/01-sqs-vs-sns-vs-eventbridge' },
      { text: 'Design Questions', href: 'engineering/12-interview-practice/04-system-design-practice/01-design-questions' },
    ],
  },
];

export function mkTemplatePathway(template: PathwayTemplate): Pathway {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    items: template.items.map(item => mkItem(item.text, item.href)),
    createdAt: Date.now(),
  };
}
