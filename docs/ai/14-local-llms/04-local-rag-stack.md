# Local RAG Stack

One of the most useful local AI setups is not just a local chat model, but a fully local RAG pipeline:

```text
documents
  → local embedding model
  → local vector store
  → local retriever
  → local LLM
```

That gives you privacy and no per-query API cost.

---

## Typical Components

### Local LLM

- Ollama
- llama.cpp
- MLX
- vLLM for heavier serving

### Local Embedding Model

- `nomic-embed-text`
- `mxbai-embed-large`
- sentence-transformer style local embedding models

### Local Vector Store

- Chroma
- FAISS
- Qdrant self-hosted
- LanceDB

---

## Why It’s Useful

- documents never leave your machine or network
- good for internal docs and sensitive material
- predictable cost profile
- works offline if the full stack is local

---

## Design Tradeoffs

### Pros

- privacy
- cost control
- offline use

### Cons

- more ops than cloud APIs
- local models may be weaker than top hosted models
- embedding quality still matters a lot

---

## Practical Advice

- keep chunking and retrieval quality as first-class concerns
- use the same embedding model for indexing and querying
- test retrieval separately from generation
- start small before optimizing for throughput

Local RAG systems often fail because retrieval quality is weak, not because the local generator is bad.

---

## Interview Answer

### What is a local RAG stack?

A local RAG stack runs the full retrieval-augmented generation pipeline on local or self-hosted infrastructure: local embeddings, local vector storage, local retrieval, and a local LLM. It is useful when privacy, offline capability, or API-cost control matter more than using the strongest hosted model.
