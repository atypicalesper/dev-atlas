# Vacuum and Autovacuum

In PostgreSQL, deleting or updating rows does not instantly reclaim storage the way many engineers first expect.

That is why vacuum exists.

---

## Why Vacuum Matters

Because of MVCC, old row versions can accumulate.

Without cleanup:

- tables bloat
- indexes bloat
- query performance degrades
- transaction ID wraparound risk grows

---

## VACUUM

`VACUUM` marks dead tuples as reusable.

It does not usually shrink the file immediately. It reclaims space for future inserts and updates.

---

## VACUUM FULL

`VACUUM FULL` rewrites the table to compact it physically.

Pros:

- can shrink file size

Cons:

- expensive
- takes stronger locks

Use it carefully.

---

## Autovacuum

Autovacuum is the background system that keeps PostgreSQL healthy automatically.

You generally want it enabled and tuned, not disabled.

Key idea:

- busy tables need more aggressive autovacuum settings
- defaults can be too conservative for high-write workloads

---

## Symptoms of Vacuum Problems

- table size grows faster than expected
- index scans slow down
- `dead tuples` stay high
- autovacuum cannot keep up

---

## Interview Answer

### Why does PostgreSQL need vacuum?

Because MVCC leaves behind dead row versions after updates and deletes. Vacuum cleans those up so space can be reused and the database stays performant and safe from transaction ID wraparound issues.
