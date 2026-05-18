# Indexing in Production

Basic indexing knowledge is about knowing that indexes speed up reads.

Production indexing knowledge is about knowing:

- which index shape matches the query
- what the write cost is
- how to roll an index out safely
- how to tell when an index is not helping anymore

That is the difference between "I know indexing" and "I can operate a live database."

---

## Start From Queries, Not Columns

Do not ask, "Which columns should I index?"

Ask:

- which queries are slow
- which predicates repeat
- which joins are hot
- which orderings force sorts
- which indexes the planner is actually using

Indexes exist to serve query shapes.

---

## Index Types You Should Reach For

### B-Tree

Default and most common.

Good for:

- equality lookups
- range scans
- ordered scans
- most join keys

### Composite index

Useful when queries filter on multiple columns.

Example:

```sql
CREATE INDEX idx_orders_user_status_created
ON orders(user_id, status, created_at DESC);
```

Remember the left-prefix rule:

- `(a, b, c)` helps queries on `a`
- `(a, b, c)` helps queries on `a, b`
- `(a, b, c)` does not help a query on only `b`

### Partial index

Only indexes rows matching a condition.

```sql
CREATE INDEX idx_jobs_pending_created
ON jobs(created_at)
WHERE status = 'pending';
```

Great when one slice of data is queried constantly and the rest is not.

### Expression index

Use when the query wraps a column in a function.

```sql
CREATE INDEX idx_users_lower_email
ON users(LOWER(email));
```

### Covering index

Include extra selected columns to unlock index-only scans.

```sql
CREATE INDEX idx_orders_user_id
ON orders(user_id)
INCLUDE (status, total_amount);
```

---

## Index Rollout Rules

### Use concurrent index creation

On PostgreSQL:

```sql
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
```

Regular `CREATE INDEX` can block traffic badly on large tables.

### Measure before and after

Check:

- execution plan
- execution time
- read amplification
- write overhead

An index that reduces one report query by 500ms but slows every write path may still be a bad trade.

### Revisit old indexes

Indexes are not "set and forget."

Look for:

- unused indexes
- overlapping indexes
- indexes created for dead features
- changed query patterns after product evolution

---

## Common Reasons an Index Is Ignored

- function on the column
- wrong composite order
- implicit type casting
- low selectivity
- returning most of the table anyway
- stale statistics

Always confirm with `EXPLAIN ANALYZE`. "We added an index" is not proof it is used.

---

## Write Cost Matters

Every insert, update, and delete must maintain every relevant index.

Too many indexes cause:

- slower writes
- more vacuum work
- more disk usage
- bigger memory pressure

This is why index design is part of systems design, not just SQL syntax.

---

## A Practical Workflow

1. Capture the slow query
2. Run `EXPLAIN ANALYZE`
3. Identify filter, join, and sort pattern
4. Add the smallest index that matches the hot path
5. Re-run the plan
6. Watch write cost and real production usage

---

## Interview Answer

### How do you decide what to index?

Start from the workload, not the schema. Use slow queries and `EXPLAIN ANALYZE` to find repeated filter, join, and ordering patterns, then add the smallest index that matches that access path while respecting write cost.

### What are the most common production indexing mistakes?

Creating indexes without looking at the actual query plan, using the wrong column order in composite indexes, leaving unused indexes around forever, and forgetting that every extra index slows writes.
