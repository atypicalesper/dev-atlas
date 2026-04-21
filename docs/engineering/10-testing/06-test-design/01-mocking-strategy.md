# Mocking Strategy

Mocking is not good or bad by itself. The real question is:

```
What are we trying to learn from this test?
```

Mock aggressively when isolating business logic. Mock sparingly when verifying integration behavior.

---

## A Practical Pyramid

- **Unit tests**: mock network, DB, and time freely
- **Integration tests**: prefer real dependencies where the integration is the point
- **E2E tests**: mock only external systems you do not control

---

## Good Reasons to Mock

- isolate domain logic
- make failures deterministic
- avoid slow or flaky external dependencies
- force edge cases like timeouts and 500s

---

## Bad Reasons to Mock

- hiding a hard-to-test design
- duplicating the implementation in the test
- mocking the exact library methods you do not own across every test

If every test needs a huge mock graph, the production code may be too coupled.

---

## Strong Pattern: Mock at Boundaries

Prefer mocking:

- HTTP client wrapper
- email service adapter
- payment gateway adapter
- repository interface

Avoid mocking every internal helper unless the test is truly unit-level.

---

## What to Keep Real

Keep these real whenever practical in higher-level tests:

- SQL queries
- migrations
- serialization
- routing
- auth middleware

These are frequent sources of production regressions.

---

## Interview Answer

### What is a good mocking strategy?

Mock at system boundaries and choose the minimum realism needed for the question each test asks. Unit tests can mock heavily, but integration and E2E tests should keep important interfaces real so you still catch query, serialization, routing, and contract failures.
