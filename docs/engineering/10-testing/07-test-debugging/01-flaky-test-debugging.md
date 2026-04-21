# Flaky Test Debugging

A flaky test is one that fails without a code change.

That is not just annoying. It erodes trust in the whole test suite.

---

## Common Causes

- timing assumptions
- shared mutable state
- order dependence
- leaked network or DB data
- background jobs still running
- clock and timezone issues
- test data collisions in parallel runs

---

## Debugging Workflow

### 1. Reproduce reliably

Run the same test repeatedly:

```bash
for i in {1..50}; do npm test -- flaky.spec.ts || break; done
```

### 2. Check isolation

Does it fail only:

- after another test
- in parallel
- in CI
- on one OS or timezone

### 3. Inspect nondeterminism

Look for:

- `Date.now()`
- random IDs
- retries
- asynchronous cleanup
- race conditions

### 4. Add observability

Log enough to see ordering, state, and timing.

---

## Fast Fixes That Often Work

- wait on user-visible state, not arbitrary sleeps
- reset DB / cache state between tests
- seed deterministic timestamps and randomness
- avoid global singleton mutation
- make test data unique per run

---

## What Not to Do

- sprinkle `sleep(1000)` everywhere
- mark flaky tests as retried forever and move on
- ignore the issue because "CI eventually passes"

Retries can reduce noise temporarily, but they are not the root fix.

---

## Interview Answer

### How do you debug flaky tests?

First reproduce the flake repeatedly, then narrow whether it is caused by timing, shared state, ordering, or environment differences. Add enough visibility to observe the race, fix the nondeterminism directly, and use retries only as a short-term containment step.
