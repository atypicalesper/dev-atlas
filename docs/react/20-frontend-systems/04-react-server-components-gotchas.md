# React Server Components Gotchas

React Server Components (RSC) aren't just "components that run on the server" — they change *where your code executes*, which changes *what assumptions are safe*. Most RSC bugs come from crossing that boundary without realizing you've crossed it. The error messages are often cryptic (`Functions cannot be passed directly to Client Components`), and the mental model takes a while to internalize.

The core truth: **server components render once on the server, send their result as a serialized payload, and never hydrate.** Client components render on the server *and* the browser, and they hydrate. You're maintaining two execution environments in the same component tree.

---

## The Core Mental Model

| | Server Components | Client Components |
|---|---|---|
| Runs on | Server only | Server (initial) + browser |
| Can use hooks | ❌ (no `useState`, `useEffect`, etc.) | ✅ |
| Can access DB / filesystem | ✅ directly | ❌ |
| Can use browser APIs | ❌ | ✅ |
| Can import other server components | ✅ | ❌ (only client) |
| Ships JS to the browser | ❌ | ✅ |

The boundary is declared with `'use client'` at the top of a file. That directive is *contagious down the import graph* — anything imported by a client component is also client.

---

## Gotcha 1: Importing Client-Only Logic into a Server Component

Browser APIs (`window`, `localStorage`), React hooks, or event handlers will break immediately:

```tsx
// app/page.tsx — server component by default
import { useState } from 'react'; //  ERROR at runtime
```

Fix: mark the file `'use client'` *or* extract the stateful piece into a client component and import *that*:

```tsx
// app/page.tsx (server)
import Counter from './Counter'; // Counter has 'use client'

export default async function Page() {
  const initial = await db.counters.get('home');
  return <Counter initial={initial} />;
}
```

---

## Gotcha 2: Passing Functions as Props Across the Boundary

```tsx
// server component
export default function Page() {
  return <ClientButton onClick={() => console.log('hi')} />; // ERROR
}
```

Server → client prop serialization uses a JSON-like format. Functions don't serialize. The one exception: **Server Actions** (functions marked `'use server'`), which serialize as references the client can invoke.

```tsx
// actions.ts
'use server';
export async function increment(id: string) {
  await db.counters.increment(id);
}

// server component
import { increment } from './actions';
import ClientButton from './ClientButton';
export default function Page() {
  return <ClientButton action={increment} />; // works — action is a reference
}
```

---

## Gotcha 3: Oversharing Props

Every prop you pass from server → client gets serialized into the HTML/RSC payload. Sending the entire database row when you only need `{ id, title }` bloats the page weight.

```tsx
// Bad: ships the whole user object, including fields the UI doesn't use
<ProfileCard user={user} />

// Good: ships only what's rendered
<ProfileCard id={user.id} name={user.name} avatar={user.avatarUrl} />
```

On a page with 100 list items, the difference can be hundreds of KB.

---

## Gotcha 4: Confusing Cache Behavior

Next.js App Router has (at least) four caches: fetch cache, route cache, router cache, full-route cache. They are aggressive by default. A developer changes the database, refreshes the page, and sees stale data — the page was fully cached at build time.

Rule of thumb:

- `fetch(url, { cache: 'no-store' })` for user-specific data
- `export const dynamic = 'force-dynamic'` for pages that must render per-request
- `revalidatePath(...)` or `revalidateTag(...)` after mutations
- Don't fight the cache — opt out explicitly for routes that need freshness

---

## Gotcha 5: Server/Client Boundary Churn

Splitting a tree too finely (`<ServerA>` → `<ClientB>` → `<ServerC>` → `<ClientD>`) is legal but confusing and often unnecessary. Prefer a few coarse boundaries:

- A server component tree that handles data fetching and layout
- A small number of client "islands" for interactivity
- Pass server-rendered children *through* client components via the `children` prop (this works — children is rendered on the server first)

```tsx
// ClientShell.tsx
'use client';
export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return open ? <div>{children}</div> : null;
}

// page.tsx (server)
import ClientShell from './ClientShell';
import ServerContent from './ServerContent'; // async, hits DB

export default function Page() {
  return <ClientShell><ServerContent /></ClientShell>; // works
}
```

---

## Gotcha 6: `useEffect` for Data Fetching

RSC removes the need for most client-side fetching. But habits die hard:

```tsx
// 'use client' component — anti-pattern in RSC world
useEffect(() => {
  fetch('/api/user').then(r => r.json()).then(setUser);
}, []);
```

Replace with a server component that fetches directly:

```tsx
// server
export default async function UserHeader() {
  const user = await db.users.current();
  return <header>{user.name}</header>;
}
```

No loading spinner, no waterfall, no useEffect, ~50% less code.

---

## Gotcha 7: Context Doesn't Cross the Boundary

React Context is a *client* feature. A server component can't `useContext(MyContext)`, and a client-component `<Provider>` can't provide context to a server parent. Design around it:

- Put providers high in the client tree, inside a client shell
- Pass server-fetched data as props, not context, when it needs to reach server children

---

## Interview / Trick Questions

### 1. What's actually different about a Server Component?

It runs only on the server, cannot use hooks or browser APIs, can directly await data sources, and ships zero JS to the browser. It renders to a serialized stream that the client reconstructs into DOM — without hydration.

### 2. Trick: can a server component import a client component?

Yes — that's the normal direction. Client → server is what doesn't work. You can't import a `'use server'`-free server component into a client component (but server *actions* are importable from client code).

### 3. Why can't you pass an arbitrary function as a prop from server to client?

Because props between server and client are serialized. Functions aren't serializable. The exception is Server Actions, which serialize as references the runtime can invoke — the client doesn't get the function body, just an identifier.

### 4. Trick: `'use client'` is at the top of `A.tsx`. `A` imports `B` (no directive). Is `B` server or client?

Client. `'use client'` is the *entry point* into the client bundle — anything imported through it becomes part of that bundle. To keep `B` server-only, `A` must not import it directly; instead, `A` should accept it via `children` or props.

### 5. How does passing a server component as `children` of a client component work?

React renders the server subtree on the server first, then passes the rendered result as an opaque `children` prop to the client component. The client component sees a pre-rendered tree it can place but not introspect — which is why it works even though the client can't "run" server code.

### 6. You changed a DB row and refreshed the page. Old data. Why?

Most likely the route was statically rendered and cached. Either opt into dynamic rendering (`export const dynamic = 'force-dynamic'`), use `fetch(..., { cache: 'no-store' })`, or call `revalidatePath` after the mutation. The App Router caches aggressively unless you explicitly say otherwise.

### 7. Trick: is there any JS shipped to the browser for a page made entirely of server components?

Minimal — just the RSC runtime itself. Your components' source code doesn't ship. This is one of the main perf wins, and it disappears the moment you mark a component `'use client'` near the root.

### 8. What are the main RSC pitfalls?

Mixing server and client responsibilities without thinking about serialization, shipping too much data across the boundary, misunderstanding cache behavior, and creating too many fine-grained boundaries that add complexity without benefit. Server components work best when the boundaries are intentional and coarse.
