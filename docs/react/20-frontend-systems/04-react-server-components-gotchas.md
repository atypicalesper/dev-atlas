# React Server Components Gotchas

React Server Components change where code runs, which changes what assumptions are safe.

---

## Core Mental Model

- server components run on the server
- client components run in the browser
- server components can fetch data directly
- client components handle interactivity

The main mistakes come from crossing that boundary incorrectly.

---

## Common Gotchas

### Importing client-only logic into server components

Browser APIs, hooks, or event handlers force client behavior.

### Oversharing props

Sending large data blobs from server to client components increases payload size quickly.

### Confusing cache behavior

Data fetching, revalidation, and navigation behavior can feel surprising until caching rules are understood clearly.

### Server/client boundary churn

Too many small boundaries create complexity instead of clarity.

---

## Good Practice

- keep server components data-heavy and presentation-focused
- push interactivity to small client islands
- pass only the data the client truly needs

---

## Interview Answer

### What are the main RSC gotchas?

The big pitfalls are mixing server and client responsibilities, accidentally shipping too much data over the boundary, and misunderstanding caching and revalidation behavior. Server Components work best when the boundary is intentional and coarse enough to stay understandable.
