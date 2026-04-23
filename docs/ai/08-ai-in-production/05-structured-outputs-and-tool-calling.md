# Structured Outputs and Tool Calling

Most production headaches with LLMs trace back to the same root cause: **you asked for text when you needed data.** Free-form prose is flexible and great for humans, but miserable to validate, route, or plug into a downstream system. Structured outputs and tool calling are the two primitives that turn an LLM from a conversational toy into a reliable component in a larger system.

If you're building anything that has to *act* on model output programmatically — route a ticket, call an API, update a record, render a form — you almost certainly want structure, not prose.

---

## Structured Outputs: Schema over Scraping

Structured outputs constrain the model to return JSON (or another format) that matches a declared schema. The model can still "think" in free-form during its reasoning, but the final answer conforms to a shape you defined.

### Why this matters

Before structured outputs, the canonical pipeline was: (1) prompt the model for JSON, (2) parse the response, (3) handle "I'd be happy to help! Here's your JSON:" prefixes, (4) handle trailing markdown fences, (5) handle occasional invalid JSON, (6) retry.

With structured outputs: the model *cannot* return invalid JSON. The constraint is enforced at decoding time.

### Typical use cases

- **Extraction** — pull fields out of unstructured input (invoices, emails, PDFs)
- **Classification** — label an input into a known taxonomy
- **Routing** — decide which downstream system handles a request
- **UI generation** — produce form state, table data, dashboard config
- **Summarization into records** — turn a meeting transcript into `{ action_items, decisions, owners }`

---

## Concrete Example: Extraction with a Schema

```python
from anthropic import Anthropic
from pydantic import BaseModel

class SupportTicket(BaseModel):
    category: str  # "billing" | "technical" | "account"
    priority: str  # "low" | "medium" | "high" | "urgent"
    summary: str
    customer_sentiment: str  # "neutral" | "frustrated" | "angry"

client = Anthropic()
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=[{
        "name": "extract_ticket",
        "description": "Extract structured fields from a support email",
        "input_schema": SupportTicket.model_json_schema(),
    }],
    tool_choice={"type": "tool", "name": "extract_ticket"},
    messages=[{"role": "user", "content": email_body}],
)

ticket = SupportTicket.model_validate(response.content[0].input)
# ticket is now a typed object, guaranteed to match the schema
```

The `tool_choice` forces the model to call the extraction tool — used here as a schema-enforcement trick rather than a true tool call.

---

## Tool Calling: Models That Can Act

Tool calling (also called "function calling") lets the model request that the *application* invoke an external capability on its behalf. The model doesn't actually call your database — it emits a structured request saying "please call `search_docs` with these arguments," and your code decides whether to honor it.

This turns the model from a text generator into a **planner** that reasons about when to act.

Common tools:

- `search_docs` — retrieval
- `get_account` — read from DB
- `create_ticket` — write
- `send_email` — side effect
- `calculator` — deterministic arithmetic (models are bad at math)

---

## Concrete Example: A Tool Loop

```python
tools = [
    {
        "name": "get_order_status",
        "description": "Look up an order's current status and tracking info.",
        "input_schema": {
            "type": "object",
            "properties": {"order_id": {"type": "string"}},
            "required": ["order_id"],
        },
    },
]

messages = [{"role": "user", "content": "Where's my order #A-8821?"}]

while True:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason != "tool_use":
        break

    tool_use = next(b for b in response.content if b.type == "tool_use")
    result = run_tool(tool_use.name, tool_use.input)  # your code
    messages.append({
        "role": "user",
        "content": [{
            "type": "tool_result",
            "tool_use_id": tool_use.id,
            "content": json.dumps(result),
        }],
    })
```

Key points:
- The loop exits when the model stops requesting tools.
- Every tool result is validated and logged before being fed back.
- `run_tool` is a thin dispatcher that enforces per-tool argument schemas and policy.

---

## Design Principles

### Keep tool surfaces small and explicit

Ten tools with clear, non-overlapping purposes beat one mega-tool with a `command` string. The model's accuracy at picking the right tool drops sharply as the menu grows — aim for ≤15 tools per agent.

### Validate everything

```python
def run_tool(name, args):
    schema = TOOL_SCHEMAS[name]
    validated = schema.model_validate(args)  # raises on bad input
    if not policy_allows(name, validated, current_user):
        return {"error": "permission_denied"}
    return TOOL_IMPLS[name](validated)
```

Never trust the model's arguments. Schema-validate, policy-check, then execute.

### Separate read from write

Read tools are safe to retry, cache, and parallelize. Write tools need idempotency keys, rate limits, and often human approval for destructive actions. Treat them as fundamentally different categories.

### Log exhaustively

Every tool call is a boundary event worth logging: tool name, arguments, result, latency, cost. When something goes wrong, the tool-call trace is what you'll read first.

---

## When NOT to Use Tool Calling

- **Deterministic tasks** — if a regex or SQL query does the job, use the regex or SQL query
- **Hot paths** — tool loops add latency and cost; prefer a single-shot structured output
- **Low-variance tasks** — if you always need the same 3 pieces of data, fetch them up front

Tool calling pays off when the model *genuinely needs to decide* whether to act — not when you've hidden deterministic logic behind an LLM for no reason.

---

## Interview / Trick Questions

### 1. Why prefer structured outputs over prompting for JSON?

Prompted JSON is a best-effort request: the model usually complies, occasionally doesn't, and you end up with regex hacks and retry loops. Structured outputs enforce schema at decoding time — the output *cannot* be invalid JSON. It eliminates a whole class of parsing bugs.

### 2. Trick: you've defined a tool with 20 optional arguments. What's the problem?

The model will struggle to pick which ones to include, and argument accuracy drops. Large schemas also bloat the system prompt (every tool definition counts against your context window). Split into narrower tools or make fewer arguments required-with-defaults.

### 3. Structured outputs vs tool calling — when do you use which?

Structured outputs for "give me this data in this shape, one shot." Tool calling for "decide what to do next, possibly iteratively." Routing a ticket → structured output. Answering "what's my order status?" → tool calling.

### 4. Your tool is called `update_user`. A prompt injection tries to abuse it. What protects you?

Not the model — never the model. Protection lives in `run_tool`: schema validation of arguments, authorization checks against the *real* authenticated user (not whoever the model thinks the user is), rate limiting, and for destructive ops, human-in-the-loop confirmation. The model is untrusted input; the tool layer is the security boundary.

### 5. Trick: the model keeps calling `search_docs` five times in a row with nearly identical queries. What's happening?

Usually one of: (1) the tool is returning low-quality results and the model is scrambling to find an answer, (2) the tool description is ambiguous so the model doesn't know when it has "enough," or (3) there's a loop bug in your agent that isn't surfacing the results properly. Cap tool-call iterations and log retries to diagnose.

### 6. How do you handle a tool that occasionally fails with a transient error?

Return a structured error result (`{"error": "timeout", "retryable": true}`) rather than throwing. The model can decide whether to retry or fall back. For critical writes, wrap the tool implementation in your own retry-with-backoff — don't rely on the model to remember to retry.

### 7. Why prefer structured outputs in production?

Because they turn model responses into something machines can validate and automate safely. They reduce parsing fragility, improve correctness, let you type the downstream code, and make incidents much easier to debug — `{field: value}` is inspectable in ways `"Sure, here's a summary..."` is not.
