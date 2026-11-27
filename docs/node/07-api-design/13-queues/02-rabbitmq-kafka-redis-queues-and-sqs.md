# RabbitMQ, Kafka, Redis Queues, and SQS

RabbitMQ, Kafka, Redis queues, and SQS serve different workloads: task distribution, replayable event streams, application jobs, and managed cloud queues. Choosing a broker whose delivery model does not match the workload creates avoidable operational friction.

---

## Quick Mental Model

### RabbitMQ

Great when you need:

- queue semantics
- routing flexibility
- acknowledgements
- per-message handling patterns

RabbitMQ fits work distribution with broker-driven routing.

### Kafka

Great when you need:

- durable append-only event streams
- replay
- high throughput
- ordered consumption within partitions

Kafka is an event log and streaming platform with queue-like consumer groups.

### Redis queues / BullMQ

Great when you need:

- background jobs in a Node-heavy stack
- delayed jobs
- retries
- cron-like scheduling

BullMQ is an application job runner backed by Redis.

### SQS

Great when you need:

- managed queueing on AWS
- simple worker pipelines
- minimal broker operations

SQS is a durable managed cloud queue with a deliberately smaller routing model.

---

## Comparison Table

| System | Best shape | Ordering | Replay | Operational model |
|---|---|---|---|---|
| RabbitMQ | Task routing and worker queues | Possible, but not the main superpower | Limited by queue semantics | You operate the broker |
| Kafka | Event streaming and logs | Per partition | Core feature | You operate cluster / managed service |
| Redis queues / BullMQ | App-level jobs | Usually queue order, practical not absolute at scale | No durable replay like Kafka | Simpler, Redis-backed |
| SQS | Cloud worker queue | Standard: best effort, FIFO: ordered per group | No event-log replay model | Fully managed by AWS |

---

## When to Choose Each

### RabbitMQ

Choose RabbitMQ when:

- one producer may route to many queue shapes
- you need exchanges and routing keys
- task acknowledgement and redelivery patterns matter
- you want classic work queues more than event logs

Typical examples:

- notification fan-out with different consumers
- task dispatch with priority or routing patterns
- legacy enterprise integrations

### Kafka

Choose Kafka when:

- events must be replayable
- many consumers need independent offsets
- throughput is very high
- ordered streams by entity key matter

Typical examples:

- analytics pipelines
- activity/event streams
- CDC ingestion
- event-driven microservices

### Redis queues / BullMQ

Choose BullMQ when:

- you are in a Node.js app
- you want fast app-level job processing
- the workload is operationally local to your service
- Redis is already acceptable

Typical examples:

- email sending
- thumbnail generation
- webhook retries
- report generation

### SQS

Choose SQS when:

- you want a durable managed queue on AWS
- your consumers can poll
- operational simplicity matters more than advanced broker features

Typical examples:

- background workers
- decoupled service pipelines
- burst absorption between systems

---

## Delivery Semantics

All of these systems push you toward idempotent consumers.

Why:

- retries happen
- redelivery happens
- consumers crash mid-work
- acknowledgements can race with failures

Design as if a message may be processed more than once.

Typical patterns:

- idempotency key
- dedup table
- upsert instead of blind insert
- side-effect log

---

## Ordering Reality

Ordering is usually not global.

More realistic:

- Kafka gives ordering within a partition
- SQS FIFO gives ordering within a message group
- RabbitMQ ordering can be affected by multiple consumers and redelivery
- BullMQ ordering is practical but shaped by retries, delays, and concurrency

If the business invariant depends on order, design that explicitly around keys and partitioning.

---

## Retry and Failure Design

Ask these questions up front:

- what errors should retry
- how many times
- with what backoff
- where do poison messages go
- how will we observe stuck consumers

Each queue design needs explicit retry, observability, and dead-letter policies.

---

## Interview Answer

### RabbitMQ vs Kafka?

RabbitMQ is usually chosen for task queues and flexible broker-side routing. Kafka is chosen for durable event streaming, replay, and high-throughput append-only logs. RabbitMQ feels like a broker for messages to process. Kafka feels like a shared event history to consume.

### When would you choose BullMQ over Kafka or SQS?

When the problem is application-level background job processing inside a Node.js system and you want delayed jobs, retries, worker concurrency, and simple operational shape with Redis rather than a full streaming platform or a cloud queue abstraction.
