# Agent Context Vault

A local web UI for managing **skills** and **prompts** for your coding agents (Claude Code, Codex).

- Browse the bundled library at `assets/`
- Configure a target project path and **install / uninstall skills** into either `.claude/skills/` or `.codex/skills/` with one click
- **Copy prompts** straight to your clipboard

The UI is a Vite frontend backed by a small Node API server. The backend uses Node built-ins only — no runtime dependencies.

## Run

```bash
corepack pnpm install
corepack pnpm dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the Node server on port `5179`, so the browser only ever talks to a single origin (no CORS, no WSL port-forwarding quirks).

Run pieces separately while debugging:

```bash
corepack pnpm dev:server   # API only
corepack pnpm dev:web      # Vite only
```

Override the API port if needed (the Vite proxy follows `VITE_API_BASE`):

```bash
AGENT_VAULT_PORT=5180 VITE_API_BASE=http://localhost:5180 corepack pnpm dev
```

## Using the UI

- **Skills tab**: set a target project absolute path at the top, then each card shows per-agent install buttons (Claude Code, Codex). Installed skills get an "Installed" badge and `Reinstall` / `Uninstall` buttons. If your local copy diverges from the source, the card flags it as `Modified` and uninstall asks for confirmation.
- **Prompts tab**: hit `Copy prompt` to put the `prompt.md` body on your clipboard. No target path needed.

The library auto-refreshes when the window regains focus, plus there's a manual `Refresh` button. Recent target paths are persisted to `~/.agent-vault/config.json`.

## Library Layout

```text
assets/
|-- CLAUDE.md                  # librarian instructions
|-- skills/
|   |-- api-design/{README.md, SKILL.md}
|   |-- mcp-inspector/README.md
|   |-- openspec/{README.md, templates/}
|   `-- pdf-handling/{README.md, SKILL.md, references/, assets/}
`-- prompts/
    |-- code-review/{README.md, prompt.md}
    |-- commit-message/{README.md, prompt.md}
    `-- rubber-duck/{README.md, prompt.md}
```

- A **skill** is a folder under `assets/skills/<slug>/`. Installing copies the whole folder into the target project — Claude Code → `<target>/.claude/skills/<slug>/`, Codex → `<target>/.codex/skills/<slug>/`.
- A **prompt** is a folder under `assets/prompts/<slug>/` with `README.md` (display copy) and `prompt.md` (clipboard body).

## Frontmatter

Every `README.md` uses this minimal schema:

```yaml
---
title: Clear asset title
description: One-sentence summary
agents: [claude-code, codex]   # optional; omit for "all"
---
```

`updatedAt` is injected at runtime from `git log` for the asset's folder — do not hand-maintain it. `prompt.md` typically has no frontmatter.

## API

| Method | Path | Body / Query |
|---|---|---|
| `GET` | `/api/library` | — |
| `GET` | `/api/installed?path=<abs>` | returns `[{slug, agent, modified}]` across both agents |
| `POST` | `/api/install` | `{ slug, targetPath, agent }` |
| `DELETE` | `/api/uninstall` | `{ slug, targetPath, agent, force? }` |
| `GET` | `/api/config` | — |
| `POST` | `/api/config` | `{ currentPath }` |

`agent` is `"claude-code"` or `"codex"` (defaults to `"claude-code"` if omitted). Uninstall returns `409` when the installed copy differs from the source; pass `force: true` to remove anyway.

## Build

```bash
corepack pnpm build       # tsc + vite build
corepack pnpm lint
```
