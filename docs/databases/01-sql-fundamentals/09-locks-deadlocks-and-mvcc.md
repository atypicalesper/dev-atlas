# Locks, Deadlocks, and MVCC

Concurrency problems in databases are usually about two things:

- who can see which version of data
- who must wait for whom

MVCC handles visibility. Locks handle coordination.

---

## MVCC

MVCC stands for Multi-Version Concurrency Control.

Instead of overwriting rows in place for every reader immediately, the database keeps row versions so readers can often continue without blocking writers.

This is why PostgreSQL can support many reads and writes concurrently.

---

## Why Locks Still Exist

MVCC reduces read/write blocking, but it does not remove the need for locks.

Locks are still needed for:

- writes to the same row
- schema changes
- explicit row coordination like `SELECT ... FOR UPDATE`

---

## Deadlock

A deadlock happens when two transactions wait on each other in a cycle.

Classic example:

1. Tx A locks row 1, wants row 2
2. Tx B locks row 2, wants row 1
3. Neither can continue

The database detects the cycle and kills one transaction.

---

## Preventing Deadlocks

- acquire locks in a consistent order
- keep transactions short
- avoid user input inside transactions
- use `NOWAIT` or `SKIP LOCKED` where appropriate

Consistent ordering is the big one.

---

## Useful SQL

```sql
SELECT * FROM jobs
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 10;
```

This is a common queue-processing pattern in PostgreSQL.

---

## Interview Answer

### What is MVCC?

MVCC lets readers and writers work concurrently by exposing the right row version to each transaction instead of forcing every read to block on writes.

### How do you prevent deadlocks?

Keep transactions short and always acquire shared resources in a consistent order. When appropriate, use row-locking patterns like `FOR UPDATE SKIP LOCKED` or `NOWAIT` to avoid waiting indefinitely.
