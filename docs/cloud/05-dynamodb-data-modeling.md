# DynamoDB Data Modeling

DynamoDB modeling is not "design the perfect normalized schema." It is:

```
List access patterns first
→ choose partition/sort keys
→ use GSIs only for missing query paths
```

If you start from entities instead of queries, you usually end up fighting the database.

---

## Core Constraints

- Queries are fast when they stay inside one partition key
- Sort keys give ordering and range queries inside that partition
- GSIs create alternate lookup paths
- Cross-partition scans are expensive and usually a smell

Good DynamoDB design is about avoiding scans.

---

## Single-Table Mental Model

Store multiple entity types in one table and encode meaning into keys.

Example e-commerce table:

| PK | SK | Type |
|---|---|---|
| `USER#123` | `PROFILE#123` | user profile |
| `USER#123` | `ORDER#2026-04-21#9001` | user order |
| `ORDER#9001` | `ITEM#1` | order line item |
| `ORDER#9001` | `PAYMENT#1` | payment |

Benefits:

- one request can fetch a whole aggregate
- predictable access patterns
- fewer joins in application code

---

## Start with Access Patterns

Example product requirements:

1. Get user profile by user id
2. List a user's orders newest first
3. Get order details by order id
4. List pending orders for a merchant

Possible design:

```text
PK = USER#<userId>
SK = PROFILE#<userId> | ORDER#<createdAt>#<orderId>

GSI1PK = ORDER#<orderId>
GSI1SK = ORDER#<orderId>

GSI2PK = MERCHANT#<merchantId>#STATUS#PENDING
GSI2SK = <createdAt>#<orderId>
```

Every key exists to answer a query.

---

## Choosing Partition Keys

Good partition keys:

- evenly distribute writes
- align with primary read pattern
- avoid hot keys

Bad partition keys:

- `status = pending`
- `country = us`
- current timestamp bucket for all traffic

If one partition gets most traffic, you will throttle even when table-wide capacity looks fine.

---

## Sort Key Patterns

Useful sort key shapes:

- `TYPE#ID`
- `TYPE#TIMESTAMP`
- `TYPE#STATE#TIMESTAMP`
- hierarchical prefixes like `COMMENT#POST#<postId>#<createdAt>`

Sort keys let you:

- query latest records
- filter by prefix with `begins_with`
- model one-to-many relationships

Newest-first pattern:

```text
SK = ORDER#2026-04-21T10:15:00Z#9001
```

---

## GSIs: Use Sparingly but Intentionally

GSIs are great, but every additional index adds:

- write amplification
- more storage
- more operational complexity

Use a GSI when a required access pattern cannot be answered by the base table keys.

Examples:

- lookup by email
- list by merchant and status
- fetch by external payment id

---

## Common Patterns

### Time-Series Data

Partition by tenant or device, sort by timestamp.

```text
PK = DEVICE#42
SK = READING#2026-04-21T09:00:00Z
```

### Adjacency List

Represent graph edges or relationships with composite keys.

### Sparse Index

Only some items project to a GSI because only they contain indexed attributes. Useful for queues and dashboards.

### Write Sharding

When a key gets too hot, spread writes across suffixes:

```text
PK = ORDER_EVENTS#2026-04-21#03
```

Then fan out reads when needed.

---

## Transactions and Consistency

- DynamoDB transactions are useful for small multi-item invariants
- Strongly consistent reads only work on the base table and LSIs, not GSIs
- Most systems stay eventually consistent and design for that explicitly

If you need heavy relational constraints across many rows, DynamoDB may not be the best fit.

---

## Practical Red Flags

- "We'll scan and filter in the app"
- "We'll add a GSI later for every new query"
- "One partition key for the whole system"
- "We modeled entities first and queries later"

---

## Interview Answer

### How do you model data in DynamoDB?

Start from concrete read and write patterns, design partition and sort keys to satisfy the hottest queries without scans, then add the smallest number of GSIs needed for alternate lookups. Watch for hot partitions, write amplification, and eventual consistency tradeoffs.
