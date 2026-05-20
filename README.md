# Agent Context Manager

A read-only frontend for browsing agent context assets bundled in the root `assets/` directory. The app renders Markdown documentation, supports search and filters, and provides copy actions for asset content, entry paths, install commands, and code blocks.

The frontend does not open a native folder picker. Assets are managed as repository files under `assets/`.

## Stack

- React 18, TypeScript, and Vite
- Tailwind CSS with shadcn/ui-style local components
- Generated internal asset index from `assets/`
- Browser-safe frontmatter parser
- `react-markdown`, `remark-gfm`, and `rehype-highlight` for Markdown rendering
- `react-router-dom` for the home and asset detail routes

## Run

```bash
pnpm install
pnpm dev
```

Open the Vite URL. The bundled `assets/` library loads automatically.

If `pnpm` is not installed globally, run through Corepack:

```bash
corepack pnpm install
corepack pnpm dev
```

## Asset Library

The bundled asset library is `assets/` at the repository root:

```text
assets/
|-- CLAUDE.md
|-- code-review/
|   `-- README.md
|-- commit-message/
|   `-- README.md
|-- rubber-duck/
|   `-- README.md
|-- api-design/
|   |-- README.md
|   `-- SKILL.md
|-- pdf-handling/
|   |-- README.md
|   |-- SKILL.md
|   |-- assets/
|   `-- references/
|-- mcp-inspector/
|   `-- README.md
`-- openspec/
    |-- README.md
    `-- templates/
```

Every asset is a folder. `README.md` is the required display entrypoint; all other files in that folder are bundled resources.

## Asset Index Generation

The frontend consumes `src/data/generatedLibrary.ts`, which is generated from `assets/`.

```bash
pnpm generate:library
```

Generation runs automatically before `pnpm dev` and `pnpm build`.

Scanning rules:

- `assets/*/README.md`: each direct child folder with a README is an asset.
- Supporting files inside asset folders are collected into `resourcePaths` and shown as bundled files in the detail page.
- Direct files under `assets/`, such as `assets/CLAUDE.md`, are not assets.

## Frontmatter Schema

All assets share the same optional frontmatter schema:

```yaml
---
title: Code Review Assistant
description: Review code for readability, bugs, performance, and security.
tags: [coding, review]
scenarios:
  - Pre-PR self review
  - Mentoring junior engineers
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
- `install`: shown as a highlighted install block when present.
- `requires`: shown in detail metadata.
- `sourceUrl`, `sourceType`, `capturedAt`: required for assets derived from external URLs.

Files without frontmatter still render normally. The app strips frontmatter before rendering Markdown and before copying asset content.
