# Replication and Failover

Replication improves availability and read scale. It does not magically make writes free or consistency perfect.

---

## Replication Basics

Primary database:

- accepts writes
- often serves some reads

Replicas:

- receive changes from the primary
- usually serve reads
- may be promoted during failover

---

## Synchronous vs Asynchronous

### Synchronous replication

Primary waits for replica acknowledgement before confirming commit.

Pros:

- stronger durability guarantees

Cons:

- higher write latency
- availability tradeoff if replicas are unhealthy

### Asynchronous replication

Primary commits locally and replicas catch up later.

Pros:

- lower write latency

Cons:

- replica lag
- possible data loss window on failover

---

## Read Replicas

Read replicas help when reads dominate and your application can tolerate some staleness.

Common issues:

- user writes data then immediately reads stale replica
- analytics query overloads a replica
- lag spikes under write bursts

Typical fix for read-after-write paths:

- route those reads to primary for a short time window

---

## Failover

Failover means promoting a replica when the primary becomes unavailable.

Questions to ask:

- how is failure detected
- who promotes the replica
- how fast do clients reconnect
- what happens to in-flight writes

Database failover is not finished when the replica is promoted. The app must also reconnect cleanly.

---

## Interview Answer

### Why use replication?

To improve availability, disaster recovery posture, and read scalability.

### What is the main tradeoff?

The core tradeoff is consistency versus latency and availability. Asynchronous replication is faster but allows lag and some failover data loss risk, while synchronous replication reduces that risk at the cost of write latency and resilience.
