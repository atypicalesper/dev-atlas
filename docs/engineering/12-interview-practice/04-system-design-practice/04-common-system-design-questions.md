# Commonly Asked System Design Questions

The same two dozen design questions recur across nearly every senior interview loop, and the ones you'll be asked are highly predictable — URL shortener, news feed, chat, rate limiter, ride-hailing, video streaming, and a handful of others. This page is a breadth-first reference to that canon: for each question, the requirements to clarify, the core components, the number that dominates the design, and the single hardest trade-off the interviewer is really probing. Use it to build recall — pair it with the deep worked answers in [design questions](01-design-questions.md) and the [scaling](../../08-system-design/07-scaling/01-scaling-to-millions-rps.md) and [capacity estimation](../../08-system-design/07-scaling/02-capacity-estimation.md) guides for the full method.

For every question, run the same loop: **clarify requirements → estimate capacity → draw the high-level design → deep-dive the bottleneck → discuss trade-offs and failure.** The notes below give you the crux so you can get to the interesting part fast.

---

## URL Shortener (TinyURL, bit.ly)

- **Clarify:** custom aliases? expiry? analytics? traffic (read:write is very high, ~100:1).
- **Core:** hash/encode a unique ID to a base62 short key; store `short → long` mapping; redirect (301/302) on lookup.
- **Crux:** generating short, unique, non-guessable keys. Options: base62 of an auto-increment ID (short but enumerable), hash+collision-check, or a pre-generated key range per server. Cache the hot mappings — reads dominate.
- **Trade-off:** 301 (cacheable, loses per-click analytics) vs 302 (every click hits you, enables analytics).

## Rate Limiter

- **Clarify:** per-user/IP/API-key? limit granularity? distributed across nodes? allow bursts?
- **Core:** token bucket or sliding-window counter in Redis, keyed by client; check-and-decrement per request at the gateway.
- **Crux:** doing it accurately across many nodes without a race — atomic Redis ops (Lua) or a sliding-window log. Token bucket allows bursts; fixed window has boundary spikes; sliding window is smoother but costlier.
- **Trade-off:** accuracy vs latency/memory. See the [rate limiter LLD](../../08-system-design/lld/01-rate-limiter) for algorithm code.

## News Feed (Twitter, Facebook, Instagram feed)

- **Clarify:** DAU, follow-graph size, ranking (chronological vs ML), read:write (~200:1, read-heavy).
- **Core:** post service + follow graph + feed generation + delivery. **Fan-out-on-write** (push each post into followers' precomputed feeds) vs **fan-out-on-read** (pull followees' posts at read time and merge).
- **Crux:** celebrities. Fan-out-on-write breaks for users with millions of followers (one tweet = millions of writes). Use a **hybrid**: push for normal users, pull for celebrities, merge at read.
- **Trade-off:** write amplification/storage (push) vs read latency (pull).

## Chat / Messaging (WhatsApp, Messenger, Slack)

- **Clarify:** 1:1 vs group? delivery/read receipts? online presence? message history/retention?
- **Core:** persistent **WebSocket** connections via a gateway; message service persists then routes; a presence service; a queue for offline delivery.
- **Crux:** routing a message to the right connection across a fleet — a connection registry (which user is on which gateway node) plus a pub/sub bus between nodes. Guarantee ordering per conversation and at-least-once delivery with idempotent message IDs.
- **Trade-off:** consistency of ordering vs latency; storing all history vs cost.

## Video Streaming (YouTube, Netflix)

- **Clarify:** upload + playback? live or VOD? resolutions/devices? DAU and catalog size.
- **Core:** upload → **transcode** into multiple bitrates/formats (chunked, e.g., HLS/DASH) → store in object storage → serve via **CDN**; metadata DB for catalog; adaptive bitrate on the client.
- **Crux:** the CDN and transcoding pipeline — playback bandwidth is enormous, so ~99% must be served from edge POPs, not origin. Transcoding is a big async worker-fleet job.
- **Trade-off:** storage cost (many renditions) vs playback quality/startup latency.

## Ride-Hailing (Uber, Lyft)

- **Clarify:** matching latency? surge pricing? ETA accuracy? scale (city-partitioned).
- **Core:** driver location ingestion (frequent GPS updates) into a **geospatial index** (geohash / QuadTree / S2 cells); rider request → find nearby drivers in the cell → match; trip service; pricing service.
- **Crux:** efficient "drivers near me" at high write volume — location updates are write-heavy; partition by geographic cell and keep hot state in memory (Redis geo). Matching must be fast and avoid double-assigning a driver.
- **Trade-off:** location update frequency (accuracy) vs write load; consistency of matching vs speed.

## Typeahead / Search Autocomplete

- **Clarify:** top-k suggestions? personalization? languages? update freshness.
- **Core:** a **trie** of popular prefixes with precomputed top-k at each node, served from memory/cache; a pipeline aggregates query logs to update weights offline.
- **Crux:** sub-100ms lookups at huge QPS — precompute top-k per prefix so a request is a single trie/cache read, not a ranking computation. Rebuild the trie periodically from aggregated query frequencies.
- **Trade-off:** suggestion freshness (rebuild cadence) vs latency/precompute cost.

## Web Crawler

- **Clarify:** scale (pages), politeness, freshness/re-crawl, content types, dedup.
- **Core:** URL frontier (priority + politeness queues) → fetchers → parser → dedup (content hash / bloom filter) → store → extract new links back into the frontier.
- **Crux:** politeness (per-domain rate limits, robots.txt), dedup at scale (bloom filters), and avoiding traps/cycles. It's a massive distributed BFS with backpressure.
- **Trade-off:** crawl freshness/coverage vs politeness and cost.

