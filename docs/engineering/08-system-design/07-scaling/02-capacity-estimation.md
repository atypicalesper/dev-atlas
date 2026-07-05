# Back-of-the-Envelope Capacity Estimation

Every system design interview opens with the same hidden test: before you draw a single box, can you turn "design Twitter" into concrete numbers — requests per second, storage per year, bandwidth, and how many servers that implies? Interviewers use this to check whether you'll build the *right-sized* system rather than reaching for Kafka to serve a thousand users. The good news is that capacity estimation is a small set of memorized constants plus multiplication; the goal is a defensible order-of-magnitude answer in two minutes, not precision. This page is the cheat sheet: the numbers to memorize, the four quantities to always compute, and a worked example.

State your assumptions out loud and round aggressively — nobody expects exact figures, they expect you to reason to the right power of ten.

---

## Numbers every engineer should know

Latency constants (Jeff Dean's classic list, rounded to what you actually need):

```
L1 cache reference                    ~1 ns
Main memory (RAM) reference           ~100 ns
Read 1 MB sequentially from RAM       ~10 µs      (0.01 ms)
SSD random read                       ~100 µs     (0.1 ms)
Read 1 MB from SSD                    ~1 ms
Round trip within a datacenter        ~0.5 ms
Read 1 MB from disk (HDD)             ~20 ms
Round trip across continents          ~150 ms
```

Takeaways to quote: **memory is ~100,000× faster than a cross-region round trip**, disk seeks are ~1000× slower than RAM, and anything user-facing lives or dies on network round trips — which is *why* caching and CDNs dominate scaling.

Throughput / sizing rules of thumb:

```
Seconds in a day               ≈ 86,400  →  round to 100,000 (10^5)
1 million/day                  ≈ 12 writes/second
1 billion/day                  ≈ 12,000/second

Single app server              ~1,000–10,000 RPS  (workload dependent)
Single SQL primary             ~10,000 reads/s, ~1,000–10,000 writes/s
Redis instance                 ~100,000 ops/s
Char / ASCII                   1 byte
UUID                           16 bytes
Typical DB row (few columns)   ~1 KB (assume this when unsure)
Timestamp / int64              8 bytes
```

The "86,400 → 100,000" simplification is the single most useful trick: **daily volume ÷ 100,000 ≈ average RPS**, and you multiply by 2–10× for peak.

---

## The four quantities to compute

For almost any design, estimate these in order. Each is a one-line multiplication once you have the inputs.

```
1. TRAFFIC  (QPS)
   daily active users × actions/user/day ÷ 86,400  = average QPS
   peak QPS ≈ average × 2 to × 10   (state your peak factor)
   split into read QPS vs write QPS using the read:write ratio

2. STORAGE
   writes/day × bytes/write × retention(days)  = total bytes
   (add replication factor ×3, and index/overhead ×1.2–2)

3. BANDWIDTH
   read QPS × response size   = read bandwidth (bytes/s)
   write QPS × request size   = write bandwidth
   (media/video dominates — a photo is ~10^5–10^6× a text row)

4. MEMORY (cache)
   to cache the hot 20%: daily reads × 20% × object size
   (the 80/20 rule: caching the hot 20% of data serves ~80% of reads)
```

Then translate to machines: **servers ≈ peak QPS ÷ per-server RPS**, rounded up with headroom.

---

## Worked example: a Twitter-like service

Assume the interviewer says "design Twitter." You propose:

```
Assumptions (say these out loud):
  - 300M daily active users (DAU)
  - Each user reads their feed ~20×/day, posts ~0.1 tweets/day
  - Read:write ratio ≈ 200:1 (very read-heavy — typical for feeds)
  - Average tweet = 300 bytes text (ignore media for the text tier)
  - Retention: keep tweets ~5 years
```

**1. Traffic (QPS)**

```
Reads  = 300M × 20 / 86,400  ≈ 6M / 86,400        ≈ 70,000 read QPS (avg)
Writes = 300M × 0.1 / 86,400 ≈ 30M / 86,400        ≈ 350 write QPS (avg)
Peak (×3)  → ~210,000 read QPS,  ~1,000 write QPS
```

→ Read-dominated. Conclusion: cache hard, fan reads across replicas/edge; writes fit comfortably on a modest sharded write tier.

**2. Storage**

```
Tweets/day     = 300M × 0.1                = 30M tweets/day
Bytes/day      = 30M × 300 bytes           ≈ 9 GB/day (text only)
Per year       ≈ 9 GB × 365                ≈ 3.3 TB/year
5 years        ≈ 16 TB   →  ×3 replication ≈ 50 TB
```

→ Text is *small*. A single sharded cluster holds years of tweets. (Media — photos/video — would be 100–1000× larger and belongs in object storage + CDN, sized separately.)

**3. Bandwidth**

```
Read BW  = 70,000 QPS × 300 bytes  ≈ 21 MB/s  (text feed payloads)
Write BW = 350 QPS × 300 bytes     ≈ 0.1 MB/s
```

→ Trivial for text; the real bandwidth story is always media, so call that out.

**4. Cache memory**

```
Cache the hot 20% of daily reads:
  daily read objects ≈ 6M feeds, but the working set is "recent tweets."
  Cache ~1 day of tweets: 30M × 300 bytes ≈ 9 GB  → fits in a Redis cluster.
```

**Machines (rough):**

```
Read tier:  210,000 peak QPS ÷ ~5,000 RPS/server ≈ 45 app servers (+ headroom)
DB:         shard by user_id; write QPS is low, so shard for storage/hotspots
Cache:      a Redis cluster holding the hot ~10 GB working set
```

The whole point: two minutes of arithmetic told you this is a **read-heavy, cache-and-replica problem with tiny text storage and a separate media pipeline** — which shapes every design decision that follows.

---

## Common estimation mistakes

- **Forgetting peak vs average.** Traffic is bursty; always multiply average by a peak factor (2–10×) and design for peak.
- **Ignoring the read:write ratio.** It decides your entire architecture — read-heavy → caching/replicas; write-heavy → sharding/async. Ask for it first.
- **Under-counting media.** One image ≈ 200 KB–2 MB; one minute of video ≈ 10–50 MB. Media dwarfs text and needs object storage + CDN, not your database.
- **Skipping replication and overhead.** Multiply raw storage by ~3 for replication and add 20–100% for indexes and metadata.
- **False precision.** `86,400` is `~100,000`. `300M × 20` is `~6 billion`. Round to powers of ten and keep moving — the interviewer wants the reasoning, not the decimals.

---

## The one-screen cheat sheet

```
QPS       = DAU × actions/day ÷ 100,000        (then ×2–10 for peak)
Storage   = writes/day × size × days × 3        (×3 = replication)
Bandwidth = QPS × payload size                  (media dominates)
Cache RAM = hot 20% of reads × object size      (80/20 rule)
Servers   = peak QPS ÷ per-server RPS           (round up, add headroom)

Memorize: 1 day ≈ 10^5 s · row ≈ 1 KB · DC round-trip ≈ 0.5 ms ·
          cross-region ≈ 150 ms · SQL ≈ 10^4 QPS · Redis ≈ 10^5 ops/s
```
