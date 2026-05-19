# Agent Context Manager

A read-only frontend for browsing agent context assets bundled in the internal `data/` repository. The app renders Markdown documentation, supports search and filters, and provides copy actions for prompts, skills, tools, and code blocks.

The frontend does not open a native folder picker. Assets are managed as repository files under `data/`.

## Stack

- React 18, TypeScript, and Vite
- Tailwind CSS with shadcn/ui-style local components
- Generated internal asset index from `data/`
- Browser-safe frontmatter parser
- `react-markdown`, `remark-gfm`, and `rehype-highlight` for Markdown rendering
- `react-router-dom` for the home and asset detail routes

## Run

```bash
pnpm install
pnpm dev
```

Open the Vite URL. The bundled `data/` asset repository loads automatically.

If `pnpm` is not installed globally, run through Corepack:

```bash
corepack pnpm install
corepack pnpm dev
```

## Internal Asset Repository

The bundled asset repository is `data/`:

```text
data/
|-- .git/
|-- CLAUDE.md
|-- prompts/
|   |-- code-review.md
|   |-- commit-message.md
|   `-- rubber-duck.md
|-- skills/
|   |-- api-design/
|   |   `-- SKILL.md
|   `-- pdf-handling/
|       |-- SKILL.md
|       |-- assets/
|       `-- references/
`-- tools/
    |-- mcp-inspector/
    |   `-- README.md
    `-- openspec/
        |-- README.md
        `-- templates/
```

`data/` is intended to be used as a standalone Git workspace. You can `cd data`, run Claude Code, and ask it to add or improve assets. Its local instructions are in `data/CLAUDE.md`.

## Asset Index Generation

The frontend consumes `src/data/generatedLibrary.ts`, which is generated from `data/`.

```bash
pnpm generate:library
```

Generation runs automatically before `pnpm dev` and `pnpm build`.

Scanning rules:

- `data/prompts/`: recursively include every `.md` file.
- `data/skills/`: direct child folders with `SKILL.md` are skill assets.
- `data/tools/`: direct child folders with `README.md` are tool assets.
- Skill and tool supporting files are collected into `resourcePaths` and shown as bundled files in the detail page.
- `data/.git` and `data/CLAUDE.md` are not assets.

## Frontmatter Schema

All asset types share the same optional frontmatter schema:

```yaml
---
title: Code Review Assistant
description: Review code for readability, bugs, performance, and security.
tags: [coding, review]
scenarios:
  - Pre-PR self review
  - Mentoring junior engineers
usage: copy
usageLabel: Copy
usageDescription: Copy this content into the target agent or workflow.
install: |
  npm install -g example-tool
  example-tool init
requires:
  - Node.js 18+
sourceUrl: https://example.com/source
sourceType: documentation
capturedAt: 2026-05-19
---

Markdown body...
```

Fields:

- `title`: shown on cards and detail pages. Falls back to the file or folder name.
- `description`: shown on cards and detail pages. Falls back to the first meaningful Markdown line.
- `tags`: used for tag filtering.
- `scenarios`: shown on cards and detail pages.
- `usage`: user-facing usage mode. Supported values are `copy`, `files`, and `command`.
- `usageLabel`: short label shown on cards and detail pages.
- `usageDescription`: concise instructions for how the asset should be used.
- `install`: shown as a highlighted install block for tools.
- `requires`: shown in detail metadata.
- `sourceUrl`, `sourceType`, `capturedAt`: required for assets derived from external URLs.

Files without frontmatter still render normally. The app strips frontmatter before rendering Markdown and before copying prompt content.

## Usage Modes

Copy:

- Use for prompts, snippets, and text the user pastes into an agent or workflow.
- The detail page has a "Copy Content" action that copies the Markdown body without frontmatter.

Files:

- Use for skills, hooks, settings, templates, or any asset that must be copied, referenced, or adapted as files.
- The detail page has a "Copy Entry Path" action and shows bundled files when present.

Command:

- Use for CLI tools, launch commands, setup commands, or installable integrations.
- If `install` is present, the detail page shows a dedicated command block with a copy button.

The physical folders `prompts/`, `skills/`, and `tools/` remain scanning conventions. They are not the primary user-facing classification.
