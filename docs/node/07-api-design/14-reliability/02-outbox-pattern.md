# Outbox Pattern

The outbox pattern solves a very common problem:

```
Write DB row
and publish event
as one reliable unit
```

Without it, systems often lose events in the gap between "DB commit succeeded" and "message publish failed."

---

## The Problem

Naive flow:

1. insert order in DB
2. publish `order.created` event

If step 1 succeeds and step 2 fails, the database is correct but downstream consumers never hear about the event.

---

## The Pattern

Inside the same DB transaction:

1. write the business row
2. write an outbox row describing the event

Later, a separate publisher process reads unsent outbox rows and sends them to Kafka, SNS, SQS, or EventBridge.

---

## Why It Works

The DB transaction guarantees the business change and event intent are recorded together.

Publishing becomes an eventually consistent delivery process instead of a fragile in-request side effect.

---

## Important Detail

The publisher can still send duplicates, so consumers should be idempotent.

The outbox pattern gives you "do not lose the event intent," not magically "exactly once everywhere."

---

## Interview Answer

### What is the outbox pattern?

It is a reliability pattern where the service writes both the business state change and a pending event record in the same database transaction. A background publisher then reads and emits those events, preventing the classic lost-event bug between DB commit and message publish.
