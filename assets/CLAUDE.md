# Asset Librarian Instructions

You are managing the root `assets/` directory as an agent context asset library. The library is read at runtime by the Agent Context Vault server.

## Repository Shape

```text
assets/
|-- CLAUDE.md
|-- skills/
|   `-- <slug>/
|       |-- README.md
|       `-- (SKILL.md, templates/, references/, scripts/, ...)
`-- prompts/
    `-- <slug>/
        |-- README.md
        `-- prompt.md
```

Rules:

- A **skill** lives at `assets/skills/<slug>/`. It must contain `README.md`. It may contain any supporting files (e.g. `SKILL.md`, `templates/`, `references/`, hooks, commands). The whole folder is what gets copied into a target project's `.claude/skills/<slug>/` directory.
- A **prompt** lives at `assets/prompts/<slug>/`. It must contain `README.md` (display copy) and `prompt.md` (the raw prompt text users will copy to their clipboard).
- `<slug>` must match `[a-z0-9-]+`.
- Do not place markdown files directly under `assets/`, `assets/skills/`, or `assets/prompts/`.

## Frontmatter Schema

Every `README.md` uses this minimal schema:

```yaml
---
title: Clear asset title
description: One-sentence summary
agents: [claude-code, codex]   # optional; omit to mean "all"
---
```

Do not add other fields. The server injects `updatedAt` automatically from git history. `prompt.md` typically has no frontmatter.

## Writing Standards

- Write all assets in English.
- Prompts should be directly usable when pasted into a chat. `prompt.md` is the canonical copy-paste body.
- Skills should be procedural and decision-oriented. Examples only when they materially help.
- Prefer small, composable supporting files over very long monolithic documents.

## URL-Based Addition Workflow

When the user asks you to add or improve an asset from a URL:

1. Read and analyze the source.
2. Decide whether it is a skill (runnable / installable / multi-file context) or a prompt (single-shot instruction).
3. Present a concise plan in chat and wait for explicit approval before editing files.
4. After approval, create files under `assets/skills/<slug>/` or `assets/prompts/<slug>/`.
5. Run validation from the parent app repository when possible:
   - `corepack pnpm lint`
   - `corepack pnpm build`
6. Show a concise `git diff --stat` summary.
7. Commit only after the user explicitly approves.

Do not invent source claims. If a URL cannot be accessed, say so and ask for the missing source material.
