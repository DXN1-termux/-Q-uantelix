# Contributing to [Q]uantelix

## Development Setup

```bash
# Clone
git clone https://github.com/DXN1-termux/-Q-uantelix.git
cd -Q-uantelix

# Web app
cd web && npm install && npm run dev

# Flask backend (optional)
pip install flask flask-cors
python server/app.py
```

## Project Structure

- `agent/` — Agent engine (TypeScript, no frameworks)
- `web/` — Next.js web app (React, Tailwind, shadcn/ui)
- `server/` — Flask backend (Python)
- `assets/` — Brand SVGs
- `scripts/` — Dev utilities
- `docs/` — Documentation

## Adding a Tool

1. Create file in `agent/tools/<category>/`
2. Define `ToolDefinition` with name, schema, permissions, execute function
3. Export from `agent/index.ts`
4. See `docs/TOOLS.md` for the full API reference

## Code Style

- TypeScript strict mode
- No inline comments
- No one-letter variable names
- Consistent with existing patterns
- Minimal, focused changes

## Commit Messages

Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code restructuring
- `test:` adding tests

## License

All contributions are under the project's proprietary license.
