# Asset Librarian Instructions

You are managing the root `assets/` directory as an agent context asset library. The library is read by the Agent Context Manager app.

## Repository Shape

```text
assets/
|-- CLAUDE.md
`-- <asset-slug>/
    `-- README.md
```

Asset rules:

- Every library item is a direct child folder under `assets/`.
- Every asset folder must contain `README.md`.
- Direct Markdown files under `assets/` are not assets.
- Folder assets may include supporting files such as `references/`, `assets/`, `scripts/`, `templates/`, hooks, commands, agents, or other useful resource folders.
- Do not split assets into separate category directories.

## Frontmatter

Use this shared frontmatter schema when useful:

```yaml
---
title: Clear asset title
description: One-sentence summary
tags: [tag-one, tag-two]
scenarios:
  - When this asset should be used
requires:
  - Runtime or dependency requirement
sourceUrl: https://example.com/source
sourceType: documentation
capturedAt: 2026-05-19
---
```

For installable or runnable assets, include `install` when applicable:

```yaml
install: |
  npm install -g example
  example init
```

Source traceability is required for assets derived from external URLs:

- `sourceUrl`: the original URL.
- `sourceType`: concise source category such as `documentation`, `repository`, `article`, `specification`, or `tool`.
- `capturedAt`: the date the source was analyzed in `YYYY-MM-DD` format.

Do not add classifier fields. The asset body should naturally explain how to apply the item in Claude Code, Codex, or another compatible coding-agent environment.

## URL-Based Addition Workflow

When the user asks you to add or improve an asset from a URL:

1. Read and analyze the source.
2. Design the asset folder and decide which supporting files, if any, belong with its `README.md`.
3. Present a concise plan in chat and wait for explicit approval before editing files.
4. After approval, create or update the asset files under `assets/<asset-slug>/`.
5. Include source metadata for all externally derived assets.
6. Run validation from the parent app repository when possible:
   - `corepack pnpm generate:library`
   - `corepack pnpm lint`
   - `corepack pnpm build`
7. Show a concise `git diff --stat` and relevant diff summary.
8. Commit completed approved changes in the parent repository.

Do not invent source claims. If a URL cannot be accessed or does not support the proposed asset, say so and ask for the missing source material.

## Writing Standards

- Write all assets in English.
- Keep prompts directly usable.
- Keep skills procedural and decision-oriented, with examples only when they materially help.
- Keep runnable asset README files focused on what the asset is, when to use it, setup, and common workflows.
- Prefer small, composable supporting files over very long monolithic documents.
