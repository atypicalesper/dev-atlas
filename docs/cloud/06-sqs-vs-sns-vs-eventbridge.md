# SQS vs SNS vs EventBridge

These three services solve different messaging problems.

```
SQS          = queue / pull / work distribution
SNS          = pub-sub / push / fan-out
EventBridge  = event bus / routing / filtering / SaaS integration
```

Use the one that matches your delivery model first, then optimize details.

---

## SQS

SQS is for decoupling producers from workers.

### When to use it

- background jobs
- retries and dead-letter handling
- absorbing traffic spikes
- worker pools processing at their own pace

### Key properties

- consumer pulls messages
- messages are hidden during processing with a visibility timeout
- at-least-once delivery
- order only guaranteed with FIFO queues

Typical flow:

```text
API → SQS → worker fleet → DB / external APIs
```

---

## SNS

SNS is for fan-out.

### When to use it

- send one event to many subscribers
- trigger multiple downstream systems
- mobile push, email, SMS, or HTTP notifications

### Key properties

- producer pushes once to a topic
- SNS pushes to subscribers
- subscribers can be SQS, Lambda, HTTP endpoints, email, SMS

Common pattern:

```text
Order created
  → SNS topic
  → email service
  → analytics queue
  → billing lambda
```

If durability and retries matter, fan out from SNS into SQS queues, not directly into fragile HTTP consumers.

---

## EventBridge

EventBridge is an event router and integration bus.

### When to use it

- many event producers and consumers
- routing by structured rules
- cross-account event flows
- SaaS integrations
- scheduled events

### Key properties

- events are JSON envelopes
- rules can match on source, detail type, account, or payload fields
- targets include Lambda, Step Functions, SQS, SNS, ECS tasks, and more

Example:

```json
{
  "source": "payments.service",
  "detail-type": "payment.failed",
  "detail": {
    "merchantId": "m-123",
    "region": "ap-south-1"
  }
}
```

Then route only failed payments for a certain region to a specific workflow.

---

## How to Choose

### Use SQS when

- one logical job should be processed by one worker
- backpressure and retries matter
- consumers should control pace

### Use SNS when

- one message should be broadcast to many subscribers
- fan-out is the main need

### Use EventBridge when

- routing rules and decoupled event contracts matter
- events come from many services or SaaS systems
- you want filtering without custom code

---

## Very Common Combinations

### SNS → SQS

Best for durable fan-out.

Each consumer gets its own queue, retry policy, and scaling behavior.

### EventBridge → SQS / Lambda

Best for event routing plus downstream processing.

### API → SQS, domain event → EventBridge

One service can use both:

- SQS for async work
- EventBridge for domain notifications

---

## Tradeoffs

| Service | Strength | Weakness |
|---|---|---|
| SQS | durable buffering, worker decoupling | not native broadcast |
| SNS | simple fan-out | less expressive routing |
| EventBridge | flexible routing, event bus model | not a worker queue replacement |

---

## Interview Answer

### SQS vs SNS vs EventBridge?

Use SQS for work queues, SNS for push-based pub-sub fan-out, and EventBridge for event routing between many producers and consumers with filtering rules. In practice, they often complement each other rather than compete.
