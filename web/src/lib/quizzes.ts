export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  prompt: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
  sourceHref: string;
  sourceLabel: string;
}

export interface QuizPack {
  section: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

const SECTION_QUIZZES: Record<string, QuizPack> = {
  javascript: {
    section: 'JavaScript',
    title: 'JavaScript Core Check',
    description: 'A quick pass over event loop, `this`, and promise behavior.',
    questions: [
      {
        prompt: 'Which queue runs before the next macrotask after synchronous code finishes?',
        options: [
          { id: 'a', text: 'The microtask queue' },
          { id: 'b', text: 'The macrotask queue' },
          { id: 'c', text: 'Whichever queue was filled first' },
          { id: 'd', text: 'They always alternate one-for-one' },
        ],
        correctId: 'a',
        explanation: 'Promises and `queueMicrotask` drain before the event loop takes the next macrotask like `setTimeout`.',
        sourceHref: '/javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop',
        sourceLabel: 'What Is the Event Loop?',
      },
      {
        prompt: 'What is true about an arrow function and `this`?',
        options: [
          { id: 'a', text: 'Its `this` is set by how the function is called' },
          { id: 'b', text: 'It creates its own `this` like a regular method' },
          { id: 'c', text: 'It captures `this` lexically from the surrounding scope' },
          { id: 'd', text: 'Using `bind` changes its `this` permanently' },
        ],
        correctId: 'c',
        explanation: 'Arrow functions do not have their own dynamic `this`; they inherit it from the surrounding lexical scope.',
        sourceHref: '/javascript/01-javascript-fundamentals/04-this-keyword/03-arrow-functions-and-this',
        sourceLabel: 'Arrow Functions and This',
      },
      {
        prompt: 'Which statement about `Promise.all` is correct?',
        options: [
          { id: 'a', text: 'It waits for every promise and never rejects early' },
          { id: 'b', text: 'It rejects as soon as one input promise rejects' },
          { id: 'c', text: 'It ignores rejected promises and returns the fulfilled ones' },
          { id: 'd', text: 'It behaves the same as `Promise.allSettled` but faster' },
        ],
        correctId: 'b',
        explanation: '`Promise.all` is fail-fast. If you need results from every branch regardless of failure, you want `Promise.allSettled` instead.',
        sourceHref: '/javascript/01-javascript-fundamentals/05-promises-async-await/03-promise-all-race-any-allsettled',
        sourceLabel: 'Promise.all vs race vs any vs allSettled',
      },
    ],
  },
  node: {
    section: 'Node.js',
    title: 'Node Performance Check',
    description: 'A fast self-test on bottlenecks, leak signals, and offloading work.',
    questions: [
      {
        prompt: 'If a Node service is slow because of synchronous CPU work, what is usually the first correct diagnosis?',
        options: [
          { id: 'a', text: 'I/O-bound latency from downstream systems' },
          { id: 'b', text: 'CPU-bound work blocking the event loop' },
          { id: 'c', text: 'A DNS propagation issue' },
          { id: 'd', text: 'The process needs more cluster workers by default' },
        ],
        correctId: 'b',
        explanation: 'Heavy synchronous computation blocks the single JavaScript thread, so all other requests wait behind it.',
        sourceHref: '/node/05-performance/01-profiling/01-performance-fundamentals',
        sourceLabel: 'Node.js Performance Fundamentals',
      },
      {
        prompt: 'Under a steady workload, which memory pattern is the strongest leak signal?',
        options: [
          { id: 'a', text: 'Heap usage rises and falls in a sawtooth pattern' },
          { id: 'b', text: 'RSS is larger than heapTotal' },
          { id: 'c', text: 'heapUsed grows monotonically and does not recover after GC' },
          { id: 'd', text: 'The process restarts after deploys' },
        ],
        correctId: 'c',
        explanation: 'Normal GC causes sawtooth behavior. A genuine leak keeps pushing the floor upward over time.',
        sourceHref: '/node/05-performance/02-memory-leaks/01-memory-leak-debugging',
        sourceLabel: 'Memory Leak Debugging in Node.js',
      },
      {
        prompt: 'Where should expensive CPU-heavy work like bcrypt or large computations usually go?',
        options: [
          { id: 'a', text: 'Directly on the main request handler' },
          { id: 'b', text: 'Inside `setTimeout(..., 0)` on the same thread' },
          { id: 'c', text: 'Worker Threads or a separate worker service' },
          { id: 'd', text: 'The libuv timer queue only' },
        ],
        correctId: 'c',
        explanation: 'Scheduling CPU work later on the same event loop does not remove the bottleneck. It needs to move off the main JS thread.',
        sourceHref: '/node/05-performance/01-profiling/01-performance-fundamentals',
        sourceLabel: 'Node.js Performance Fundamentals',
      },
    ],
  },
  react: {
    section: 'React',
    title: 'React Systems Check',
    description: 'Checks the mental model around Server Components and client boundaries.',
    questions: [
      {
        prompt: 'Which capability belongs to a Server Component?',
        options: [
          { id: 'a', text: 'Using `useEffect` and browser APIs directly' },
          { id: 'b', text: 'Handling click events in the browser' },
          { id: 'c', text: 'Direct access to the database or filesystem' },
          { id: 'd', text: 'Hydrating in the browser with shipped JS' },
        ],
        correctId: 'c',
        explanation: 'Server Components run on the server only. They can await data sources directly, but they cannot use client hooks or browser APIs.',
        sourceHref: '/react/20-frontend-systems/04-react-server-components-gotchas',
        sourceLabel: 'React Server Components Gotchas',
      },
      {
        prompt: 'What does placing `"use client"` at the top of a file do?',
        options: [
          { id: 'a', text: 'It marks only that single component as interactive' },
          { id: 'b', text: 'It turns that file into a client entry point and pulls imports into the client bundle' },
          { id: 'c', text: 'It enables hooks in all server components automatically' },
          { id: 'd', text: 'It disables SSR for the whole route' },
        ],
        correctId: 'b',
        explanation: 'The directive is the boundary into the client bundle. Anything imported through that path becomes client-side too.',
        sourceHref: '/react/20-frontend-systems/04-react-server-components-gotchas',
        sourceLabel: 'React Server Components Gotchas',
      },
      {
        prompt: 'Why can’t you pass an arbitrary function prop from a Server Component to a Client Component?',
        options: [
          { id: 'a', text: 'Because React only allows functions in Context' },
          { id: 'b', text: 'Because client components can only accept strings' },
          { id: 'c', text: 'Because server-to-client props are serialized and regular functions are not serializable' },
          { id: 'd', text: 'Because functions always cause hydration mismatch' },
        ],
        correctId: 'c',
        explanation: 'Server-to-client props cross a serialization boundary. Server Actions are the special case because they serialize as references.',
        sourceHref: '/react/20-frontend-systems/04-react-server-components-gotchas',
        sourceLabel: 'React Server Components Gotchas',
      },
    ],
  },
  engineering: {
    section: 'Engineering',
    title: 'Engineering Judgment Check',
    description: 'Trade-offs around system design, testing, and production habits.',
    questions: [
      {
        prompt: 'When is Event Sourcing and CQRS the clearest fit?',
        options: [
          { id: 'a', text: 'Any simple CRUD app because it is the modern default' },
          { id: 'b', text: 'When audit history and multiple read models are non-negotiable requirements' },
          { id: 'c', text: 'Only when the database does not support transactions' },
          { id: 'd', text: 'Whenever a team wants fewer moving parts' },
        ],
        correctId: 'b',
        explanation: 'These patterns add complexity, so they pay off mainly when history and multiple projections are first-class needs.',
        sourceHref: '/engineering/08-system-design/05-event-sourcing/01-event-sourcing-and-cqrs',
        sourceLabel: 'Event Sourcing and CQRS',
      },
      {
        prompt: 'What is the main value of contract testing between services?',
        options: [
          { id: 'a', text: 'It replaces all unit and end-to-end tests' },
          { id: 'b', text: 'It verifies that provider and consumer still agree on the interface they share' },
          { id: 'c', text: 'It benchmarks production latency under load' },
          { id: 'd', text: 'It catches browser accessibility issues' },
        ],
        correctId: 'b',
        explanation: 'Contract tests are about API compatibility at the boundary, not about replacing every other form of testing.',
        sourceHref: '/engineering/10-testing/05-contract-testing/01-contract-testing',
        sourceLabel: 'Contract Testing',
      },
      {
        prompt: 'What is the healthiest first response to a flaky test?',
        options: [
          { id: 'a', text: 'Increase retries and move on' },
          { id: 'b', text: 'Delete the test because it is annoying' },
          { id: 'c', text: 'Look for timing, shared-state, order, or environment dependency issues' },
          { id: 'd', text: 'Assume CI is wrong and ignore it' },
        ],
        correctId: 'c',
        explanation: 'Flakes usually come from non-determinism: async timing, leaked state, external dependency drift, or hidden ordering assumptions.',
        sourceHref: '/engineering/10-testing/07-test-debugging/01-flaky-test-debugging',
        sourceLabel: 'Flaky Test Debugging',
      },
    ],
  },
  databases: {
    section: 'Databases',
    title: 'Database Concurrency Check',
    description: 'A short quiz on visibility, locking, and query planning.',
    questions: [
      {
        prompt: 'What does MVCC primarily give you?',
        options: [
          { id: 'a', text: 'A replacement for all locking' },
          { id: 'b', text: 'Concurrent reads and writes by exposing the right row version to each transaction' },
          { id: 'c', text: 'Guaranteed serializable transactions for free' },
          { id: 'd', text: 'Sharding across multiple databases' },
        ],
        correctId: 'b',
        explanation: 'MVCC is mainly about visibility and reducing read/write blocking. Locks still exist for coordination.',
        sourceHref: '/databases/01-sql-fundamentals/09-locks-deadlocks-and-mvcc',
        sourceLabel: 'Locks, Deadlocks, and MVCC',
      },
      {
        prompt: 'Why is `FOR UPDATE SKIP LOCKED` a common job-queue pattern in PostgreSQL?',
        options: [
          { id: 'a', text: 'It forces every worker to wait on the same row' },
          { id: 'b', text: 'It lets workers claim pending rows without blocking on already-locked jobs' },
          { id: 'c', text: 'It disables transactions for faster throughput' },
          { id: 'd', text: 'It guarantees jobs are processed alphabetically' },
        ],
        correctId: 'b',
        explanation: 'Workers can skip rows another transaction already claimed, which keeps throughput moving instead of forming a wait line.',
        sourceHref: '/databases/01-sql-fundamentals/09-locks-deadlocks-and-mvcc',
        sourceLabel: 'Locks, Deadlocks, and MVCC',
      },
      {
        prompt: 'What is the practical point of `EXPLAIN ANALYZE` or its equivalent?',
        options: [
          { id: 'a', text: 'It formats SQL nicely for code review' },
          { id: 'b', text: 'It reveals the actual execution plan and where the database spent work' },
          { id: 'c', text: 'It automatically creates missing indexes' },
          { id: 'd', text: 'It turns every query into a prepared statement' },
        ],
        correctId: 'b',
        explanation: 'You use it to see plan shape, row counts, and whether the database scanned, filtered, or joined in the way you expected.',
        sourceHref: '/databases/01-sql-fundamentals/08-explain-and-query-planning',
        sourceLabel: 'EXPLAIN and Query Planning',
      },
    ],
  },
  cloud: {
    section: 'Cloud',
    title: 'Cloud Delivery Check',
    description: 'Messaging models, compute trade-offs, and IaC framing.',
    questions: [
      {
        prompt: 'Which AWS service is the best match for one logical job processed by one worker at a controlled pace?',
        options: [
          { id: 'a', text: 'SNS' },
          { id: 'b', text: 'SQS' },
          { id: 'c', text: 'EventBridge' },
          { id: 'd', text: 'CloudFront' },
        ],
        correctId: 'b',
        explanation: 'SQS is the queue/pull model for background work, retries, and worker-controlled consumption speed.',
        sourceHref: '/cloud/06-sqs-vs-sns-vs-eventbridge',
        sourceLabel: 'SQS vs SNS vs EventBridge',
      },
      {
        prompt: 'When do you usually reach for EventBridge over SNS?',
        options: [
          { id: 'a', text: 'When you want routing rules and filtering across many producers and consumers' },
          { id: 'b', text: 'When you need a FIFO worker queue' },
          { id: 'c', text: 'When you only need to send SMS notifications' },
          { id: 'd', text: 'When you want direct SQL query caching' },
        ],
        correctId: 'a',
        explanation: 'EventBridge shines as an event bus with structured filtering and routing, not as a queue replacement.',
        sourceHref: '/cloud/06-sqs-vs-sns-vs-eventbridge',
        sourceLabel: 'SQS vs SNS vs EventBridge',
      },
      {
        prompt: 'What is one core reason teams pick CDK over raw CloudFormation-style authoring?',
        options: [
          { id: 'a', text: 'It removes AWS from the stack entirely' },
          { id: 'b', text: 'It lets app teams define infrastructure in familiar programming languages' },
          { id: 'c', text: 'It guarantees cheaper infrastructure bills' },
          { id: 'd', text: 'It is the only way to create Lambda functions' },
        ],
        correctId: 'b',
        explanation: 'CDK’s big appeal is expressing infrastructure in TypeScript, Python, and similar languages while synthesizing the underlying templates.',
        sourceHref: '/cloud/08-terraform-vs-cdk',
        sourceLabel: 'Terraform vs CDK',
      },
    ],
  },
  python: {
    section: 'Python',
    title: 'Python for AI Check',
    description: 'A quick check on the GIL, async I/O, and practical Python habits.',
    questions: [
      {
        prompt: 'What is the most accurate summary of the GIL for AI/ML work in Python?',
        options: [
          { id: 'a', text: 'It prevents NumPy and PyTorch from using parallel native work' },
          { id: 'b', text: 'It makes all Python concurrency impossible' },
          { id: 'c', text: 'It limits Python bytecode threads, but native C/CUDA work often releases it' },
          { id: 'd', text: 'It only matters for web servers, never for data pipelines' },
        ],
        correctId: 'c',
        explanation: 'Pure Python CPU loops suffer more from the GIL; many scientific libraries release it while doing work in native code.',
        sourceHref: '/python/08-interview-questions/01-python-ai-interview-qs',
        sourceLabel: 'Python for AI Interview Questions',
      },
      {
        prompt: 'When are `asyncio` and async clients especially useful in Python AI systems?',
        options: [
          { id: 'a', text: 'For CPU-bound tensor math on the main interpreter thread' },
          { id: 'b', text: 'For I/O-bound tasks like LLM API calls and concurrent network waits' },
          { id: 'c', text: 'For replacing all multiprocessing workloads' },
          { id: 'd', text: 'Only when the app avoids databases completely' },
        ],
        correctId: 'b',
        explanation: 'Async Python shines when the bottleneck is waiting on the network, not when the bottleneck is raw CPU computation.',
        sourceHref: '/python/07-async-python/01-asyncio-for-ai',
        sourceLabel: 'Asyncio for AI',
      },
      {
        prompt: 'What is the Pythonic advantage of a list comprehension over a manual loop in many everyday cases?',
        options: [
          { id: 'a', text: 'It always uses less memory than any other approach' },
          { id: 'b', text: 'It is usually clearer and more idiomatic for simple transform/filter operations' },
          { id: 'c', text: 'It bypasses the GIL automatically' },
          { id: 'd', text: 'It compiles to C code at runtime' },
        ],
        correctId: 'b',
        explanation: 'Comprehensions are one of Python’s core expressive tools for concise data shaping, though they are not the answer to every performance problem.',
        sourceHref: '/python/01-python-essentials/01-python-for-js-devs',
        sourceLabel: 'Python Essentials for JavaScript Developers',
      },
    ],
  },
  ai: {
    section: 'AI',
    title: 'AI Systems Check',
    description: 'Security, evaluation, and operating-model instincts for modern LLM systems.',
    questions: [
      {
        prompt: 'What is the strongest single prompt-injection defense according to the docs?',
        options: [
          { id: 'a', text: 'A longer system prompt telling the model to ignore attacks' },
          { id: 'b', text: 'Capability minimization and external validation around tool use' },
          { id: 'c', text: 'Only using HTML sanitization' },
          { id: 'd', text: 'Hiding the model name from users' },
        ],
        correctId: 'b',
        explanation: 'The model should have less power, and dangerous actions should be checked outside the model. That is the real safety boundary.',
        sourceHref: '/ai/12-ai-security/03-prompt-injection-defenses',
        sourceLabel: 'Prompt Injection Defenses',
      },
      {
        prompt: 'What is a healthy framing for LLM evals in production?',
        options: [
          { id: 'a', text: 'A one-time manual spot check before launch is enough' },
          { id: 'b', text: 'Evals should be continuous and tied into CI or release gates' },
          { id: 'c', text: 'Only latency matters once the model works once' },
          { id: 'd', text: 'Eval data should avoid adversarial cases because they are rare' },
        ],
        correctId: 'b',
        explanation: 'The atlas leans toward recurring eval pipelines, regression tracking, and adversarial coverage instead of one-off checks.',
        sourceHref: '/ai/10-ai-evaluation/04-eval-pipelines-in-ci',
        sourceLabel: 'Eval Pipelines in CI',
      },
      {
        prompt: 'What is a major trade-off of local LLM setups compared with cloud APIs?',
        options: [
          { id: 'a', text: 'They remove the need for model selection entirely' },
          { id: 'b', text: 'They usually trade operational simplicity for more privacy/control' },
          { id: 'c', text: 'They guarantee higher quality outputs than hosted frontier models' },
          { id: 'd', text: 'They cannot be used behind an OpenAI-compatible API' },
        ],
        correctId: 'b',
        explanation: 'Running models locally gives control, privacy, and custom deployment options, but it adds hardware and serving complexity.',
        sourceHref: '/ai/14-local-llms/01-ollama-local-inference',
        sourceLabel: 'Ollama Local Inference',
      },
    ],
  },
  networks: {
    section: 'Networks',
    title: 'Network Fundamentals Check',
    description: 'Core checks on DNS lookup flow, DNS records, and realtime transport choice.',
    questions: [
      {
        prompt: 'If the browser and OS cache miss, what does a recursive DNS resolver do next?',
        options: [
          { id: 'a', text: 'It queries the authoritative server directly without any delegation' },
          { id: 'b', text: 'It walks the DNS hierarchy through root, TLD, then authoritative nameservers' },
          { id: 'c', text: 'It asks the browser to retry over UDP and TCP simultaneously' },
          { id: 'd', text: 'It skips DNS and opens a TLS connection to guess the host' },
        ],
        correctId: 'b',
        explanation: 'Recursive resolvers do the tree walk and then cache the answer for the record’s TTL.',
        sourceHref: '/networks/04-dns-and-http',
        sourceLabel: 'DNS and HTTP',
      },
      {
        prompt: 'Which statement about a CNAME is correct?',
        options: [
          { id: 'a', text: 'It points directly to an IP address' },
          { id: 'b', text: 'It can safely coexist with MX records on the same exact host name' },
          { id: 'c', text: 'It aliases one hostname to another hostname' },
          { id: 'd', text: 'It is the recommended record type for apex domains in standard DNS' },
        ],
        correctId: 'c',
        explanation: 'A CNAME is a hostname alias. It has restrictions, including awkwardness at the apex and incompatibility with other records at the same name.',
        sourceHref: '/networks/04-dns-and-http',
        sourceLabel: 'DNS and HTTP',
      },
      {
        prompt: 'When is Server-Sent Events usually the simpler choice over WebSockets?',
        options: [
          { id: 'a', text: 'When only the server needs to push updates to the client' },
          { id: 'b', text: 'When the client needs low-level bidirectional messaging over custom frames' },
          { id: 'c', text: 'When browsers do not support HTTP' },
          { id: 'd', text: 'When you need peer-to-peer media transport' },
        ],
        correctId: 'a',
        explanation: 'SSE is ideal for one-way server-to-client streams like progress updates, live feeds, or token streaming.',
        sourceHref: '/networks/04-dns-and-http',
        sourceLabel: 'DNS and HTTP',
      },
    ],
  },
};

const ARTICLE_QUIZZES: Record<string, QuizPack> = {
  'javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop': {
    section: 'JavaScript',
    title: 'Event Loop Deep Check',
    description: 'A focused check on sync work, microtasks, macrotasks, and blocking behavior.',
    questions: [
      {
        prompt: 'After synchronous code completes, what happens before the next macrotask runs?',
        options: [
          { id: 'a', text: 'Exactly one microtask runs, then one macrotask' },
          { id: 'b', text: 'The engine drains the microtask queue' },
          { id: 'c', text: 'The oldest macrotask always runs first, even if microtasks exist' },
          { id: 'd', text: 'The call stack is cleared and the loop goes idle immediately' },
        ],
        correctId: 'b',
        explanation: 'The event loop drains all queued microtasks before taking the next macrotask like a timer or I/O callback.',
        sourceHref: '/javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop',
        sourceLabel: 'What Is the Event Loop?',
      },
      {
        prompt: 'Why can `setTimeout(fn, 0)` still run after a Promise callback?',
        options: [
          { id: 'a', text: 'Because zero-delay timers are secretly synchronous' },
          { id: 'b', text: 'Because Promise callbacks are microtasks and timers are macrotasks' },
          { id: 'c', text: 'Because Promises bypass the event loop entirely' },
          { id: 'd', text: 'Because browsers reorder callbacks alphabetically' },
        ],
        correctId: 'b',
        explanation: 'Promise handlers enter the microtask queue, which has higher priority than the macrotask queue used by `setTimeout`.',
        sourceHref: '/javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop',
        sourceLabel: 'What Is the Event Loop?',
      },
      {
        prompt: 'What is the real problem with heavy synchronous CPU work on the main thread?',
        options: [
          { id: 'a', text: 'It only slows the current function, not other callbacks' },
          { id: 'b', text: 'It blocks the event loop, so other async work cannot be processed' },
          { id: 'c', text: 'It forces all Promises to reject' },
          { id: 'd', text: 'It makes the heap immutable' },
        ],
        correctId: 'b',
        explanation: 'Single-threaded JS means long sync computation prevents timers, I/O callbacks, and user events from being handled.',
        sourceHref: '/javascript/01-javascript-fundamentals/01-event-loop/01-what-is-event-loop',
        sourceLabel: 'What Is the Event Loop?',
      },
    ],
  },
  'node/05-performance/01-profiling/01-performance-fundamentals': {
    section: 'Node.js',
    title: 'Node Performance Deep Check',
    description: 'A targeted quiz on bottleneck types, profiling, and memory diagnosis.',
    questions: [
      {
        prompt: 'Which category best describes a service slowed by large synchronous JSON parsing and regex backtracking?',
        options: [
          { id: 'a', text: 'I/O-bound' },
          { id: 'b', text: 'CPU-bound' },
          { id: 'c', text: 'Network-layer only' },
          { id: 'd', text: 'Schema-bound' },
        ],
        correctId: 'b',
        explanation: 'Both examples are synchronous compute on the main thread, which makes them CPU-bound event-loop blockers.',
        sourceHref: '/node/05-performance/01-profiling/01-performance-fundamentals',
        sourceLabel: 'Node.js Performance Fundamentals',
      },
      {
        prompt: 'What is the main value of `clinic doctor` in a Node debugging workflow?',
        options: [
          { id: 'a', text: 'It replaces load testing entirely' },
          { id: 'b', text: 'It automatically rewrites slow code' },
          { id: 'c', text: 'It helps identify whether the bottleneck is CPU, I/O, memory, or event-loop blocking' },
          { id: 'd', text: 'It disables GC to expose leaks faster' },
        ],
        correctId: 'c',
        explanation: 'Clinic.js is useful because it narrows the class of problem before you start making random fixes.',
        sourceHref: '/node/05-performance/01-profiling/01-performance-fundamentals',
        sourceLabel: 'Node.js Performance Fundamentals',
      },
      {
        prompt: 'If RSS grows much faster than V8 heap metrics, what suspicion should you raise?',
        options: [
          { id: 'a', text: 'The event loop is idle' },
          { id: 'b', text: 'There may be native/C++ memory outside the JS heap' },
          { id: 'c', text: 'The app is fully stateless' },
          { id: 'd', text: 'The process has perfect cache hit rate' },
        ],
        correctId: 'b',
        explanation: 'RSS includes more than the JS heap, so divergence can suggest native allocations, addon issues, or memory outside V8-managed objects.',
        sourceHref: '/node/05-performance/01-profiling/01-performance-fundamentals',
        sourceLabel: 'Node.js Performance Fundamentals',
      },
    ],
  },
  'react/20-frontend-systems/04-react-server-components-gotchas': {
    section: 'React',
    title: 'RSC Gotchas Check',
    description: 'A sharper self-test on boundaries, serialization, and caching in App Router apps.',
    questions: [
      {
        prompt: 'What is the safest default mental model for a Server Component?',
        options: [
          { id: 'a', text: 'It hydrates in the browser just like any other component' },
          { id: 'b', text: 'It renders once on the server and ships no component JS to the browser' },
          { id: 'c', text: 'It is just a slower client component' },
          { id: 'd', text: 'It can use browser APIs if wrapped in Suspense' },
        ],
        correctId: 'b',
        explanation: 'Server Components render on the server, serialize their output, and do not hydrate like client components do.',
        sourceHref: '/react/20-frontend-systems/04-react-server-components-gotchas',
        sourceLabel: 'React Server Components Gotchas',
      },
      {
        prompt: 'Why is oversharing props from server to client a performance smell?',
        options: [
          { id: 'a', text: 'Because extra props disable tree shaking' },
          { id: 'b', text: 'Because every prop sent across the boundary adds to the serialized payload' },
          { id: 'c', text: 'Because React forbids objects larger than 1 KB' },
          { id: 'd', text: 'Because props are stored in localStorage by default' },
        ],
        correctId: 'b',
        explanation: 'Anything you pass server-to-client must be serialized, so broad objects bloat the page payload quickly.',
        sourceHref: '/react/20-frontend-systems/04-react-server-components-gotchas',
        sourceLabel: 'React Server Components Gotchas',
      },
      {
        prompt: 'What is usually better than fetching user data in `useEffect` for the initial page render in an RSC app?',
        options: [
          { id: 'a', text: 'Polling the same API route twice' },
          { id: 'b', text: 'Fetching directly in a Server Component and rendering the result' },
          { id: 'c', text: 'Moving the fetch into a browser `setTimeout`' },
          { id: 'd', text: 'Serializing the fetch function itself as a prop' },
        ],
        correctId: 'b',
        explanation: 'The App Router model encourages direct server-side data fetching so you avoid client waterfalls and extra loading-state boilerplate.',
        sourceHref: '/react/20-frontend-systems/04-react-server-components-gotchas',
        sourceLabel: 'React Server Components Gotchas',
      },
    ],
  },
  'databases/01-sql-fundamentals/09-locks-deadlocks-and-mvcc': {
    section: 'Databases',
    title: 'MVCC and Locks Check',
    description: 'A focused pass over row visibility, coordination, and deadlock avoidance.',
    questions: [
      {
        prompt: 'What problem does MVCC primarily solve?',
        options: [
          { id: 'a', text: 'It eliminates every need for locks' },
          { id: 'b', text: 'It lets readers and writers coexist by exposing the right row version' },
          { id: 'c', text: 'It makes every query use an index' },
          { id: 'd', text: 'It guarantees zero storage overhead' },
        ],
        correctId: 'b',
        explanation: 'MVCC is mainly a visibility mechanism that reduces reader/writer blocking by keeping multiple row versions available.',
        sourceHref: '/databases/01-sql-fundamentals/09-locks-deadlocks-and-mvcc',
        sourceLabel: 'Locks, Deadlocks, and MVCC',
      },
      {
        prompt: 'What is the highest-signal deadlock prevention habit?',
        options: [
          { id: 'a', text: 'Use larger transactions so locks live longer' },
          { id: 'b', text: 'Acquire shared resources in a consistent order' },
          { id: 'c', text: 'Disable retries entirely' },
          { id: 'd', text: 'Prefer schema changes inside business transactions' },
        ],
        correctId: 'b',
        explanation: 'Consistent ordering breaks the circular-wait pattern that produces classic deadlocks.',
        sourceHref: '/databases/01-sql-fundamentals/09-locks-deadlocks-and-mvcc',
        sourceLabel: 'Locks, Deadlocks, and MVCC',
      },
      {
        prompt: 'Why is `SKIP LOCKED` useful in a queue-processing query?',
        options: [
          { id: 'a', text: 'It makes every worker process the same pending job' },
          { id: 'b', text: 'It allows workers to avoid waiting on rows another worker already locked' },
          { id: 'c', text: 'It removes the need for transactions' },
          { id: 'd', text: 'It turns row locks into table locks' },
        ],
        correctId: 'b',
        explanation: 'Workers can keep claiming available work instead of piling up behind rows another transaction is already processing.',
        sourceHref: '/databases/01-sql-fundamentals/09-locks-deadlocks-and-mvcc',
        sourceLabel: 'Locks, Deadlocks, and MVCC',
      },
    ],
  },
  'ai/12-ai-security/03-prompt-injection-defenses': {
    section: 'AI',
    title: 'Prompt Injection Defenses Check',
    description: 'A deeper self-test on trust boundaries, tool authorization, and defense in depth.',
    questions: [
      {
        prompt: 'Why are prompt-only defenses insufficient against prompt injection?',
        options: [
          { id: 'a', text: 'Because models refuse to read system prompts' },
          { id: 'b', text: 'Because attacker instructions arrive in the same text channel as your rules' },
          { id: 'c', text: 'Because prompts cannot contain XML tags' },
          { id: 'd', text: 'Because only direct injection matters in practice' },
        ],
        correctId: 'b',
        explanation: 'The attack and the defense both live in text, so the real controls need to exist outside the model at the system boundary.',
        sourceHref: '/ai/12-ai-security/03-prompt-injection-defenses',
        sourceLabel: 'Prompt Injection Defenses',
      },
      {
        prompt: 'What is the most authoritative layer for deciding whether a tool call should execute?',
        options: [
          { id: 'a', text: 'The model’s stated intent alone' },
          { id: 'b', text: 'The application’s validation, authz, and policy checks around the tool' },
          { id: 'c', text: 'The retrieved document that suggested the tool' },
          { id: 'd', text: 'The user’s original question without any policy layer' },
        ],
        correctId: 'b',
        explanation: 'The model can propose actions, but the surrounding tool layer must enforce authorization, confirmation, rate limits, and schema validation.',
        sourceHref: '/ai/12-ai-security/03-prompt-injection-defenses',
        sourceLabel: 'Prompt Injection Defenses',
      },
      {
        prompt: 'Why should even your own stored documents be treated as untrusted context?',
        options: [
          { id: 'a', text: 'Because storage location does not guarantee trustworthy provenance' },
          { id: 'b', text: 'Because the model can only read public web pages safely' },
          { id: 'c', text: 'Because local files cannot be sanitized' },
          { id: 'd', text: 'Because prompt injection only works on PDFs' },
        ],
        correctId: 'a',
        explanation: 'Trust follows provenance and capability boundaries, not whether bytes happen to live in your S3 bucket or database.',
        sourceHref: '/ai/12-ai-security/03-prompt-injection-defenses',
        sourceLabel: 'Prompt Injection Defenses',
      },
    ],
  },
  'networks/04-dns-and-http': {
    section: 'Networks',
    title: 'DNS and HTTP Check',
    description: 'A deeper check on DNS resolution, record types, and transport choices.',
    questions: [
      {
        prompt: 'What is the main job of the recursive resolver during a DNS lookup miss?',
        options: [
          { id: 'a', text: 'To become authoritative for the domain permanently' },
          { id: 'b', text: 'To walk the hierarchy and cache the answer for future queries' },
          { id: 'c', text: 'To skip TLD servers and guess the IP' },
          { id: 'd', text: 'To replace the browser cache with a local file' },
        ],
        correctId: 'b',
        explanation: 'The recursive resolver performs the delegation walk through root, TLD, and authoritative servers, then caches the answer by TTL.',
        sourceHref: '/networks/04-dns-and-http',
        sourceLabel: 'DNS and HTTP',
      },
      {
        prompt: 'Which record type should point to another hostname rather than directly to an IP address?',
        options: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'AAAA' },
          { id: 'c', text: 'CNAME' },
          { id: 'd', text: 'PTR' },
        ],
        correctId: 'c',
        explanation: 'CNAME creates a hostname alias and the resolver follows that alias until it reaches an A or AAAA record.',
        sourceHref: '/networks/04-dns-and-http',
        sourceLabel: 'DNS and HTTP',
      },
      {
        prompt: 'Why is SSE often simpler than WebSockets for token streaming or live progress updates?',
        options: [
          { id: 'a', text: 'Because SSE is peer-to-peer and bypasses HTTP entirely' },
          { id: 'b', text: 'Because SSE is just a long-lived HTTP response for server-to-client push' },
          { id: 'c', text: 'Because SSE supports arbitrary client-to-server binary frames better' },
          { id: 'd', text: 'Because browsers only reconnect WebSockets manually' },
        ],
        correctId: 'b',
        explanation: 'SSE fits one-way server push neatly without the protocol upgrade and operational baggage of full-duplex sockets.',
        sourceHref: '/networks/04-dns-and-http',
        sourceLabel: 'DNS and HTTP',
      },
    ],
  },
  'ai/10-ai-evaluation/04-eval-pipelines-in-ci': {
    section: 'AI',
    title: 'Eval Pipelines Check',
    description: 'A more focused quiz on CI eval design, thresholds, and release gating.',
    questions: [
      {
        prompt: 'Why do LLM evals belong in CI instead of only in notebooks?',
        options: [
          { id: 'a', text: 'Because prompts never change after the first launch' },
          { id: 'b', text: 'Because LLM regressions can be valid-looking outputs that silently get worse' },
          { id: 'c', text: 'Because CI is cheaper than local experimentation' },
          { id: 'd', text: 'Because unit tests stop working when LLMs are added' },
        ],
        correctId: 'b',
        explanation: 'The whole point is catching quality regressions that do not throw errors or break schemas but still degrade user outcomes.',
        sourceHref: '/ai/10-ai-evaluation/04-eval-pipelines-in-ci',
        sourceLabel: 'Eval Pipelines in CI',
      },
      {
        prompt: 'What is the healthiest shape for a PR-time eval suite?',
        options: [
          { id: 'a', text: 'A tiny high-signal smoke suite that finishes quickly, with broader suites run later' },
          { id: 'b', text: 'A one-hour 5000-case suite on every commit' },
          { id: 'c', text: 'No evals in CI, only manual spot checks' },
          { id: 'd', text: 'Only style scoring by an LLM judge' },
        ],
        correctId: 'a',
        explanation: 'PR gating needs speed and signal. A smaller smoke suite keeps feedback fast, while bigger long-tail runs happen nightly or on merge.',
        sourceHref: '/ai/10-ai-evaluation/04-eval-pipelines-in-ci',
        sourceLabel: 'Eval Pipelines in CI',
      },
      {
        prompt: 'Which metric regression is the clearest candidate to hard-fail CI rather than just warn?',
        options: [
          { id: 'a', text: 'Minor stylistic drift in answer tone' },
          { id: 'b', text: 'A small judge-preference shift with no safety impact' },
          { id: 'c', text: 'Task success or safety performance dropping past a defined threshold' },
          { id: 'd', text: 'A developer disliking the wording of one answer' },
        ],
        correctId: 'c',
        explanation: 'The doc’s guidance is to hard-fail on correctness, safety, and budget regressions that materially change behavior.',
        sourceHref: '/ai/10-ai-evaluation/04-eval-pipelines-in-ci',
        sourceLabel: 'Eval Pipelines in CI',
      },
    ],
  },
};

export function getSectionQuiz(slug: string[]): QuizPack | null {
  if (slug.length !== 1) return null;
  return SECTION_QUIZZES[slug[0]] ?? null;
}

export function getDocQuiz(slug: string[]): QuizPack | null {
  return ARTICLE_QUIZZES[slug.join('/')] ?? null;
}
