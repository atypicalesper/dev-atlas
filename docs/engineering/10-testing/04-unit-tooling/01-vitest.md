# Vitest

Vitest is a fast test runner built around the Vite ecosystem, but it is useful well beyond Vite apps.

---

## Why Teams Pick Vitest

- fast startup
- native-feeling ESM support
- strong TypeScript ergonomics
- Jest-like API with less friction in modern frontend stacks

If your app already uses Vite, Vitest usually feels like the obvious choice.

---

## Example

```typescript
import { describe, it, expect } from 'vitest';
import { sum } from './math';

describe('sum', () => {
  it('adds two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

---

## Strengths

### Fast feedback

Vitest benefits from Vite's module graph and transformation pipeline.

### Familiar API

Most developers with Jest experience can switch quickly.

### Great for frontend libs and apps

Component tests, utility tests, and browser-like environments fit well.

---

## Watchouts

- migrating complex Jest mocks can take work
- some ecosystem guides still assume Jest first
- backend-heavy Node projects may not gain as much if existing Jest setup is stable

---

## Vitest vs Jest

### Prefer Vitest when

- the repo uses Vite
- ESM and TypeScript ergonomics matter
- speed and low config matter

### Prefer Jest when

- the repo is already deeply invested in Jest tooling
- your ecosystem still depends heavily on Jest-specific integrations

---

## Interview Answer

### Why choose Vitest over Jest?

Vitest is often faster and more ergonomic in modern TypeScript and Vite-based projects, while still offering a familiar test API. Jest remains strong, but Vitest usually has lower friction in ESM-first frontend stacks.
