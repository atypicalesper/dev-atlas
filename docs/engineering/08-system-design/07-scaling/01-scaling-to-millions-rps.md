# Scaling to Millions of Requests per Second

"How would you scale this to 1 million requests per second?" is one of the most common senior/staff interview prompts, and the wrong instinct is to jump straight to "add more servers." The right answer walks the interviewer through *tiers*: the architecture that serves 10K requests/second is genuinely different from the one that serves 1M, and each tier is unlocked by removing a specific bottleneck — first the app server, then the database, then the network and coordination overhead. The skill being tested is whether you can do rough capacity math, identify the bottleneck at each scale, and reach for the cheapest mechanism that removes it before adding complexity. This page walks 10K → 100K → 1M RPS as a progression, with the numbers that justify each jump.

Throughout, keep the golden rule in mind: **scale reads with caching and replicas, scale writes with sharding and async, and never add a distributed component until a single-node one has actually run out.**

---

## First, the capacity math

Before choosing an architecture, estimate what a single modern server can do, so you know how many you need. Rough, defensible numbers to quote in an interview:

```
A single well-tuned app server (8 cores):
  - Simple JSON API, mostly cache hits:   ~5,000–20,000 RPS
  - With a DB round-trip per request:      ~1,000–5,000 RPS
  - Heavy CPU work per request:            ~100–1,000 RPS

A single primary database (Postgres/MySQL):
  - Point reads (indexed):                 ~10,000–50,000 QPS
  - Writes (with fsync/replication):       ~1,000–10,000 QPS
  - This is the wall you hit first at scale.

Redis (single instance):
  - ~100,000+ ops/sec (in-memory, single-threaded)

Latency budget: p99 under ~200ms end-to-end for most web APIs.
```

From these, the tiering falls out naturally. 10K RPS fits on a handful of servers and one database. 100K RPS forces you to fan out reads and offload the database. 1M RPS forces you to shard writes, push work to the edge, and make everything async.

Always state your assumptions out loud: **RPS, read:write ratio, payload size, and latency target.** A 100:1 read-heavy feed and a 1:1 write-heavy ledger scale completely differently.

---

## Tier 1 — ~10,000 requests/second

At 10K RPS the goal is a clean, boring, horizontally scalable stack. You do not need anything exotic; you need statelessness and a load balancer so you can add servers linearly.

```
        ┌────────────┐
Clients │    CDN     │  (static assets, cached responses)
   │    └─────┬──────┘
   ▼          ▼
┌──────────────────┐
│  Load Balancer   │  (L7, health checks, TLS termination)
└───┬────────┬─────┘
    ▼        ▼
 ┌─────┐  ┌─────┐    Stateless app servers (N behind the LB)
 │ App │  │ App │    ~2K–5K RPS each → 3–6 instances
 └──┬──┘  └──┬──┘
    ▼        ▼
 ┌─────────────┐   ┌────────┐
 │  Primary DB │   │ Redis  │  (cache + sessions)
 └──────┬──────┘   └────────┘
        ▼
   ┌─────────┐
   │ Replica │  (read scaling begins here)
   └─────────┘
```

The critical decisions at this tier:

- **Stateless app servers.** No in-memory session state; put sessions in Redis or a signed cookie/JWT. This is what makes horizontal scaling *linear* — any server can handle any request, so the load balancer can round-robin freely and autoscaling just works.
- **A cache in front of the database.** Even a modest cache-aside layer on hot reads takes enormous pressure off the primary. This is the single highest-leverage move.
- **One read replica** to offload read queries. Your app routes writes to the primary and reads to the replica (accepting slight replication lag).

```typescript
// Cache-aside: the pattern that carries you through every tier
async function getUser(id: string) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);           // hot path — no DB hit

  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 300); // 5-min TTL
  return user;
}
```

**Bottleneck that ends this tier:** the single primary database. Reads you can push to replicas, but every replica still replays every write, and connection counts and cache-miss storms start to bite around here.

---

## Tier 2 — ~100,000 requests/second

At 100K RPS the app tier is easy (just more stateless instances behind the balancer), so the whole game becomes **keeping load off the database** and **absorbing spikes**. You lean hard on caching, fan out reads across many replicas, and make anything that does not need to be synchronous asynchronous.

```
        ┌─────────────────────┐
Clients │  CDN / Edge cache   │  absorbs a large % of reads
        └──────────┬──────────┘
                   ▼
          ┌─────────────────┐
          │ Load Balancer(s)│
          └───┬────────┬────┘
              ▼        ▼
        ┌───────── App tier (autoscaled, 20–50 instances) ─────────┐
        │   reads → replicas         writes → primary → queue      │
        └───┬───────────────┬───────────────────┬──────────────────┘
            ▼               ▼                    ▼
     ┌────────────┐  ┌──────────────┐    ┌──────────────┐
     │ Redis      │  │ Read replicas│    │ Message queue│
     │ (cluster)  │  │  (many)      │    │ (Kafka/SQS)  │
     └────────────┘  └──────┬───────┘    └──────┬───────┘
                            ▼                    ▼
                     ┌────────────┐        ┌──────────┐
                     │ Primary DB │        │ Workers  │  (async: emails,
                     └────────────┘        └──────────┘   feeds, analytics)
```

Key moves that unlock this tier:

