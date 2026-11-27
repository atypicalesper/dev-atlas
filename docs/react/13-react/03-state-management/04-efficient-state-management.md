# Efficient State Management

Efficient state management means:

- keeping the right state in the right place
- avoiding unnecessary re-renders
- separating server state from client state
- choosing a tool whose complexity matches the app

Many React state problems come from placing state at the wrong scope.

---

## First Question: What Kind of State Is This?

### Local UI state

Examples:

- modal open/close
- input text
- active tab

Use local component state first.

### Shared client state

Examples:

- authenticated user info
- theme
- cart contents
- multi-screen wizard state

This is where Context, Redux, Zustand, or atom-based libraries come in.

### Server state

Examples:

- fetched lists
- profile data
- dashboard metrics

Avoid handling server state with a hand-rolled global store when a server-state tool such as TanStack Query or RTK Query fits the problem. Storing remote cached data in a global UI store without a cache strategy creates stale-data and invalidation problems.

---

## Tool Selection

### Context API

Good for:

- low-frequency shared values
- auth/session context
- theme
- locale

Be careful: a large context that changes often can re-render many consumers.

### Redux Toolkit

Good for:

- large apps
- strict state transitions
- complex async workflows
- teams that want strong conventions

Strengths:

- predictable architecture
- DevTools
- selectors
- normalized updates

### Zustand

Good for:

- lightweight global client state
- minimal boilerplate
- teams that want direct store ergonomics

Strengths:

- tiny API
- selective subscriptions
- easy incremental adoption

### Atom-based state (Recoil-style / Jotai-style)

Good for:

- fine-grained dependency graphs
- many small state units
- derived state chains

Strengths:

- small re-render surface
- flexible composition

Use atom-based state when the application has a real graph of small, derived state units.

---

## Performance Rules

### Keep state close to where it is used

Do not globalize state just because two siblings need it once.

### Split state by update frequency

Fast-changing state and rarely changing state should not always live in one container.

### Use selectors

Subscribe to the smallest slice possible.

Bad:

```tsx
const store = useAppStore();
```

Better:

```tsx
const cartCount = useAppStore((state) => state.cartCount);
```

### Normalize large entity collections

For large stores:

- keep `byId`
- keep `allIds`
- update individual records without replacing huge trees

### Separate server state from UI state

Do not make Redux or Zustand impersonate a full remote cache unless you truly need that.

---

## Context Performance Gotcha

One giant context object is a common beginner trap.

```tsx
<AppContext.Provider value={{ user, theme, sidebarOpen, notifications, draft }}>
```

If any field changes, all consumers may re-render.

Better:

- split contexts by concern
- memoize provider values when appropriate
- use selector-based stores when state changes frequently

---

## Practical Decision Guide

Use:

- `useState` / `useReducer` for local UI state
- Context for low-churn global values
- Zustand for lightweight shared client state
- Redux Toolkit for large structured apps
- server-state tools for fetched data

No single state-management tool fits every type of application state.

---

## Interview Answer

### What does efficient state management mean?

It means placing state at the right scope, minimizing unnecessary re-renders, using selectors or fine-grained subscriptions, and separating server state from client UI state instead of throwing everything into one global store.

### Context vs Redux vs Zustand?

Context is great for low-frequency shared values but can re-render broadly. Redux Toolkit is best for large, structured apps with predictable flows and strong tooling. Zustand is great for lightweight shared client state with minimal boilerplate. The right choice depends on scope, update frequency, and team needs.
