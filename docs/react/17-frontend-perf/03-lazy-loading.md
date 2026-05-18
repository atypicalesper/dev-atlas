# Lazy Loading

Lazy loading means delaying work until it is actually needed.

On the frontend, that usually means delaying:

- JavaScript for non-critical routes or components
- images below the fold
- heavy widgets like editors, maps, or charts
- data for UI that the user may never open

The goal is simple: do less work during initial page load.

---

## What Should Be Lazy Loaded

Good candidates:

- settings pages
- admin routes
- modal-only libraries
- charting tools
- code editors
- images below the fold

Bad candidates:

- above-the-fold hero image
- the primary interaction path of the first screen
- tiny components whose split cost is bigger than the saved bytes

Lazy loading is a performance tool, not a reflex.

---

## Route Lazy Loading

Routes are the highest-leverage split point because users do not need every page on first load.

```tsx
import { lazy, Suspense } from 'react';

const ReportsPage = lazy(() => import('./ReportsPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportsPage />
    </Suspense>
  );
}
```

Next.js already does route-level splitting for pages. In other React setups, you wire it up yourself.

---

## Component Lazy Loading

This is useful when a heavy component appears only after a user action.

```tsx
import { lazy, Suspense, useState } from 'react';

const RichTextEditor = lazy(() => import('./RichTextEditor'));

export function PostComposer() {
  const [editing, setEditing] = useState(false);

  return editing ? (
    <Suspense fallback={<div>Loading editor...</div>}>
      <RichTextEditor />
    </Suspense>
  ) : (
    <button onClick={() => setEditing(true)}>Start writing</button>
  );
}
```

This keeps the heavy editor bundle off the initial path for users who never open it.

---

## Image Lazy Loading

For non-critical images, native lazy loading should usually be the default:

```html
<img src="/gallery/photo-1.webp" loading="lazy" alt="Gallery image">
```

Do not lazy load the main LCP image above the fold. That delays the exact thing you want rendered first.

---

## Data Lazy Loading

Not all data should be fetched on first render.

Examples:

- comments panel opens later
- audit logs tab may never be visited
- advanced analytics panel is behind a click

In those cases, defer the request until the UI path is actually entered.

---

## UX Rules

Lazy loading changes user experience, so the fallback matters.

Good fallbacks:

- skeleton close to final layout
- reserved space for images
- small progress indicator for secondary panels

Bad fallbacks:

- layout jumps
- full-screen spinner for tiny chunks
- blank areas with no explanation

---

## Common Pitfalls

- lazy loading everything and creating request waterfalls
- splitting tiny modules into too many network requests
- lazy loading critical UI
- forgetting that data and code can each cause waiting

The best lazy loading strategy shortens startup without making interactions feel delayed later.

---

## Interview Answer

### What is lazy loading?

It is the practice of deferring non-critical code, media, or data until it is actually needed, so initial page load does less work and becomes faster.

### What should you avoid lazy loading?

Do not lazy load above-the-fold critical assets, especially the main hero image or the code required for the first meaningful interaction. Lazy loading should remove waste, not delay the primary user journey.
