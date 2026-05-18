# Locking Mechanisms

Locks are how databases coordinate access when concurrent work could otherwise break correctness.

MVCC explains visibility. Locking explains waiting.

You usually care about locking when you need one of these:

- prevent two writers from changing the same row at once
- claim work safely from a table-backed queue
- coordinate updates to shared counters or inventory
- protect schema changes from conflicting traffic

---

## Broad Categories

### Row locks

Protect specific rows.

Common when:

- updating one order
- reserving one seat
- claiming one job

### Table locks

Protect broader table-level operations.

Common when:

- changing schema
- rebuilding structures
- some maintenance operations

### Advisory locks

Application-defined locks keyed by arbitrary values.

Useful when you need coordination that is not naturally tied to one row.

Examples:

- one migration runner at a time
- one scheduler instance per tenant

Use them carefully. They are powerful, but easier to misuse than row locks.

---

## PostgreSQL Row Lock Modes

### `FOR UPDATE`

The strongest common row lock for application workflows.

Use when another transaction must not update or delete the selected rows until you finish.

```sql
SELECT *
FROM jobs
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE;
```

### `FOR UPDATE SKIP LOCKED`

Excellent for queue workers.

Rows already locked by another worker are skipped instead of blocking.

```sql
SELECT *
FROM jobs
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 10;
```

### `FOR UPDATE NOWAIT`

Fail immediately instead of waiting.

Useful when the caller would rather retry than block.

### `FOR SHARE`

Allows concurrent readers with the same lock, but blocks conflicting writers.

Less common in application code than `FOR UPDATE`, but still useful for explicit coordination.

---

## Pessimistic vs Optimistic Locking

### Pessimistic locking

Assume conflicts are likely enough that waiting is the safer path.

Good for:

- inventory
- queue claiming
- financial workflows

### Optimistic locking

Assume conflicts are rare and detect them during update.

Typical version-column pattern:

```sql
UPDATE documents
SET title = $1, version = version + 1
WHERE id = $2 AND version = $3;
```

If zero rows update, someone else won the race first.

Good for:

- admin panels
- profile edits
- collaborative systems with retry UI

---

## Picking the Right Mechanism

Use:

- row locks for short critical sections tied to real rows
- `SKIP LOCKED` for worker fleets
- optimistic locking when collisions are uncommon
- advisory locks for app-wide coordination problems

Avoid:

- holding locks across slow network calls
- long transactions with user interaction inside them
- locking more rows than the invariant actually needs

---

## Common Pitfalls

- inconsistent lock ordering causes deadlocks
- broad scans under `FOR UPDATE` lock far more than intended
- missing index on the queue predicate makes lock-based workers slow
- retries without idempotency can still duplicate side effects

Locking solves coordination, not business-level deduplication by itself.

---

## Interview Answer

### What locking mechanisms do you use most often?

In application code, mostly row-level locks such as `FOR UPDATE`, plus `SKIP LOCKED` for worker queues and optimistic locking with version columns for lower-contention updates. Advisory locks are useful for cross-process coordination when no single row naturally owns the lock.

### When would you use optimistic instead of pessimistic locking?

Use optimistic locking when conflicts are rare and retrying is acceptable. Use pessimistic locking when contention is expected or the cost of a conflict is too high, such as inventory reservation or job claiming.
