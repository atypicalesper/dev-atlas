# Rate Limiting in Practice

Rate limiting is not just "block the abusers." It's the mechanism that protects **shared capacity** — keeping one noisy client (or one buggy retry loop) from degrading service for everyone else. In a multi-tenant system, the absence of rate limiting is a bug: sooner or later, one customer's infinite loop will take your infrastructure down.

The production question is rarely "should I rate limit?" It's "at which layer, against which identity, using which algorithm, and with what fallback when the limit is hit?"

---

## The Four Classic Algorithms

### Fixed window

Count requests per time bucket (e.g. per minute). Reset at the boundary.

```
[10:00:00 - 10:00:59]  count = 0 → 100. Reject once full.
[10:01:00 - 10:01:59]  count resets to 0.
```

Simple. Has a nasty edge: a client can send 100 requests at `10:00:59.9` and another 100 at `10:01:00.1` — 200 in 200 ms despite a "100/min" limit. This is the **boundary burst** problem.

### Sliding window (log or counter)

Track request timestamps and count those within the last N seconds. More accurate, no boundary burst. Costs more memory — you store every request or at least a counter per sub-bucket.

### Token bucket

The bucket holds up to `B` tokens and refills at rate `R` tokens per second. Each request consumes one token; if the bucket is empty, reject (or queue). Allows bursts up to `B`, sustained rate up to `R`. This is what most API gateways actually use.

```
bucket: 100 tokens capacity, refill 10/sec
user sends 50 requests in 1 second → fine, 50 tokens left
user sends another 60 over 5 seconds → bucket refills at 10/s,
   so the client rides the refill rate after the initial burst
```

### Leaky bucket

Requests enter a queue that drains at a constant rate. Forces a *smooth* output rate regardless of input burstiness. Used when downstream systems need steady traffic (not just a cap).

---

## Which Algorithm When

| Goal | Algorithm |
|---|---|
| Simple, low-stakes | Fixed window |
| Fairness, no boundary burst | Sliding window |
| Allow bursts within a rate budget | Token bucket (most common) |
| Smooth out spiky traffic | Leaky bucket |

Interviewer's heuristic: start with **token bucket**, defend the choice with "allows bursts but caps sustained rate," move to sliding window if they push on fairness.

---

## Where to Apply Limits (layers, not one place)

Real systems rate-limit at multiple layers, each catching a different failure mode:

1. **Edge / CDN** (Cloudflare, CloudFront) — absorb volumetric attacks before they hit your app
2. **API gateway** (Kong, AWS API Gateway, Envoy) — per-API-key and per-route limits
3. **Application middleware** — per-user, per-tenant, per-endpoint business rules
4. **Per-service client** — bound outbound calls to third parties so a runaway loop doesn't nuke your rate budget with a vendor

A single global limit is rarely enough. Layer them.

---

## Useful Identity Dimensions

Limits should match the *fairness unit* you care about:

- Per IP — broad, cheap, weak (IPs are shared behind NAT/CGNAT)
- Per user — fair across devices for a signed-in user
- Per API key — what B2B customers expect
- Per tenant — the right unit in multi-tenant systems
- Per route — heavier limits on expensive endpoints
- Per (tenant + route) — most granular, typical in production

"`100 req/min` globally" is rarely the right design. Usually it's something like: per API key: 1000/min; per IP on unauthenticated routes: 60/min; per tenant on expensive endpoint: 30/min.

---

## Concrete Example: Token Bucket in Redis

A distributed token bucket needs atomic check-and-decrement. Use a Lua script:

```lua
-- rate_limit.lua
-- KEYS[1] = bucket key
-- ARGV[1] = capacity, ARGV[2] = refill_rate (tokens/sec), ARGV[3] = now_ms

local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call('HMGET', KEYS[1], 'tokens', 'last_refill')
local tokens = tonumber(data[1]) or capacity
local last_refill = tonumber(data[2]) or now

-- refill based on elapsed time
local elapsed = (now - last_refill) / 1000
tokens = math.min(capacity, tokens + elapsed * refill_rate)

if tokens < 1 then
  redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last_refill', now)
  redis.call('EXPIRE', KEYS[1], 3600)
  return 0  -- rejected
end

tokens = tokens - 1
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last_refill', now)
redis.call('EXPIRE', KEYS[1], 3600)
return 1  -- allowed
```

