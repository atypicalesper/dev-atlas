# Eval Pipelines in CI

If prompts, tools, or retrieval logic can change behavior, then evaluation needs to be part of the delivery pipeline.

---

## Why Run Evals in CI

Because LLM regressions often look like:

- lower answer quality
- worse tool selection
- broken formatting
- new safety failures

Traditional unit tests do not catch these well.

---

## What to Evaluate

- task success
- schema correctness
- retrieval relevance
- tool-call correctness
- refusal / safety behavior
- cost and latency budgets

---

## Practical CI Pattern

1. run deterministic checks first
2. run a focused eval set on changed workflows
3. compare scores to baseline
4. fail or warn if thresholds regress

Keep CI evals small and high-signal. Larger exploratory evals can run on schedule.

---

## Good Eval Set Design

- representative of real tasks
- versioned like code
- includes adversarial and edge cases
- has clear pass/fail semantics where possible

---

## Interview Answer

### Why put evals in CI?

Because LLM systems can regress without traditional code-level failures. CI evals provide an automated quality gate for output quality, tool use, safety, latency, and cost so changes are caught before they reach production.
