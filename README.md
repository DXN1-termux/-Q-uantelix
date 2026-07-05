<p align="center">
  <img src="assets/logo/quantelix-logo.svg" alt="[Q]uantelix" width="100%">
</p>

<p align="center">
  <strong>AGENTIC AI. INTELLIGENCE THAT ACTS.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#context-engine">Context Engine</a> •
  <a href="#memory-system">Memory System</a> •
  <a href="#tools">Tools</a> •
  <a href="#termux--flask">Termux</a> •
  <a href="#brand">Brand</a>
</p>

---

[Q]uantelix is a fully autonomous agentic AI platform built from scratch — custom agent orchestration engine, intelligent context management with a **100M token virtual window**, a biological-inspired memory system with decay and merging, a plugin-based tool ecosystem with **20+ built-in tools**, a premium web UI inspired by Cursor + Codex, and a Flask backend for Termux/Android.

## Features

### Core Engine
- **Custom Agent Orchestrator** — Built from scratch. No LangChain, no CrewAI, no wrappers. Plan → execute → evaluate → respond loop with ReAct-style reasoning
- **100M Virtual Context** — Store everything, smartly retrieve what matters. Multi-tier compression (hot → warm → cool → cold) with SQLite persistence
- **Intelligent Sort Engine** — 6-dimension scoring (relevance, recency, importance, frequency, type weight, emotion) with configurable weights
- **Biological Memory System** — Episodic, semantic, procedural, and working memory types with lifecycle management, automatic decay, strengthening on recall, merging of similar memories, and a memory graph

### Interface
- **Premium Web UI** — Dark-themed glassmorphism design with streaming responses, tool call visualization, thinking indicators, and a collapsible sidebar
- **Monaco Editor** — Full code editing with syntax highlighting and diff views
- **Integrated Terminal** — xterm.js-powered terminal emulator
- **Context Indicator** — Real-time visualization of virtual context usage, tier breakdown, and model window utilization

### Tool Ecosystem
- **20+ Built-in Tools** — Code, terminal, git, web, memory, utility, Docker, deploy, database, API
- **Plugin System** — Self-contained tool plugins with JSON Schema, permission declarations, and async execution
- **MCP Bridge** — Connect to external Model Context Protocol servers as tool sources

### Platform
- **BYOK + Free Tier** — Bring your own API key (OpenAI, Anthropic) or use built-in free models (GPT-4o-mini, Claude Haiku)
- **Termux Compatible** — Flask backend runs natively on Android/Termux with auto-port detection
- **Full Brand System** — Custom SVG logos, icons, favicon, OG images, and loading states

---

## Quick Start

### Web App (Node.js)

```bash
# Clone
git clone https://github.com/DXN1-termux/-Q-uantelix.git
cd -Q-uantelix

# Install & run
cd web && npm install && npm run dev
```

Opens at `http://localhost:3000`

### Flask Backend (Termux / Python)

```bash
# Install Python dependencies
pip install flask flask-cors

# Run
python server/app.py
# or
./scripts/start.sh
```

The server auto-finds an available port (3000–8099) and prints the URL.

### Port Checker

```bash
# Check a specific port
python scripts/port-check.py 3000

# Find first available port
python scripts/port-check.py --find

# Full scan (JSON output)
python scripts/port-check.py --json 3000 8099
```

---

## Architecture

