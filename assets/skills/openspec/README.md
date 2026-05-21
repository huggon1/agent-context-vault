---
title: OpenSpec CLI
description: A lightweight spec-driven workflow for proposing, reviewing, and applying product or API changes.
agents: [claude-code, codex]
---

# OpenSpec CLI

OpenSpec helps teams describe a change before implementation. It is useful when a code change has product, API, or architecture implications that should be reviewed before files are edited.

## What It Solves

Ad hoc implementation often hides the real decision until review time. OpenSpec moves that decision into a proposal artifact so reviewers can discuss intent, scope, and compatibility first.

## Typical Workflow

```text
Proposal change -> Review -> Apply
```

1. Create a proposal describing the user-facing or system-facing change.
2. Review the proposal with stakeholders and maintainers.
3. Apply the approved change in code.
4. Archive the proposal with the final implementation notes.

## Agent Usage

When an AI agent is about to make a broad change, ask it to create or update an OpenSpec proposal first. The agent should not implement until the proposal is accepted.