```ts
// Fastify middleware
import { createClient } from 'redis';
const redis = createClient();
const script = await fs.promises.readFile('rate_limit.lua', 'utf-8');

app.addHook('preHandler', async (req, reply) => {
  const key = `rl:${req.user.id}:${req.routerPath}`;
  const allowed = await redis.eval(script, {
    keys: [key],
    arguments: ['100', '10', String(Date.now())], // 100 burst, 10/sec refill
  });
  if (allowed === 0) {
    reply.header('Retry-After', '1');
    return reply.code(429).send({ error: 'rate_limited' });
  }
});
```

Lua keeps the check-and-decrement atomic inside Redis — no race between "read tokens" and "write tokens."

---

## Response Design

When you reject, help the client do the right thing:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 12
Content-Type: application/json

{"error": "rate_limited", "retry_after_s": 12}
```

- `429` status is standard
- `Retry-After` tells the client when to try again (seconds or HTTP date)
- `RateLimit-*` headers let SDKs auto-throttle before hitting the ceiling
- A JSON body lets non-header-aware clients parse the error

Clients that respect `Retry-After` coexist peacefully with your system. Clients that don't are the ones you'll block harder.

---

## Handling the Inevitable: Retries and Queues

A rate limiter without **client-side backoff** just turns one 429 into a thundering herd of retries. Paired design:

- Clients use exponential backoff with jitter
- Idempotent requests can be auto-retried safely; non-idempotent must surface the error
- Server-side, expensive operations can be queued instead of rejected — return `202 Accepted` with a status URL

---

## Practical Considerations

- **Whitelist internal callers.** Your own services shouldn't rate-limit each other under the same rules as untrusted clients.
- **Stricter limits on expensive ops.** `POST /render-video` deserves a tighter budget than `GET /me`.
- **Auth endpoints need their own regime.** Brute-force login attempts want *much* tighter limits than normal traffic.
- **Log rejections with enough context to diagnose.** Which key, which route, why rejected — future-you will need this.
- **Test the limit itself.** Load-test that the limiter works under concurrency and that Redis is actually the bottleneck you think it is.

---

## Interview / Trick Questions

### 1. Walk me through how you'd implement rate limiting for a multi-tenant API.

Token bucket per (tenant, route), counters in Redis, atomic Lua script for check-and-decrement, 429 responses with `Retry-After` and `RateLimit-*` headers. Different buckets for read vs write, tighter limits on expensive endpoints. Layer a CDN/edge limit underneath for volumetric protection.

### 2. Fixed window vs sliding window — what's the concrete problem with fixed window?

Boundary burst. A client can legally fire `limit` requests at `59.999` seconds and another `limit` at `0.001` seconds — `2 × limit` in a millisecond despite a "1× per window" limit. Sliding window (or token bucket) eliminates the boundary.

### 3. Trick: you add rate limiting and clients start retrying aggressively on 429. Overall load goes up. What happened?

You rate-limited the server but not the client behavior. Without exponential backoff with jitter, a 429 becomes a retry spike, which generates more 429s, which generate more retries — a retry storm. Fix by returning `Retry-After`, publishing a client SDK that respects it, and adding circuit-breaking on repeat offenders.

### 4. Why is rate limiting per-IP often a bad idea in 2026?

Because IP sharing via CGNAT, corporate NAT, and mobile carriers means one "IP" can be thousands of unrelated users. Per-IP limits either legitimately block a dorm/office or are set so loose they catch nothing. Prefer identity-based limits (per user, per API key) for anything authenticated.

### 5. Token bucket has `capacity=100, refill=10/s`. Client sends 100 in 0.1s, then 10/s forever. What happens?

First burst: allowed (bucket full). After that, the bucket is empty and refilling at 10/s. The client's sustained 10/s matches exactly — every request finds one token waiting. If they went to 11/s, they'd drift into rejections.

### 6. Trick: your Redis-backed limiter works fine at 1k rps but falls over at 50k rps. What's wrong?

Likely one of: (a) non-atomic check-and-decrement causing over-admission under contention, (b) single Redis node saturated — needs clustering or sharded keys by user, (c) network latency to Redis becoming the dominant cost — consider a local token bucket per app instance with periodic reconciliation.

### 7. When is a 429 the wrong response code?

When the client is exceeding a *quota* (monthly plan limit, for instance) rather than a burst rate. Quota exhaustion is `402 Payment Required` or a custom business error — `429` implies "try again later" and a quota-exhausted user cannot try again later without upgrading.

### 8. How would you implement rate limiting, in one answer?

Pick token bucket for flexibility, store counters in a low-latency shared store (Redis or the gateway's native state), apply limits at the fairness boundary that matches your business (per user or per tenant), layer it at CDN + gateway + app, respond with 429 + `Retry-After`, and pair it with client-side backoff. The hard part is policy design and distributed coordination — not the counter.
