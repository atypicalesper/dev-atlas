# Prompt Injection Defenses

Prompt injection is the LLM version of hostile input trying to redirect system behavior.

The right mindset is:

```
Treat model inputs and retrieved content as untrusted
```

---

## Defense Layers

### 1. Limit capability

Do not give the model broad write access if it only needs read access.

### 2. Separate instructions from data

System rules should be structurally distinct from user and retrieved content.

### 3. Validate tool use

Even if the model asks for a tool call, validate arguments and policy before execution.

### 4. Sanitize and score context

Retrieved webpages, PDFs, tickets, or emails can contain hostile instructions.

### 5. Monitor suspicious behavior

Look for:

- repeated prompt leakage probes
- unusual tool requests
- attempts to access unrelated data

---

## Key Reality

There is no single perfect prompt that "solves" injection.

The strongest defense is layered system design:

- scoped permissions
- validated tool calls
- adversarial evals
- human approval for risky actions

---

## Interview Answer

### How do you defend against prompt injection?

Use defense in depth: treat inputs and retrieved context as untrusted, keep model permissions narrow, validate tool calls, isolate high-risk actions behind policy checks or human approval, and continuously test the system with adversarial prompts.
