# [Q]uantelix Architecture

## Overview

[Q]uantelix is an autonomous agentic AI platform with four major subsystems:

1. **Agent Engine** — Custom orchestrator with ReAct planning, tool execution, and context management
2. **Context Engine** — 100M virtual window with intelligent sort/retrieval
3. **Memory System** — Biological-inspired with types, decay, merging, and graph
4. **Tool Ecosystem** — 20+ built-in tools with plugin architecture and MCP bridge

## System Architecture

```
User Input
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                            │
│  Plans actions → Executes tools → Evaluates → Responds       │
└────────┬────────────────────────────────┬───────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐            ┌─────────────────────┐
│  CONTEXT MANAGER │            │     EXECUTOR         │
│  100M virtual    │            │  Sandboxed tool      │
│  window          │            │  execution with      │
│  ↕               │            │  timeouts            │
│  Sort Engine     │            └─────────────────────┘
│  (6-dim score)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      CONTEXT STORE (SQLite)                   │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐             │
│  │ Memories  │  │ Context Chunks│  │ Sort Weights│            │
│  │ (4 types) │  │ (hot/warm/   │  │ (6 dims)   │            │
│  │ + graph   │  │  cool/cold)  │  │ tunable    │            │
│  └──────────┘  └──────────────┘  └────────────┘             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      MEMORY SYSTEM                           │
│                                                               │
│  Episodic: events, conversations                             │
│  Semantic: facts, knowledge                                  │
│  Procedural: how-to, workflows                               │
│  Working: current task (fast decay)                          │
│                                                               │
│  Lifecycle: create → recall (strengthen) → decay → archive   │
│  Merging: similar memories combine with parent/child links   │
│  Graph: traversal, causal links, temporal connections        │
└─────────────────────────────────────────────────────────────┘
```

## Agent Loop

```
IDLE → THINKING → PLANNING → EXECUTING_TOOL → EVALUATING → (loop or) RESPONDING → IDLE
```

Each state emits events via `EventBus` → UI updates in real-time.

## Context Engine

### Virtual Window (100M tokens)

No single LLM supports 100M tokens. The system stores everything in SQLite and smartly selects what to inject into the model's actual window.

### Sort Pipeline

```
All Context (100M tokens)
    │
    ▼
1. FILTER — Remove duplicates, expired, low-value
    │
    ▼
2. SCORE — 6 dimensions per piece:
   - Relevance (0.30) — query similarity
   - Recency (0.20) — exponential decay
   - Importance (0.25) — content significance
   - Frequency (0.10) — recall count
   - Type Weight (0.10) — content category
   - Emotion (0.05) — urgency markers
    │
    ▼
3. RANK — Sort by composite score
    │
    ▼
4. SELECT — Top-N that fit in model budget
    │
    ▼
5. ORDER — System → Retrieved → Recent → Working → Response
```

### Token Budget

| Slot | % | Content |
|------|---|---------|
| System | 5% | Agent instructions |
| Retrieved | 40% | Best-scored from sort engine |
| Recent | 25% | Last N raw messages |
| Working | 20% | Tool results, current diffs |
| Reserve | 10% | Buffer for response |

## Memory System

### Types & Decay

| Type | Half-life | Purpose |
|------|-----------|---------|
| Working | ~4 hours | Current task context |
| Episodic | ~14 hours | Events, conversations |
| Semantic | ~70 hours | Facts, knowledge |
| Procedural | ~700 hours | How-to, workflows |

### Memory Graph

```
Episodic: "User asked about Docker"
    ├── related → Semantic: "User uses Docker for deployment"
    ├── caused → Procedural: "docker build -t app ."
    └── temporal → Episodic: "User then asked about Vercel"
```

## Tool System

### Built-in Categories

- **code** — File read/write/edit/search/list
- **terminal** — Command and script execution
- **git** — Status, diff, log, commit, branch, checkout, push
- **web** — Search, fetch URL
- **memory** — Remember, recall, forget
- **utility** — UUID, JSON, base64, port checker
- **docker** — PS, exec, compose, build
- **deploy** — Vercel, Netlify
- **database** — SQLite query, list tables, create table
- **api** — HTTP requests, GraphQL, endpoint testing

### Plugin Format

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  tags: string[];
  input_schema: JSONSchema;
  permissions: {
    filesystem?: string[];
    network?: boolean;
    env?: string[];
  };
  execute: (args, context) => Promise<ToolOutput>;
}
```

### MCP Bridge

Connects to external MCP-compatible servers as additional tool sources.

## Providers

| Provider | Models | Streaming |
|----------|--------|-----------|
| OpenAI | GPT-4o, GPT-4o-mini, o3-mini | ✅ SSE |
| Anthropic | Claude Sonnet 4, Claude Haiku 3.5 | ✅ SSE |

## Brand

- **Name**: [Q]uantelix
- **Tagline**: AGENTIC AI. INTELLIGENCE THAT ACTS.
- **Colors**: Dark `#0d1117`, Cyan `#38bdf8`, Purple `#a855f7`
- **Logo**: Bracket icon `[Q]` with gradient magnifying circle
- **Variants**: Full lockup, icon mark, horizontal, monochrome
