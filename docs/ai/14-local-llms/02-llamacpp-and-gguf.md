# llama.cpp and GGUF

If Ollama is the easiest way to run local models, `llama.cpp` is the lower-level engine that made a lot of local inference practical in the first place.

It is one of the most important pieces of the local LLM ecosystem.

---

## What is llama.cpp?

`llama.cpp` is a fast C/C++ inference runtime for transformer models, especially quantized models running on:

- CPU
- Apple Silicon
- CUDA GPUs
- Metal
- Vulkan and other backends

It became popular because it made running useful open models possible on consumer hardware.

---

## What is GGUF?

`GGUF` is a model file format used heavily with `llama.cpp`.

Think of it as a packaging format for local inference that stores:

- model weights
- tokenizer data
- metadata
- quantization details

Why it matters:

- portable for local runtimes
- works well with CPU and mixed CPU/GPU inference
- common in Ollama, LM Studio, and raw `llama.cpp` workflows

---

## Why GGUF Became Popular

For local use, you often care about:

- low RAM / VRAM usage
- easy distribution
- good quantized quality
- broad hardware support

GGUF fits that world better than raw training checkpoints.

---

## Common Quantization Labels

You will often see names like:

- `Q4_K_M`
- `Q5_K_M`
- `Q8_0`

The rough mental model:

- lower-bit quantization = smaller and faster
- higher-bit quantization = better quality but more memory

For many local setups, `Q4` or `Q5` variants are the practical sweet spot.

---

## Typical llama.cpp Flow

```bash
# download a GGUF model from Hugging Face or another source

# run it
./llama-cli -m ./models/qwen2.5-7b-instruct-q4_k_m.gguf -p "Explain vector databases"
```

Server mode:

```bash
./llama-server -m ./models/llama-3.2-3b-instruct-q4_k_m.gguf --port 8080
```

That gives you a local inference server without needing a cloud provider.

---

## Ollama vs Raw llama.cpp

### Ollama

- easier model management
- simpler CLI
- friendlier for most developers

### llama.cpp

- more control
- closer to the runtime
- useful when tuning performance or custom deployments

Good mental model:

`Ollama` is often the developer-friendly product layer.

`llama.cpp` is often the engine underneath the ecosystem.

---

## When to Reach for It

Use `llama.cpp` directly when:

- you want tight control over quantized model files
- you care about CPU-first or Apple Silicon optimization
- you want lightweight self-hosting without a bigger serving stack

---

## Interview Answer

### What are llama.cpp and GGUF?

`llama.cpp` is a lightweight inference runtime optimized for running open LLMs efficiently on local hardware, especially quantized models. `GGUF` is the model file format commonly used with it, designed to package quantized weights and metadata for practical local deployment.
