# Retries, Idempotency, and Deduplication

Distributed systems fail in partial ways:

- request succeeds but response is lost
- timeout happens after side effect already occurred
- worker crashes after doing the work but before acknowledging it

That is why retries alone are dangerous unless paired with idempotency.

Critical rule: **never retry a non-idempotent write without an idempotency key**. A retried `POST /charge` without a key is how you charge a customer twice. If the handler is not idempotent and you can't add a key, the correct behavior on timeout is to *not* retry and surface the error — not to silently re-send.

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

Critical rule: **always add jitter to backoff**. Pure exponential backoff (`2s, 4s, 8s, 16s`) causes every retrying client to fire at exactly the same instants, which synchronizes load spikes onto the failing dependency. Jitter randomizes the retry time (`rand(0, 2s)`, `rand(0, 4s)`, …) and spreads the herd.

Critical rule: **every retry loop needs a cap**. No retry budget is unlimited — set max attempts, max total elapsed time, or both. Unbounded retries on a dead dependency turn transient failure into infinite resource consumption.

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
