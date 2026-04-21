# EXPLAIN and Query Planning

When a query is slow, the first serious tool is usually:

```sql
EXPLAIN ANALYZE
```

This tells you what the database planned to do and what actually happened.

---

## Why Query Plans Matter

SQL is declarative. You describe **what** you want, and the planner chooses **how** to get it.

Two logically identical queries can have very different runtime depending on:

- indexes
- row counts
- join order
- stale statistics
- memory settings

---

## Basic Commands

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 42;

EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 42;
```

`EXPLAIN` shows the estimated plan.

`EXPLAIN ANALYZE` runs the query and shows actual timing and row counts.

---

## Common Plan Nodes

### Sequential Scan

The database reads the whole table.

Sometimes this is fine. On small tables it can be faster than using an index.

### Index Scan

Reads matching rows via an index, then usually visits the table heap for full row data.

### Index Only Scan

Best case for many lookups. The index already contains enough data to satisfy the query.

### Nested Loop / Hash Join / Merge Join

These are the main join strategies. None is "always best." The right one depends on data shape.

---

## What to Look For

- actual rows wildly different from estimated rows
- sequential scans on large tables
- large sort or hash memory usage
- repeated nested loop work on big inputs
- filter applied after too many rows were already read

Mismatch between estimate and reality usually points to bad statistics or skewed data.

---

## Typical Fixes

- add or change an index
- rewrite predicate to be sargable
- avoid wrapping indexed columns in functions
- reduce selected columns
- refresh statistics with `ANALYZE`
- change query shape if join order is poor

Bad:

```sql
WHERE DATE(created_at) = '2026-04-21'
```

Better:

```sql
WHERE created_at >= '2026-04-21'
  AND created_at < '2026-04-22'
```

---

## Interview Answer

### How do you debug a slow SQL query?

Start with `EXPLAIN ANALYZE`, inspect scans, joins, row estimates, and timing hotspots, then fix the underlying cause with better indexing, query shape, or statistics. The key is understanding why the planner chose that plan, not guessing blindly.
