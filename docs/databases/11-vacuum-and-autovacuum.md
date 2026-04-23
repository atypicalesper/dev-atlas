# Vacuum and Autovacuum

PostgreSQL does not overwrite rows in place when you `UPDATE` or `DELETE`. Because of MVCC (Multi-Version Concurrency Control), the old version of the row is marked as "dead" but stays on disk until something explicitly cleans it up. That "something" is `VACUUM`. Without it, your database grows endlessly, indexes bloat, query plans get worse, and eventually you risk the dreaded **transaction ID wraparound** — a failure mode where the database refuses writes entirely until you fix it.

If you operate Postgres and you don't understand vacuum, you are one long-running transaction away from a surprise outage.

---

## Why MVCC Requires Cleanup

Every row version in Postgres carries two hidden columns: `xmin` (the txid that created it) and `xmax` (the txid that deleted it, if any). When you update row R:

1. A *new* tuple is inserted with the new values
2. The *old* tuple's `xmax` is set to the current transaction id
3. Readers in other transactions may still need the old version (that's MVCC — concurrent readers don't block writers)

Once no active transaction needs the old version, it becomes a **dead tuple**. Dead tuples don't vanish. They sit there waiting for vacuum.

### What happens without vacuum

- Tables grow far larger than their live-row count suggests (*table bloat*)
- Indexes point at dead tuples and grow too (*index bloat*)
- Sequential scans read dead rows only to discard them → wasted I/O
- The query planner's statistics go stale → bad plans
- Transaction IDs, which are 32-bit, eventually approach wraparound (2 billion transactions) and Postgres *forces a shutdown into single-user mode* rather than corrupt data

---

## VACUUM vs VACUUM FULL

### `VACUUM`

Scans the table, marks dead tuples as reusable, updates the visibility map, and updates the free space map. **It does not shrink the physical file** — the freed space is available for future inserts but the file size on disk stays the same. Takes only a lightweight lock (`SHARE UPDATE EXCLUSIVE`), so concurrent reads and writes continue.

### `VACUUM FULL`

Rewrites the entire table to a new file, physically compacted. The old file is dropped. Pros: reclaims disk space back to the OS. Cons: takes an `ACCESS EXCLUSIVE` lock — all reads and writes block until it finishes. Also requires roughly 2× the table's size in free disk space while it runs.

**Rule of thumb:** never run `VACUUM FULL` on a production table without a maintenance window. Prefer `pg_repack` or table partitioning strategies when you need to reclaim space online.

### `ANALYZE`

Separate but related — updates planner statistics. Often runs together as `VACUUM ANALYZE`. Autovacuum handles both automatically.

---

## Autovacuum: the Background Janitor

Autovacuum is a daemon (`autovacuum launcher` + per-database workers) that decides when to vacuum each table based on activity. It's on by default and **you want it on**.

The trigger formula (simplified):

```
vacuum when:   dead_tuples > autovacuum_vacuum_threshold
             + autovacuum_vacuum_scale_factor * n_live_tup
```

Defaults: `threshold = 50`, `scale_factor = 0.2` — meaning autovacuum kicks in when dead tuples exceed 20% of live rows + 50. For a 1M-row table, that's 200,050 dead tuples. Way too conservative for a high-write table.

### Tuning for busy tables

```sql
-- Per-table override (do this, don't change the global default for everything)
ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.05,   -- trigger at 5% bloat
  autovacuum_vacuum_threshold    = 1000,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_limit   = 2000    -- let it work faster
);
```

Busy write tables need *aggressive* autovacuum; cold tables can stay on defaults.

---

## Concrete Example: Finding Bloat

```sql
-- Dead tuple count per table, sorted worst-first
SELECT
  schemaname, relname,
  n_live_tup, n_dead_tup,
  round(100.0 * n_dead_tup / NULLIF(n_live_tup, 0), 2) AS dead_pct,
  last_autovacuum, last_vacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
```

