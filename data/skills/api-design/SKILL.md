---
title: API Design Skill
description: Design REST and GraphQL APIs with clear resources, versioning, errors, and compatibility rules.
tags: [api, architecture, backend]
usage: files
usageLabel: Files
usageDescription: Copy or reference this SKILL.md file in the target agent environment.
scenarios:
  - Designing a new REST endpoint
  - Reviewing a GraphQL schema
  - Planning API versioning
requires:
  - Product requirements
  - Consumer use cases
---

# API Design Skill

Use this skill when shaping an API contract before implementation.

## Core Principles

Start from the consumer workflow. Name resources after domain concepts, keep operations predictable, and make invalid states hard to represent.

## REST Guidance

- Use nouns for resources: `/projects/{projectId}/tasks`.
- Use HTTP methods consistently: `GET`, `POST`, `PATCH`, and `DELETE`.
- Prefer stable identifiers in URLs and human-readable names in payloads.
- Return `201 Created` for successful creation, `202 Accepted` for async work, `204 No Content` for empty success, `400` for validation failures, `401` for unauthenticated requests, `403` for authorization failures, and `404` when the resource should not be revealed.
- Use cursor pagination for growing collections.

Example error payload:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The dueDate must be an ISO 8601 date.",
    "field": "dueDate"
  }
}
```

## GraphQL Guidance

- Model stable object types and avoid leaking database tables.
- Use connection fields for paginated lists.
- Put mutations behind explicit input objects.
- Return typed user-facing errors when clients can recover.

## Versioning and Compatibility

Avoid breaking changes in public APIs. Add fields before removing or renaming them. When a breaking change is unavoidable, publish a migration path, deprecation date, and version boundary.
