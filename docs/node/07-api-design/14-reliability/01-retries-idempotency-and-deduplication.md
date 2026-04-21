# Retries, Idempotency, and Deduplication

Distributed systems fail in partial ways:

- request succeeds but response is lost
- timeout happens after side effect already occurred
- worker crashes after doing the work but before acknowledging it

That is why retries alone are dangerous unless paired with idempotency.

---

## Retries

Retries help with transient failures:

- network blips
- 429s
- short dependency outages

Good retries use:

- capped exponential backoff
- jitter
- clear retryable error rules

Bad retries cause retry storms.

---

## Idempotency

An operation is idempotent if repeating it produces the same final effect.

Classic example: charging a payment should not happen twice just because the client retried.

Pattern:

1. client sends idempotency key
2. server stores key + result
3. repeated request returns prior result instead of duplicating side effects

---

## Deduplication

Deduplication is the broader system-level pattern of ensuring repeated messages or jobs do not trigger duplicate work.

Common techniques:

- unique DB constraints
- processed-message tables
- job ids in queues
- Redis set with TTL

---

## Interview Answer

### Why do retries require idempotency?

Because retries are how we survive transient failure, but without idempotency they can duplicate side effects like charges, emails, or state transitions. The safe design is retry with backoff plus an idempotency or deduplication mechanism at the write boundary.