```
-Q-uantelix/
├── web/                    # Next.js web application
│   ├── src/app/            # App router pages
│   ├── src/components/     # UI components
│   │   ├── brand/          # Logo components
│   │   ├── chat/           # Chat panel, messages, input, context indicator
│   │   ├── sidebar/        # Collapsible sidebar with history
│   │   └── ui/             # shadcn/ui primitives (20+ components)
│   ├── src/hooks/          # use-agent hook
│   └── src/lib/            # Zustand store, utils
├── agent/                  # Custom agent runtime (TypeScript)
│   ├── core/               # Engine core
│   │   ├── orchestrator.ts # Main agent loop
│   │   ├── planner.ts      # ReAct-style planning
│   │   ├── executor.ts     # Sandboxed tool execution
│   │   ├── context-manager.ts  # 100M virtual context
│   │   ├── context-store.ts    # SQLite persistence
│   │   ├── sort-engine.ts      # Intelligent ranking pipeline
│   │   ├── score-calculator.ts # 6-dimension scoring
│   │   ├── memory-system.ts    # Biological memory with graph
│   │   ├── token-counter.ts    # Per-model token counting
│   │   ├── deduplicator.ts     # Near-duplicate detection
│   │   ├── importance-classifier.ts  # Content importance
│   │   ├── event-bus.ts        # Real-time state events
│   │   └── types.ts            # All TypeScript types
│   ├── tools/              # Tool implementations
│   │   ├── code/           # File read/write/edit/search
│   │   ├── terminal/       # Command/script execution
│   │   ├── git/            # Git operations
│   │   ├── web/            # Search, fetch, browse
│   │   ├── memory/         # Remember, recall, forget
│   │   ├── util/           # UUID, JSON, base64, port checker
│   │   ├── docker/         # Container management
│   │   ├── deploy/         # Vercel, Netlify
│   │   ├── db/             # SQLite operations
│   │   └── api/            # HTTP, GraphQL, endpoint testing
│   ├── plugins/            # Tool registry, MCP bridge
│   └── providers/          # LLM providers (OpenAI, Anthropic)
├── server/                 # Flask backend
│   ├── app.py              # Flask app with API routes
│   └── requirements.txt    # Python dependencies
├── assets/logo/            # Brand SVGs (4 variants)
├── scripts/                # Dev scripts, port checker, start.sh
└── docs/                   # Documentation
```

---

## Context Engine

The context engine bridges a **100M token virtual window** with the actual LLM context window (128k–1M depending on model).

### How it works

1. **Everything is stored** — every message, tool output, and document goes into SQLite with tiered chunks (hot/warm/cool/cold)
2. **Sort engine scores** — when you send a message, every piece of stored context is scored on 6 dimensions:
   - **Relevance** (0.30) — How related to the current query
   - **Recency** (0.20) — Exponential decay based on age
   - **Importance** (0.25) — How significant when created (decisions > filler)
   - **Frequency** (0.10) — How often recalled/referenced
   - **Type Weight** (0.10) — Code > system > assistant > casual
   - **Emotional Signal** (0.05) — Errors, decisions, breakthroughs
3. **Best pieces selected** — Top-ranked context that fits in the model's token budget
4. **Assembled into prompt** — System prompt (5%) → Retrieved context (40%) → Recent messages (25%) → Working memory (20%) → Reserve (10%)

### Token Budget Allocation

| Slot | % of Window | What goes here |
|------|-------------|----------------|
| System prompt | 5% | Agent instructions |
| Retrieved context | 40% | Best-scored memories + chunks |
| Recent messages | 25% | Last N raw messages |
| Working memory | 20% | Current tool results, diffs |
| Reserve | 10% | Buffer for response |

---

## Memory System

Biological-inspired memory with four types, automatic lifecycle management, and a graph structure.

### Memory Types

| Type | What it stores | Decay rate | Example |
|------|---------------|------------|---------|
| **Episodic** | Events, conversations | 0.95/day | "User asked about Docker at 3pm" |
| **Semantic** | Facts, knowledge | 0.99/week | "User prefers TypeScript" |
| **Procedural** | How-to, workflows | 0.999/month | "Deploy command: vercel --prod" |
| **Working** | Current task context | 0.8/hour | "Editing file X to fix bug Y" |

### Memory Lifecycle

- **Strengthening** — Every recall boosts strength by +0.1 (capped at 1.0)
- **Decay** — Unused memories fade at type-specific rates
- **Merging** — Similar memories (>80% similarity within 24h) auto-merge with parent/child links
- **Archiving** — Memories below 0.1 strength are archived (not deleted)

### Memory Graph