- **Cache aggressively and multi-layer.** Browser → CDN/edge → Redis → DB. Push a high cache-hit ratio (90%+ on read-heavy workloads) so the database only sees misses. A 95% hit rate means the DB handles 1/20th of the read traffic.
- **Read replicas, plural.** Fan reads across several replicas. Watch for *replication lag* and use read-your-own-writes routing (send a user's reads to the primary for a short window after they write).
- **Make writes async.** The request writes the minimum synchronously (or just enqueues an event) and returns; workers do the heavy follow-up work off a queue. This decouples user-facing latency from downstream throughput and lets you absorb spikes in the queue instead of dropping requests.
- **Connection pooling / a proxy** (PgBouncer) — at this scale raw connection counts to the DB become a bottleneck of their own.
- **Rate limiting** at the edge to protect the origin from abuse and thundering herds.

```typescript
// Write path becomes: persist the essential, enqueue the rest
async function postTweet(userId: string, text: string) {
  const tweet = await db.insert('tweets', { userId, text }); // synchronous, minimal
  await queue.publish('tweet.created', { tweetId: tweet.id, userId }); // async fan-out
  return tweet; // return immediately; feed delivery happens in workers
}
```

**Bottleneck that ends this tier:** the *single primary* for writes. Caching and replicas scale reads almost indefinitely, but every write still funnels through one node. When write throughput (or the working set size) exceeds what one primary can take, you must partition.

---

## Tier 3 — ~1,000,000 requests/second

At 1M RPS there is no single anything. The database is **sharded** so writes spread across many primaries, work is pushed to the **edge** so most requests never reach your origin, and the system is designed around **partitioning and asynchrony** end to end. You also cross a threshold where the CAP trade-offs become explicit: you often accept eventual consistency to get availability and latency.

```
          Global users
               │
     ┌─────────▼──────────┐
     │  Anycast / GeoDNS  │  route to nearest region
     └─────────┬──────────┘
               ▼
   ┌──── Edge / CDN (POPs worldwide) ────┐  serves most reads; edge compute
   └───────────────┬─────────────────────┘
                   ▼   (only cache misses / writes go to origin)
       ┌─── Regional cluster (× many regions) ───┐
       │  LB → app tier → Redis cluster          │
       │                    │                    │
       │         ┌──────────┼──────────┐         │
       │         ▼          ▼          ▼         │
       │     ┌──────┐   ┌──────┐   ┌──────┐      │  Sharded DB:
       │     │Shard1│   │Shard2│   │Shard3│ ...  │  partition by key
       │     └──────┘   └──────┘   └──────┘      │  (each shard = primary + replicas)
       │              Kafka (partitioned)        │
       │                    ▼                    │
       │              Worker fleets              │
       └─────────────────────────────────────────┘
```

What defines this tier:

- **Sharding (horizontal partitioning) of the data.** Split the dataset by a shard key (e.g., `user_id`) so each shard owns a slice and handles its own writes. Choose the key to spread load evenly and keep common queries within a single shard. Consistent hashing lets you add shards without reshuffling everything. **The hard parts are cross-shard queries, transactions, and hotspots** — be ready to discuss them.
- **Edge everything.** With a global CDN and edge compute, the vast majority of requests are served from a POP near the user and never touch your origin. This is how the effective origin RPS stays manageable even at 1M total.
- **Everything async and event-driven.** A partitioned log (Kafka) is the backbone; services react to events. Synchronous request paths are kept as short as possible.
- **Multi-region** for latency and availability, which forces a data-consistency decision: active-active with eventual consistency, or active-passive with failover.
- **Cell-based / bulkhead architecture** so a failure in one shard/region/cell is contained instead of cascading.
- **Backpressure and load shedding** — at this scale you *will* get overloaded sometimes; the system must shed or queue gracefully (return 429/503, degrade features) rather than fall over.

```
Sharding by user_id (consistent hashing):

  shard = hash(user_id) mod N        // simple, but resharding moves ~everything
  shard = consistentHash(user_id)    // preferred: adding a shard moves ~1/N of keys

  Cross-shard "get my feed from 500 people I follow":
    → fan-out-on-write (precompute feeds into each user's shard), OR
    → fan-out-on-read (query each followee's shard, merge) — pick per hotspot.
    Celebrities with millions of followers are the classic hotspot: hybrid it.
```

**What's left as the bottleneck:** coordination and consistency. At 1M RPS your problems are no longer "add a box" — they are hot shards, cross-shard transactions, replication lag, cache stampedes, and keeping the whole thing observable. The engineering shifts from throughput to *managing partial failure*.

---

## The scaling toolkit (what each lever actually buys you)

```
Lever                     Scales…        Cost / trade-off
──────────────────────────────────────────────────────────────────────
Stateless app + LB        app tier       cheap; do this first
Caching (multi-layer)     reads          stale data, invalidation is hard
Read replicas             reads          replication lag, read-your-writes
CDN / edge                reads (global) cache invalidation, cost
Async / message queue     write spikes   eventual consistency, complexity
Sharding                  writes + data  cross-shard queries/txns, hotspots
Multi-region              latency + HA   consistency model gets hard
Load shedding / backpressure survival    some requests are rejected
```

The interview signal is *ordering*: reach for statelessness and caching before replicas, replicas before sharding, and sharding before multi-region. Each step adds operational complexity, so you justify it with the bottleneck it removes and the capacity number that forced it.

---

## How to answer this in an interview

1. **Clarify and estimate.** Ask for RPS, read:write ratio, payload size, latency/consistency requirements. Do the back-of-envelope math out loud (see the [capacity estimation](02-capacity-estimation.md) cheat sheet).
2. **Start simple.** Draw the single-region, stateless-app + DB + cache stack. Name the RPS it handles.
3. **Find the bottleneck, remove it, repeat.** "At ~100K the primary is the wall, so I cache hard and add replicas; at ~1M writes are the wall, so I shard by `user_id` and push reads to the edge."
4. **Name the trade-offs.** Every lever costs consistency, complexity, or money. Saying so is what separates senior from junior answers.
5. **Cover failure.** Replication lag, hot shards, cache stampede, region failover, load shedding. Availability and graceful degradation matter as much as raw throughput.