If you see a table at 60% dead and `last_autovacuum` is days old, autovacuum is losing the race. Either tune it more aggressively or investigate what's blocking it (often: a long-running transaction holding back the "xmin horizon" so autovacuum can't clean up anything).

---

## The Long-Running Transaction Problem

This is the subtle killer. Autovacuum can only remove tuples that are dead to **all** active transactions. One idle transaction open for hours pins the horizon — every dead tuple created since that transaction started sticks around. You'll see:

- `last_autovacuum` is recent
- But `n_dead_tup` keeps climbing
- And the table keeps growing

The fix is not more vacuum — it's killing the long transaction.

```sql
-- Find transactions open longer than 5 minutes
SELECT pid, now() - xact_start AS age, state, query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
  AND now() - xact_start > interval '5 minutes'
ORDER BY xact_start;
```

---

## Transaction ID Wraparound

Postgres uses 32-bit transaction IDs that wrap around at ~2 billion. To prevent wraparound corruption, every table must be vacuumed at least once every `vacuum_freeze_min_age` transactions. If autovacuum falls behind on *all* tables, Postgres enters "wraparound prevention mode" — it stops accepting new writes until you manually vacuum.

Monitoring metric to watch: `age(datfrozenxid)` per database. If it gets within a few hundred million of 2 billion, you're close to trouble.

---

## Symptoms That Point to Vacuum

- Tables growing faster than row count suggests
- Sequential scans getting slower over weeks without schema change
- `n_dead_tup` consistently high for a table
- `age(relfrozenxid)` approaching the wraparound threshold
- Autovacuum running constantly but never finishing on a specific table

---

## Interview / Trick Questions

### 1. Why does Postgres need VACUUM at all? MySQL doesn't seem to.

Because of MVCC. Postgres keeps old row versions in the same heap file so concurrent transactions can see consistent snapshots without locking. MySQL's InnoDB stores old versions in a separate rollback segment and cleans them differently (purge threads). Postgres's design is elegant for concurrency but creates dead tuples that need explicit cleanup.

### 2. Trick: autovacuum is running constantly on a table but bloat keeps growing. What's wrong?

Almost always a long-running transaction pinning the xmin horizon. Autovacuum cleans tuples that are dead to all active transactions; if a transaction is open from yesterday, no tuples created since yesterday can be cleaned. Find and terminate the idle transaction.

### 3. VACUUM vs VACUUM FULL — when would you use each?

`VACUUM` routinely (or just let autovacuum handle it). `VACUUM FULL` only when you need to reclaim disk space back to the OS — and only with a maintenance window, because it takes an exclusive lock. For online space reclamation, use `pg_repack`.

### 4. What is transaction ID wraparound and why should you care?

Postgres txids are 32-bit. Every ~2 billion transactions they wrap. To prevent data corruption from wraparound, old tuples must be "frozen" via VACUUM before the wrap. If autovacuum falls behind, Postgres stops the database to force manual intervention. It's rare but catastrophic when it happens — monitor `age(datfrozenxid)`.

### 5. Trick: you run `VACUUM` on a table. Disk usage doesn't change. Is that broken?

No — that's the normal behavior. `VACUUM` (without `FULL`) marks space for reuse but doesn't shrink the file. Disk usage only drops if (a) you run `VACUUM FULL`, or (b) the table had trailing empty pages that `VACUUM` happens to be able to truncate.

### 6. How would you tune autovacuum for a hot write table?

Per-table settings: lower `autovacuum_vacuum_scale_factor` (e.g. 0.05), lower `autovacuum_analyze_scale_factor` (e.g. 0.02), increase `autovacuum_vacuum_cost_limit` so workers can do more work per cycle. Don't change globals for everything — override on the specific hot tables.

### 7. Why does autovacuum update planner statistics, not just clean tuples?

Because stale statistics cause bad query plans. After a batch of inserts or updates changes a column's distribution, the planner keeps using outdated histograms until `ANALYZE` runs. Autovacuum runs `ANALYZE` automatically on a similar schedule, which is why tables with steady writes usually get fresh stats for free.
