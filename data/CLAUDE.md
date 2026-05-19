# Asset Librarian Instructions

You are managing this repository as an agent context asset library. The library is read by the Agent Context Manager app, but this `data/` folder is its own Git-managed workspace.

## Repository Shape

```text
data/
├── prompts/
├── skills/
└── tools/
```

Asset rules:

- Prompts are Markdown files under `prompts/`; nested folders are allowed.
- Skills are direct child folders under `skills/` and must contain `SKILL.md`.
- Tools are direct child folders under `tools/` and must contain `README.md`.
- Skills and tools may include supporting files such as `references/`, `assets/`, `scripts/`, `templates/`, or other useful resource folders.

## Frontmatter

Use this shared frontmatter schema when useful:

```yaml
---
title: Clear asset title
description: One-sentence summary
tags: [tag-one, tag-two]
usage: copy
usageLabel: Copy
usageDescription: Copy this content into the target agent or workflow.
scenarios:
  - When this asset should be used
requires:
  - Runtime or dependency requirement
sourceUrl: https://example.com/source
sourceType: documentation
capturedAt: 2026-05-19
---
```

For tools, include `install` when applicable:

```yaml
install: |
  npm install -g example
  example init
```

Source traceability is required for assets derived from external URLs:

- `sourceUrl`: the original URL.
- `sourceType`: concise source category such as `documentation`, `repository`, `article`, `specification`, or `tool`.
- `capturedAt`: the date the source was analyzed in `YYYY-MM-DD` format.

Usage is the primary user-facing classification:

- `copy`: the user copies text into an agent, chat, document, or config field.
- `files`: the user copies, references, or modifies one or more files in an agent or project environment.
- `command`: the user runs an install, launch, or setup command.

Do not force new assets into a product category for display purposes. The app may still store assets under `prompts/`, `skills/`, or `tools/` for scanning, but the user-facing card and detail page should explain use cases, usage method, and key operational details.

## URL-Based Addition Workflow

When the user asks you to add or improve an asset from a URL:

1. Read and analyze the source.
2. Decide whether the result should be a prompt, skill, or tool.
3. Present a concise plan in chat and wait for explicit approval before editing files.
4. After approval, create or update the asset files under this `data/` repository.
5. Include source metadata for all externally derived assets.
6. Run validation from the parent app repository when possible:
   - `corepack pnpm generate:library`
   - `corepack pnpm lint`
   - `corepack pnpm build`
7. Show a concise `git diff --stat` and relevant diff summary.
8. Commit completed approved changes inside this `data/` repository.

Do not invent source claims. If a URL cannot be accessed or does not support the proposed asset, say so and ask for the missing source material.

## Writing Standards

- Write all assets in English.
- Keep prompts directly usable.
- Keep skills procedural and decision-oriented, with examples only when they materially help.
- Keep tool README files focused on what the tool is, when to use it, setup, and common workflows.
- Prefer small, composable supporting files over very long monolithic skill documents.
