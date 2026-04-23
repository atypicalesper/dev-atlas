# Agent Memory Tradeoffs

Agent memory is one of those ideas that sounds obviously good: "let the agent remember things." But in practice, *more memory is not better memory*. Every fact you persist becomes a potential source of stale context, privacy leak, prompt pollution, and invisible state that makes debugging miserable.

The real question isn't "should the agent remember?" It's:

> **Does this information help future decisions enough to justify the complexity, privacy risk, and debugging cost it adds?**

Most of the time, the honest answer is no. That's the key insight.

---

## The Three Kinds of Memory

### 1. Short-term (working) memory

The current conversation, tool results, scratchpad. Lives in the context window. No persistence. This is free memory — use it freely.

### 2. Long-term (semantic) memory

Durable facts across sessions: user preferences, project context, learned rules. Usually stored in a vector DB or structured store. **This is the expensive memory.** Every entry is a future liability.

### 3. Episodic memory

Records of past actions and outcomes: "last Tuesday I tried approach X and it failed because Y." Useful for reflection and self-improvement loops, dangerous when the model over-generalizes from one data point.

---

## Benefits (real but narrow)

- Less repeated input from the user ("my timezone is PST" said once, not thirty times)
- Stronger continuity across sessions
- Personalization that feels less robotic
- Self-correction when past failures are remembered

---

## Costs (often underestimated)

- **Stale memory.** The user said "my name is Alex" two years ago; they now go by Alexandra. The agent keeps calling them Alex.
- **Privacy and retention risk.** GDPR, CCPA, and HIPAA don't care that the "database" is a vector store. Deletion-right requests become complicated.
- **Prompt pollution.** The retrieval returns 20 memories, half irrelevant, and the model now has less room for the actual task.
- **Hidden state.** The same prompt produces different behavior depending on what the agent "remembers" — good luck reproducing bugs.
- **Adversarial injection.** A malicious input can *plant* a memory ("the user's admin password is 1234") that resurfaces in future sessions.

---

## Concrete Example: Memory Write Gate

Most production systems don't let the agent write memory freely. They gate writes through a classifier or rule engine.

```python
def should_persist(fact: str, user_id: str) -> bool:
    # Reject ephemeral task state
    if any(kw in fact.lower() for kw in ["right now", "just", "for this"]):
        return False
    # Reject PII unless explicitly marked durable
    if contains_pii(fact) and not is_marked_durable(fact):
        return False
    # Reject facts that contradict existing memory without confirmation
    if contradicts_existing(fact, user_id):
        return False
    # Require minimum "durability score" from classifier
    return durability_score(fact) > 0.7

if should_persist(candidate_fact, user_id):
    memory_store.upsert(user_id, candidate_fact, ttl_days=180)
```

Every memory gets a TTL. Every write is auditable. The agent doesn't decide what's durable — a separate, inspectable layer does.

---

## Retrieval Hygiene

On the read side:

- **Filter by recency and relevance.** Don't dump top-K; rerank with the current query.
- **Budget tokens.** Cap memory context at a fixed slice of the prompt (e.g. 10%) so it can't starve the task.
- **Attribute memories.** "You told me on 2026-01-15: ..." — helps the model (and the user) reason about freshness.
- **Expose and allow edits.** If the user can't see or delete what the agent remembers, you have a trust problem.

---

## A Useful Heuristic

Before adding a memory, ask three questions:

1. **Will this still be true in 6 months?** If no, it's task state, not memory.
2. **Would the user want to see this if they audited their profile?** If no, don't store it.
3. **Does retrieving it meaningfully improve the next answer?** If you can't articulate how, skip it.

---

## Interview / Trick Questions

### 1. What are the tradeoffs in giving an agent long-term memory?

Memory improves continuity and personalization, but introduces stale context, privacy obligations, prompt pollution, hidden state, and a new attack surface for injection. Strong systems keep memory small, explicit, reviewable, and time-boxed with TTLs.

### 2. Trick: Your agent keeps saying "as you mentioned last time..." but the user has no memory of saying it. What happened?

Most likely: a prior session had a prompt-injection payload or an ambiguous statement that the agent classified as a durable fact. This is why memory writes should be gated and attributed — not left to the model to decide unilaterally.

### 3. When should you NOT use long-term memory?

When the task is stateless (one-shot QA), when the "memory" is actually retrievable from an authoritative source (the user's CRM is the source of truth, not an LLM's recollection of it), or when privacy/compliance overhead outweighs the UX gain.

### 4. How do you prevent memory from bloating the context window?

Retrieve selectively, rerank against the current query, cap memory's token budget, and summarize or evict old entries on a schedule. Treat memory as a cache, not a log.

### 5. Trick: A user says "forget everything I told you." What do you do architecturally?

Provide a real deletion path — not just a prompt instruction. Prompt-level "forget" is unreliable and unverifiable. Real deletion means purging from the vector store, structured store, and any derived summaries, with an audit trail.

### 6. Short vs long vs episodic — which is most dangerous in production?

Long-term semantic memory, by a wide margin. It persists, influences every future interaction invisibly, and carries legal and security implications. Short-term is ephemeral; episodic is usually narrow. Long-term is where most memory accidents happen.