Memories form a graph with typed edges:
- **related** — Semantic connections between memories
- **caused** — "I did X because of Y" links
- **temporal** — Consecutive messages auto-linked
- **merged** — Parent/child relationships from merging

---

## Tools

### Built-in Tools (20+)

| Category | Tools |
|----------|-------|
| **Code** | `read_file`, `write_file`, `edit_file`, `search_code`, `list_directory` |
| **Terminal** | `execute_command`, `execute_script` |
| **Git** | `git_status`, `git_diff`, `git_log`, `git_commit`, `git_branch`, `git_checkout`, `git_push` |
| **Web** | `web_search`, `read_url` |
| **Memory** | `remember`, `recall`, `forget` |
| **Utility** | `now`, `uuid`, `read_json`, `write_json`, `base64_encode`, `base64_decode`, `check_port`, `find_open_port` |
| **Docker** | `docker_ps`, `docker_exec`, `docker_compose_up`, `docker_build` |
| **Deploy** | `deploy_vercel`, `deploy_netlify` |
| **Database** | `query_sqlite`, `list_tables`, `create_table` |
| **API** | `http_request`, `graphql_query`, `test_endpoint` |

### Plugin System

Each tool is a self-contained plugin:

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  tags: string[];
  input_schema: JSONSchema;
  permissions: { filesystem?: string[]; network?: boolean; env?: string[] };
  execute: (args: Record<string, any>, ctx: ToolContext) => Promise<ToolOutput>;
}
```

Register tools via the `ToolRegistry`:
```typescript
registry.register(myCustomTool);
registry.registerMany([tool1, tool2, tool3]);
```

### MCP Bridge

Connect external Model Context Protocol servers:
```typescript
const bridge = new MCPBridge(registry);
bridge.addServer({ name: "my-server", url: "http://localhost:8080" });
await bridge.syncAll(); // Pulls all tools from MCP servers
```

---

## Termux / Flask

The Flask backend provides a lightweight alternative to the Next.js app, optimized for Termux/Android.

### Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Health check + server info |
| `/api/port/check?port=3000` | GET | Check if a port is available |
| `/api/port/find?start=3000&end=8099` | GET | Find first available port |
| `/api/chat` | POST | Send message (SSE streaming response) |
| `/api/memory/stats` | GET | Memory system statistics |
| `/api/memory/search?q=...` | GET | Search through stored memories |

### Termux Setup

```bash
# Install Termux packages
pkg install python nodejs git

# Install Flask
pip install flask flask-cors

# Run
./scripts/start.sh
```

`start.sh` auto-detects Termux, finds an open port, and starts the appropriate backend.

---

## Brand

- **Name**: [Q]uantelix
- **Tagline**: AGENTIC AI. INTELLIGENCE THAT ACTS.
- **Colors**: Dark `#0d1117`, Cyan `#38bdf8` / `#22d3ee`, Purple `#a855f7` / `#c084fc`
- **Logo**: Custom SVG with cyan/purple gradient bracket icon + magnifying circle

### Logo Variants

| Variant | File | Use |
|---------|------|-----|
| Full lockup | `assets/logo/quantelix-logo.svg` | Headers, banners |
| Icon mark | `assets/logo/icon-mark.svg` | App icon, favicon |
| Horizontal | `assets/logo/quantelix-horizontal.svg` | Navbar, compact spaces |
| Monochrome | `assets/logo/quantelix-monochrome.svg` | Light backgrounds |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui (20+ components) |
| Code Editor | Monaco Editor |
| Terminal | xterm.js |
| State Management | Zustand |
| Agent Engine | Custom TypeScript (no frameworks) |
| Database | SQLite (via child_process) |
| LLM Providers | OpenAI API, Anthropic API |
| Backend (optional) | Python Flask with CORS |

---

## License

Proprietary — see [License](./License).

---

<p align="center">
  <img src="assets/logo/icon-mark.svg" alt="[Q]uantelix" width="48">
  <br>
  <em>Built with by DXN1</em>
</p>
