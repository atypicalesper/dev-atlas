# Concurrency Handling

Concurrency handling is the discipline of making many requests, workers, or transactions operate at the same time without corrupting state.

It is not just "can my app process multiple requests?" It is:

- do two workers claim the same job
- do two users overwrite each other
- do retries create duplicate side effects
- do bursts overwhelm a dependency

The hard part is not parallel execution. The hard part is preserving correctness under contention.

---

## Where Concurrency Bugs Come From

The most common sources are:

- read-modify-write races
- duplicate retries
- lost updates
- double processing of background jobs
- out-of-order events
- too many callers hitting the same dependency at once

Classic bug:

1. Two requests read `balance = 100`
2. Both subtract `20`
3. Both write `80`

One update is lost.

---

## The Main Tools

### 1. Database transactions

Use transactions when multiple reads and writes must behave atomically.

Good for:

- money movement
- inventory reservation
- order state changes

But transactions alone do not solve every race. Isolation level and lock behavior still matter.

### 2. Unique constraints

A unique constraint is one of the strongest concurrency tools because the database enforces it centrally.

Examples:

- one signup per email
- one idempotency key per request
- one active subscription per user

If correctness can be expressed as uniqueness, push it into the database.

### 3. Optimistic concurrency

Optimistic concurrency assumes collisions are rare.

Typical pattern:

```sql
UPDATE documents
SET content = $1, version = version + 1
WHERE id = $2 AND version = $3;
```

If zero rows update, someone else changed the row first.

Good for:

- collaborative editing
- admin screens
- lower-contention domain data

### 4. Pessimistic locking

Pessimistic locking assumes collisions are common enough that waiting is safer than retrying.

Typical pattern:

```sql
SELECT *
FROM jobs
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

Good for:

- queue workers claiming jobs
- limited inventory
- workflows where double processing is unacceptable

### 5. Queues and partitioning

Sometimes the best way to handle concurrency is to reduce it.

Examples:

- route all updates for a user to one Kafka partition
- process one tenant's work in order
- use a queue so workers pull at a controlled rate

This changes "many writers at once" into "serialized work per key."

### 6. Idempotency

Retries are normal in distributed systems. The side effect must be safe if repeated.

Examples:

- payment API with `idempotency_key`
- webhook consumer that stores processed event ids
- queue worker that upserts a final state instead of blindly inserting again

Without idempotency, reliability features create correctness bugs.

### 7. Rate limiting and backpressure

Concurrency handling is also about protecting systems from too much simultaneous work.

Typical controls:

- bounded worker concurrency
- queue depth limits
- semaphore around expensive resources
- circuit breaker
- bulkhead isolation

If everything can call everything at once, one hotspot becomes a platform incident.

---

## Choose the Smallest Correct Mechanism

Use:

- unique constraints before distributed locks
- transactions before custom coordination protocols
- queues before adding more workers blindly
- optimistic locking when collisions are rare
- pessimistic locking when collisions are common and correctness is strict

The best concurrency solution is usually the one with the least moving parts.

---

## Common Patterns

### Job processing

- store jobs durably
- claim with `FOR UPDATE SKIP LOCKED` or broker semantics
- make handlers idempotent
- move poison jobs to dead-letter handling

### API request deduplication

- require an idempotency key
- store request result keyed by that token
- return the original result on retry

### Inventory reservation

- transaction around read + reserve
- guard with row lock or atomic update
- keep reservation timeout explicit

---

## Common Mistakes

- checking for existence in app code without a unique constraint
- using Redis locks for problems the database already owns
- increasing worker count without checking downstream bottlenecks
- assuming retries are harmless
- keeping transactions open across network calls

---

## Interview Answer

### How do you handle concurrency safely?

Start by identifying the invariant you must protect, then choose the smallest mechanism that enforces it: unique constraints, transactions, optimistic locking, pessimistic locking, queues, or idempotency keys. Concurrency handling is really invariant protection under parallel execution.

### When would you use optimistic vs pessimistic locking?

Use optimistic locking when conflicts are uncommon and retrying is acceptable. Use pessimistic locking when contention is expected or the cost of double-processing is high, such as job claiming or inventory reservation.
