# [Q]uantelix

**AGENTIC AI. INTELLIGENCE THAT ACTS.**

[Q]uantelix is a fully autonomous agentic AI platform with a custom agent orchestration engine, a plugin-based tool ecosystem, and a premium web interface inspired by Cursor + Codex.

## Features

- **Custom Agent Engine** — Built-from-scratch orchestrator with planner, executor, context management, and memory
- **Thousands of Tools** — Plugin system supporting code, terminal, git, web, databases, cloud/DevOps, APIs, and more
- **Premium UI** — Dark-themed, glassmorphism design with Monaco editor, integrated terminal, and streaming responses
- **BYOK + Free Tier** — Bring your own API key (OpenAI, Anthropic, Google) or use built-in free models
- **Full Brand System** — Custom SVG logo, icons, favicon, OG images, and loading states

## Quick Start

```bash
# Install dependencies
cd web && npm install

# Run development server
npm run dev
```

## Architecture

```
-Q-uantelix/
├── web/           # Next.js web app (React, Tailwind, shadcn)
├── agent/         # Custom agent runtime (TypeScript)
│   ├── core/      # Orchestrator, planner, memory, context
│   ├── tools/     # Tool implementations
│   ├── plugins/   # Tool registry, plugin loader
│   └── providers/ # LLM providers (OpenAI, Anthropic)
├── assets/        # Brand design files
│   └── logo/      # All logo variations
├── desktop/       # (future) Tauri wrapper
└── docs/          # Documentation
```

## Agent Engine

The orchestrator runs a `plan → execute → evaluate → respond` loop with states:
- `idle → thinking → planning → executing_tool → evaluating → responding → idle`

Supports:
- ReAct-style planning with structured tool calls
- Context window management with auto-summarization
- Ephemeral + persistent memory system
- Parallel tool execution
- Sandboxed tool execution

## Tools

Built-in categories: code, terminal, git, web, memory, utility

Plugin categories: databases, cloud/DevOps, APIs, data, AI/ML, communication, security, testing, network, media, browser

Each tool is a self-contained plugin with JSON Schema inputs, permission declarations, and an async execute function.

## Brand

- **Name**: [Q]uantelix
- **Tagline**: AGENTIC AI. INTELLIGENCE THAT ACTS.
- **Colors**: Dark `#0d1117`, Cyan `#38bdf8` / `#22d3ee`, Purple `#a855f7` / `#c084fc`
- **Logo**: Custom SVG with bracket icon + gradient magnifying circle

## License

Proprietary — see [License](./License).

---

*Built with ❤️ by DXN1*
