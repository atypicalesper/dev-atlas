# Agent Memory Tradeoffs

Agent memory sounds attractive, but more memory is not automatically better.

The real question is:

```
What information helps future decisions enough to justify added complexity and risk?
```

---

## Types of Memory

### Short-term memory

Current conversation or current task state.

### Long-term memory

Facts preserved across sessions, such as preferences or durable project context.

### Episodic memory

Past actions, outcomes, and lessons learned.

---

## Benefits

- less repeated user input
- better continuity
- stronger personalization

---

## Costs

- stale or incorrect memory
- privacy and retention risk
- irrelevant memory polluting prompts
- harder debugging when behavior depends on hidden state

---

## Good Practice

- store only durable, high-value facts
- make memory reviewable and editable
- separate transient task context from durable user preferences
- expire or revalidate uncertain memory

---

## Interview Answer

### What are the tradeoffs in agent memory?

Memory improves continuity and personalization, but it also introduces privacy risk, stale context, and debugging complexity. Strong systems keep memory small, explicit, and reviewable instead of turning every past interaction into permanent hidden state.
