# Indexing, Caching, and Sharding

These three ideas show up in almost every scaling conversation because they attack latency and load at different layers:

- indexing makes the database do less work per query
- caching avoids some queries entirely
- sharding spreads data and write load across multiple nodes

If you remember only one framing, remember this:

1. Fix bad queries first
2. Add the right indexes
3. Add caching for repeated reads
4. Shard only when a single node is no longer enough

Sharding is not a substitute for poor indexing. Caching is not a substitute for correctness.

---

## Indexing

Indexes are extra data structures that let the database find rows without scanning the whole table.

Typical wins:

- fast point lookups
- faster joins
- range scans on ordered columns
- avoiding sorts for some `ORDER BY` queries

Typical costs:

- every write must update the index
- extra RAM and disk usage
- wrong indexes make writes slower without helping reads

Good signs you need indexing:

- `EXPLAIN ANALYZE` shows large `Seq Scan` on a hot table
- joins on foreign keys are slow
- dashboards filter by the same columns repeatedly

Common mistakes:

- indexing low-cardinality columns blindly
- creating too many overlapping indexes
- indexing before understanding the query shape
- forgetting composite index order matters

---

## Caching

Caching stores previously computed or fetched data closer to the caller.

Common layers:

- browser cache
- CDN / edge cache
- reverse proxy cache
- application cache
- database buffer cache

Common patterns:

- cache-aside: app reads cache first, then DB on miss
- write-through: write cache and database together
- write-behind: update cache now, flush later
- read-through: cache system fetches on miss for you

Use caching when:

- reads repeat often
- the source is expensive
- staleness tolerance is acceptable

Do not add caching before answering:

- what is the cache key
- how does invalidation happen
- how stale can data be
- what happens during cache stampede

The hardest part of caching is not storing values. It is keeping them fresh enough.

---

## Sharding

Sharding is horizontal partitioning. Instead of one database holding all rows, data is split across multiple databases.

Typical reasons to shard:

- one node cannot handle write throughput
- storage exceeds single-node limits
- hotspots need to be spread out

Common shard keys:

- `user_id`
- `tenant_id`
- geographic region
- hashed entity id

Tradeoffs:

- cross-shard queries get harder
- joins across shards are painful
- rebalancing is operationally expensive
- wrong shard key creates hotspots

Sharding is usually a late-stage move because it changes application architecture, observability, migrations, backup strategy, and incident handling all at once.

---

## Choosing the Right Lever

### Use indexing when

- one database is still viable
- the problem is query selection, not total dataset size
- latency is caused by scans, sorts, or poor join plans

### Use caching when

- the same expensive read happens repeatedly
- data can be briefly stale
- downstream systems need protection from bursts

### Use sharding when

- the workload cannot fit safely on a single primary
- write throughput or storage is the true limit
- you have already squeezed obvious wins from query tuning, indexing, and caching

---

## A Practical Order

Imagine a feed service is slow:

1. Check slow queries
2. Add or fix indexes on `user_id`, `created_at`, and join keys
3. Cache precomputed feed pages or ranking results
4. If writes and storage keep growing, shard by `user_id` or region

This is the usual order because each step is progressively more expensive operationally.

---

## Design Tradeoff Table

| Lever | Primary benefit | Main cost | Best for |
|---|---|---|---|
| Indexing | Faster query execution | Slower writes, more storage | Hot filters, joins, ranges |
| Caching | Lower latency and lower load | Invalidation complexity | Repeated reads |
| Sharding | Higher write/storage ceiling | Major operational complexity | Large-scale multi-node systems |

---

## Interview Answer

### How do indexing, caching, and sharding differ?

Indexing helps a single database answer a query faster. Caching avoids some trips to the source system altogether. Sharding increases total capacity by splitting data across machines. They solve different bottlenecks and usually appear in that order.

### When should you shard?

Only after proving that query tuning, indexing, vertical scaling, and caching are not enough. Sharding is a structural change with long-term operational cost, so it should answer a real capacity limit rather than a vague performance concern.
