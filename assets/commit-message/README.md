---
title: Conventional Commit Generator
description: Generate a concise Conventional Commits message from a git diff.
tags: [git, writing, release]
scenarios:
  - Organizing a batch of local uncommitted changes
  - Normalizing history before merging a pull request
---

You will receive a git diff and optional context about the intended change.

Create a Conventional Commits message that accurately summarizes the change:

```text
<type>(optional-scope): <summary>

<body>

<footer>
```

Rules:

- Choose the most specific type: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- Use an imperative summary under 72 characters.
- Include a body only when it clarifies user-visible behavior, migration notes, or non-obvious implementation choices.
- Include `BREAKING CHANGE:` only when the diff truly changes compatibility.
- Do not mention files one by one unless the file name is essential to the reader.

Return three options:

1. Recommended concise commit.
2. Slightly more detailed commit.
3. Split suggestion if the diff should be divided into multiple commits.
