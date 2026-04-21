# Rate Limiting in Practice

Rate limiting is not only about blocking abuse. It also protects shared capacity and keeps one noisy client from degrading everyone else.

---

## Common Algorithms

- fixed window
- sliding window / sliding log
- token bucket
- leaky bucket

In interviews, the most practical answer is usually token bucket or sliding window depending on fairness needs.

---

## Where to Apply Limits

- API gateway
- edge / CDN
- application middleware
- per-tenant service boundary
- downstream integration client

Real systems often have multiple limits at different layers.

---

## Useful Dimensions

- per IP
- per user
- per API key
- per tenant
- per route

`100 req/min` globally is rarely enough by itself.

---

## Practical Considerations

- return clear `429 Too Many Requests`
- include retry guidance if possible
- separate auth endpoints from read endpoints
- use stricter limits on expensive operations
- keep counters in Redis or a gateway-native store

---

## Interview Answer

### How would you implement rate limiting?

Choose the algorithm based on fairness and simplicity, store counters in a low-latency shared store like Redis, and apply limits at the right identity boundary such as user, API key, or tenant. In practice, the hard part is policy design and distributed coordination, not just incrementing a counter.
