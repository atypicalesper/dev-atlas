# Local LLM Hardware Sizing and Model Selection

Choosing a local model is mostly a hardware-matching problem.

The practical question is not:

```
What is the biggest model I can technically load?
```

It is:

```
What model gives acceptable quality, latency, and memory usage on my machine?
```

---

## The Three Main Constraints

- RAM or VRAM
- throughput (tokens/sec)
- context length

You need all three to feel acceptable in practice.

---

## Very Rough Model Sizing

Quantized local models are usually discussed in families like:

| Model size | Typical use |
|---|---|
| 1B–3B | very fast, lightweight assistants, edge devices |
| 7B–8B | strong sweet spot for local chat/code |
| 13B–14B | noticeably better, but more demanding |
| 32B+ | stronger quality, much heavier serving needs |
| 70B | premium local quality, serious hardware requirement |

For many developers, `7B–8B` is the first truly practical tier.

---

## CPU vs GPU vs Apple Silicon

### CPU

- easiest to access
- slower
- fine for smaller quantized models

### GPU

- best for throughput
- especially important for larger models and serving multiple users

### Apple Silicon

- very strong local inference story because of unified memory
- often better than people expect for solo local use

---

## Model Selection by Task

### General assistant

Choose a solid instruct model in the 7B–8B range first.

### Coding

Prefer coder-tuned models such as Qwen Coder or DeepSeek Coder families when available.

### Reasoning-heavy tasks

Reasoning-oriented models can be excellent, but they are often slower and more verbose.

### Embeddings

Do not use a chat model as an embedding model. Pick a dedicated embedding model.

---

## What Usually Goes Wrong

- choosing a model too large for comfortable throughput
- optimizing only for benchmark quality, ignoring latency
- forgetting context length memory costs
- using the wrong model family for the task

---

## Good Practical Rule

Start with:

- one small fast model
- one main 7B–8B model
- one embedding model

Then upgrade only if your actual use case needs it.

---

## Interview Answer

### How do you choose a local model?

Match the model to the hardware, task, and latency target. For most solo developers, a quantized 7B–8B instruct model is the best starting point, with dedicated coder or embedding models added for specialized workloads.