## File Storage & Sync (Dropbox, Google Drive)

- **Clarify:** file sizes? sync across devices? sharing/permissions? versioning?
- **Core:** **chunk** files (e.g., 4 MB blocks), content-address by hash for dedup, store blocks in object storage, keep a metadata DB (file tree, versions); a sync/notification service pushes deltas to clients.
- **Crux:** efficient sync — only transfer changed chunks (delta sync), and resolve concurrent edits. Dedup via content hashing saves huge storage.
- **Trade-off:** chunk size (dedup granularity vs metadata overhead); consistency of sync vs latency.

## Notification System

- **Clarify:** channels (push/email/SMS)? volume? priority? dedup and rate limits? delivery guarantee.
- **Core:** API → queue → per-channel workers → third-party providers (APNs/FCM, SES, Twilio); a template service; user preference/opt-out store; retry with DLQ.
- **Crux:** reliable async fan-out at scale with retries, deduplication, and respecting user preferences and rate limits — decouple everything through queues.
- **Trade-off:** at-least-once (possible duplicates, needs idempotency) vs exactly-once (expensive).

## Distributed Cache

- **Clarify:** eviction policy? consistency with the DB? size? write policy.
- **Core:** sharded in-memory KV (Redis/Memcached) with **consistent hashing** to place keys; cache-aside reads; TTLs; replication per shard for availability.
- **Crux:** cache invalidation and stampedes — when a hot key expires, thousands of requests hit the DB at once (fix: locks/single-flight, staggered TTLs, request coalescing). Consistent hashing minimizes reshuffling when nodes change.
- **Trade-off:** consistency (write-through vs cache-aside) vs latency; memory vs hit rate.

## Payment / Wallet System

- **Clarify:** consistency requirements (strong!), idempotency, double-spend, reconciliation, currencies.
- **Core:** ledger with **double-entry bookkeeping** (immutable append-only), **idempotency keys** on every request, a state machine per transaction, integration with payment gateways; async reconciliation.
- **Crux:** correctness under retries and concurrency — money demands strong consistency and exactly-once semantics via idempotency keys and transactional ledgers, never eventual consistency for balances.
- **Trade-off:** strong consistency/availability (favor consistency); throughput is secondary to never losing or duplicating money.

## Ticket Booking (Ticketmaster, BookMyShow)

- **Clarify:** concurrency on limited inventory, hold/reservation window, fairness, payment step.
- **Core:** seat inventory with **reservations** (temporary hold + TTL), then confirm on payment; a queue/waiting room for high-demand events.
- **Crux:** preventing double-booking under a thundering herd for the same seats — pessimistic locks or atomic conditional updates on inventory, plus short-lived holds released on timeout. A virtual waiting room sheds load.
- **Trade-off:** strong consistency on seats (no overselling) vs throughput; hold time (UX) vs inventory lockup.

## Leaderboard (gaming, real-time ranking)

- **Clarify:** global vs per-segment? real-time? number of players? top-k vs a player's rank.
- **Core:** a Redis **sorted set** (score → rank) for O(log n) updates and range queries; periodic snapshotting to a DB.
- **Crux:** getting a specific player's rank among millions cheaply — sorted sets give it directly; for extreme scale, approximate/bucketed ranks or sharded leaderboards merged at read.
- **Trade-off:** exact rank vs cost at massive scale; real-time updates vs write load.

## Collaborative Editing (Google Docs)

- **Clarify:** real-time concurrent edits? offline? presence/cursors? history.
- **Core:** WebSocket sessions; conflict resolution via **Operational Transformation (OT)** or **CRDTs**; a document service persisting operations; presence service.
- **Crux:** merging concurrent edits without conflicts or lost updates — OT transforms operations against concurrent ones; CRDTs make operations commutative. Both are hard; know the difference.
- **Trade-off:** OT (central server, simpler data, complex transforms) vs CRDT (peer-friendly, larger metadata).

## Distributed Unique ID Generator

- **Clarify:** sortable by time? throughput? length? multi-datacenter.
- **Core:** **Snowflake**-style 64-bit IDs = timestamp + machine/shard ID + per-ms sequence; generated locally with no coordination.
- **Crux:** uniqueness without a central bottleneck and roughly time-sortable — Snowflake achieves both; watch for clock skew/rollback and running out of the sequence bits per ms.
- **Trade-off:** UUIDs (no coordination, not sortable, 128-bit) vs Snowflake (sortable, needs machine-ID assignment and clock care).

---

## The pattern behind all of them

Notice how few primitives keep reappearing — most designs are a recombination of the same toolkit:

```
Read-heavy?        → cache + CDN + read replicas          (feed, URL shortener, video)
Write-heavy?       → shard + async queue                  (chat, location, analytics)
"Near me" / rank?  → geospatial index / sorted set        (Uber, leaderboard)
Fan-out?           → push vs pull vs hybrid               (feed, notifications)
Correctness-critical? → strong consistency + idempotency  (payments, tickets)
Concurrent edits?  → OT / CRDT                            (Docs)
Unique IDs?        → Snowflake / base62                   (shortener, any ID)
Real-time push?    → WebSockets + pub/sub                 (chat, collab, presence)
Huge fan-out jobs? → worker fleet off a queue             (transcoding, crawling, email)
```

If you can classify a new question into one or two of these buckets in the first minute, you already know the shape of the answer — the rest is clarifying requirements, doing the capacity math, and being honest about the trade-offs.
