# BullMQ and Job Queues

Job queues exist for work that should not happen inline with the user request.

Examples:

- send email
- process image
- fan out webhooks
- retry flaky third-party calls

BullMQ is a popular Redis-backed queue for Node.js.

---

## Why Use a Queue

Without a queue:

- API latency rises
- failures from downstream systems hit user requests directly
- burst traffic can overwhelm dependencies

With a queue:

```text
API → enqueue job → return fast
worker → process job asynchronously
```

---

## BullMQ Strengths

- retries with backoff
- delayed jobs
- repeatable jobs
- concurrency control
- dead-letter-style handling through failed job inspection/requeue flows

---

## Basic Flow

```typescript
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('email', { connection: { host: 'localhost', port: 6379 } });

await emailQueue.add('send-welcome-email', { userId: 'u-123' });

new Worker('email', async job => {
  if (job.name === 'send-welcome-email') {
    await sendWelcomeEmail(job.data.userId);
  }
});
```

---

## Queue Design Questions

- what is the job payload
- is the job idempotent
- what should be retried
- how do you handle poison jobs
- what are concurrency and rate limits

Queues are reliability systems, not just background execution tools.

---

## Interview Answer

### When would you use BullMQ?

Use BullMQ when a Node.js system needs durable background job processing with retries, scheduling, and worker concurrency, and Redis is already an acceptable operational dependency. Design jobs to be idempotent because queue delivery is not exactly-once.
