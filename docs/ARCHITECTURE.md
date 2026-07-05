# [Q]uantelix Architecture

## Overview

[Q]uantelix is an autonomous agentic AI platform with:
- Custom agent orchestration engine
- Plugin-based tool ecosystem (thousands of tools)
- Premium web UI (Cursor + Codex inspired)
- BYOK + Free tier models
- Full custom brand system

## Directory Structure

```
-Q-uantelix/
├── web/           # Next.js web application
├── agent/         # Custom agent runtime (TypeScript)
│   ├── core/      # Orchestrator, planner, memory, context
│   ├── tools/     # Tool implementations (code, terminal, git, web, memory, util)
│   ├── plugins/   # Tool registry, plugin loader, MCP bridge
│   └── providers/ # LLM provider abstraction (OpenAI, Anthropic, Google)
├── assets/        # Brand design files (logos, icons, illustrations)
├── desktop/       # (future) Tauri desktop wrapper
└── docs/          # Architecture, API, and plugin development docs
```

## Agent Engine

The orchestrator runs a plan→execute→evaluate→respond loop:

1. **User Input** → Sent to orchestrator
2. **Plan** → LLM decides which tools to use, in what order
3. **Execute** → Tools run in sandboxed environment
4. **Evaluate** → Results feed back to LLM for next step
5. **Respond** → Final answer streamed to UI

### States
`idle → thinking → planning → executing_tool → evaluating → responding → idle`

## Tool System

Tools are plugins. Each tool has:
- Name, description, category, tags
- JSON Schema for inputs/outputs
- Permission declarations (filesystem, network, env)
- Execute function

Built-in categories: code, terminal, git, web, memory, utility
Plugin categories: databases, cloud/devops, APIs, data, AI/ML, communication, security, etc.

## Brand

- **Name**: [Q]uantelix
- **Tagline**: AGENTIC AI. INTELLIGENCE THAT ACTS.
- **Colors**: Dark `#0d1117`, Cyan `#38bdf8`, Purple `#a855f7`
- **Logo**: Custom SVG with bracket icon + gradient circle + "uantelix" text
