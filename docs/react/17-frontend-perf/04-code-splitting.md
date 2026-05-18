# Code Splitting

Code splitting breaks one large JavaScript bundle into smaller chunks that can load on demand.

This matters because performance is not just download size. It is also:

- parse time
- compile time
- execution time
- cache invalidation scope

A smaller initial bundle usually means faster startup and less main-thread pressure.

---

## Why Code Splitting Helps

Without code splitting:

- users download code for screens they never visit
- one small change can invalidate a huge bundle
- heavy libraries sit on the critical path

With code splitting:

- each route can carry its own bundle
- rare features stay off the first load path
- cache reuse improves

---

## Common Split Points

### Route-based splitting

Usually the best first move.

Each page or route becomes its own chunk.

### Component-based splitting

Useful for heavy optional components:

- chart libraries
- editors
- PDF viewers
- maps

### Vendor splitting

Sometimes you isolate large shared dependencies so they cache better across routes.

Do this carefully. Bad vendor splitting can create more requests without real benefit.

---

## Dynamic Import

The primitive behind most manual split points is `import()`.

```ts
async function openAnalytics() {
  const { renderAnalytics } = await import('./analytics');
  renderAnalytics();
}
```

Bundlers treat this as a signal to create a separate chunk.

---

## React Example

```tsx
import { lazy, Suspense } from 'react';

const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'));

export function Dashboard({ showAnalytics }: { showAnalytics: boolean }) {
  return showAnalytics ? (
    <Suspense fallback={<div>Loading analytics...</div>}>
      <AnalyticsPanel />
    </Suspense>
  ) : null;
}
```

This keeps analytics code out of the initial bundle until the user needs it.

---

## Prefetch vs Preload

### Prefetch

Fetch something likely needed soon, but not required for the current render.

Good for:

- likely next route
- hover-based anticipation

### Preload

Fetch something needed for the current path as early as possible.

Good for:

- critical chunks
- current-navigation dependencies

Use both carefully. Overusing them defeats the point of splitting.

---

## Common Pitfalls

### Too many tiny chunks

Splitting has overhead. Ten tiny requests can be worse than one reasonable chunk.

### Waterfalls

If one lazily loaded chunk immediately loads three more chunks and then triggers data fetches, interaction still feels slow.

### Duplicate dependencies

Poor chunk boundaries can cause shared libraries to appear in multiple chunks.

### SSR / client boundary confusion

In modern React and Next.js apps, code splitting interacts with server/client boundaries. Some code should not be sent to the browser at all. That is even better than splitting it.

---

## Measure, Do Not Guess

Use:

- bundle analyzer
- network waterfall
- Core Web Vitals
- route-level JS size tracking

If code splitting does not improve startup or interaction metrics, the split points may be wrong.

---

## Interview Answer

### What is code splitting?

It is the practice of breaking JavaScript into smaller chunks that load only when needed, reducing the initial bundle's download, parse, and execution cost.

### What is the most common mistake with code splitting?

Over-splitting into many tiny chunks or lazy loading code that is actually critical for the first interaction. Good splitting reduces startup cost without creating obvious interaction delays later.
