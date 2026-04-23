# Eval Pipelines in CI

Traditional software has a well-understood quality gate: unit tests, integration tests, a green CI, then deploy. LLM systems break that model. A prompt tweak, a model version bump, or a retrieval index refresh can produce outputs that are still *syntactically valid* and *superficially fine* — but subtly worse. No test fails. No error is thrown. The regression ships.

Eval pipelines in CI exist to close that gap. If prompts, tools, or retrieval logic can change behavior — and they can — evaluation belongs in the delivery pipeline, not in someone's notebook.

---

## Why LLM Regressions Are Sneaky

A classic LLM regression looks like:

- answers are 8% less accurate on your golden set
- the model picks the wrong tool 15% of the time on ambiguous inputs
- JSON outputs occasionally include a trailing comma
- refusal rate on harmless prompts went up
- latency doubled because you switched to a reasoning model
- cost tripled because you added a tool-use loop

Unit tests catch *none* of this. That's what evals are for.

---

## What to Evaluate

A production eval suite should cover at least these axes:

| Axis | Example metric |
|---|---|
| Task success | Exact-match or LLM-judge score on golden set |
| Schema correctness | % outputs that parse against JSON schema |
| Retrieval relevance | Precision@k, nDCG on a labeled RAG set |
| Tool-call correctness | % correct tool + % correct args |
| Safety / refusal | False-refusal rate on benign prompts; compliance rate on harmful ones |
| Latency | p50, p95 end-to-end and per-hop |
| Cost | Tokens per task, tool-call count |

The trap is optimizing one metric and silently regressing another. Track them together.

---

## The CI Pipeline Pattern

Keep CI evals small and high-signal — they run on every PR, so they must finish in minutes, not hours.

```
┌─────────────────────────────────────────────────────────┐
│  PR opened                                              │
├─────────────────────────────────────────────────────────┤
│  1. Deterministic checks (lint, unit, schema parse)     │
│  2. Smoke eval (20–50 high-signal cases)                │
│  3. Focused eval on changed workflows (~200 cases)      │
│  4. Compare to baseline (last main commit)              │
│  5. Fail if any metric regresses past threshold         │
│  6. Post a diff report to the PR as a comment           │
└─────────────────────────────────────────────────────────┘

Scheduled (nightly / weekly):
  Full eval suite (1000+ cases, adversarial, long-tail)
```

The split matters: CI evals catch obvious regressions fast. The nightly suite catches subtle drift you only notice in aggregate.

---

## Concrete Example: a GitHub Actions eval step

```yaml
# .github/workflows/evals.yml
name: LLM evals
on: [pull_request]

jobs:
  smoke-eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - name: Run smoke eval
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          python evals/run.py --suite smoke --out results.json
      - name: Compare to baseline
        run: |
          python evals/compare.py \
            --current results.json \
            --baseline s3://evals/main/latest.json \
            --threshold 0.02 \
            --comment-to-pr
```

The `--threshold 0.02` means: fail if task success drops more than 2 percentage points vs main. Tighter thresholds on safety metrics, looser on stylistic ones.

---

## Concrete Example: a scored eval case

```python
# evals/cases/rag_support.py
cases = [
    {
        "id": "returns-policy-30d",
        "input": "What is your return policy?",
        "expected_facts": ["30 days", "unworn", "original tags"],
        "must_not_contain": ["contact support"],  # we have self-serve docs
        "max_latency_ms": 3000,
        "max_cost_usd": 0.002,
    },
]

def score(case, output):
    fact_hits = sum(1 for f in case["expected_facts"] if f.lower() in output.text.lower())
    fact_score = fact_hits / len(case["expected_facts"])
    compliance = not any(bad in output.text.lower() for bad in case["must_not_contain"])
    latency_ok = output.latency_ms <= case["max_latency_ms"]
    cost_ok = output.cost_usd <= case["max_cost_usd"]
    return {
        "fact_score": fact_score,
        "compliance": compliance,
        "latency_ok": latency_ok,
        "cost_ok": cost_ok,
    }
```

Each case produces a structured score. Aggregate means and pass rates per axis are what CI compares.

---

## Good Eval Set Design

- **Representative of real traffic.** Sample from production logs (scrubbed) rather than inventing hypotheticals.
- **Versioned like code.** Eval cases live in git. Changing a case is a reviewable PR.
- **Includes adversarial inputs.** Prompt injections, ambiguous asks, out-of-scope requests.
- **Clear pass/fail where possible.** LLM-judge scoring is useful but noisy — prefer exact-match or rubric scoring for deterministic signals.
- **Balanced.** If 80% of your eval is "happy path", 80% of your confidence is on happy path. Weight the long tail.

---

## Cost Reality

Running evals costs real money. A 200-case smoke suite on every PR at $0.01/case is $2/PR. Fine for a team of 10, prohibitive for a team of 200.

Mitigations:
- cache eval responses by `(prompt_hash, model_version)` — only rerun cases whose inputs or context changed
- run smoke on every PR, full suite on merge-to-main
- use smaller judge models for scoring rubrics where possible

---

## Interview / Trick Questions

### 1. Why aren't unit tests enough for LLM systems?

Because LLM regressions rarely manifest as errors. A worse-but-valid answer passes every type check, schema validation, and exception handler. You need evaluation harnesses that score *quality*, not just *correctness*.

### 2. Trick: your eval suite has 5000 cases and runs for an hour. What's wrong?

It's too slow for CI. Split into a fast smoke suite (20–50 cases, <2 min) that gates PRs, and a full nightly suite. Or cache eval outputs so unchanged cases don't rerun.

### 3. How do you prevent eval-set contamination (gaming the metric)?

Keep a held-out eval set that engineers cannot see. Rotate eval cases over time. Avoid letting prompt authors also author the evals that grade their prompts.

### 4. You added a new tool and safety metrics dropped. What happened?

Likely: the new tool opened an action surface that adversarial prompts can exploit, or the model started using it in situations where refusal was correct. Run targeted safety evals covering the new tool's capability before merging.

### 5. Trick: an LLM-as-judge says your outputs are 95% correct. Do you trust it?

Partially. LLM judges are noisy and biased (they often prefer verbose, confident-sounding answers). Calibrate with a human-labeled subset, disclose judge model and version, and prefer rubric-based scoring over binary "good/bad" judgments.

### 6. When should an eval failure *warn* vs *fail* the CI?

Fail on hard correctness and safety regressions (task success below threshold, refusal rate change, cost budget exceeded). Warn on stylistic or judge-scored drift that needs human interpretation. Hard-failing on every squishy metric trains the team to ignore CI.

### 7. Why put evals in CI at all?

Because LLM systems regress silently. A code-level green build says the program runs. An eval gate says the program *still does its job well enough* after your prompt tweak, model upgrade, or retrieval index swap. Without that gate, quality drifts invisibly until a user complains.
