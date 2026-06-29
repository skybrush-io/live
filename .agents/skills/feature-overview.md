---
name: feature-overview
description: Write concise architecture overview documents for features. Use when creating or updating docs that describe a feature's structure, design rationale, invariants, and extension points for agents and humans.
---

# Feature overview documents

## When to create one

When a feature spans multiple files and has non-obvious design decisions, relationships, or invariants that an agent working on related changes would need to understand but cannot easily discover by reading a single file.

## File

`.agents/docs/<feature-slug>/overview.md`

## Purpose

Give agents the **mental model** — structure, relationships, rationale, invariants. Not a catalog of what each file contains. The goal is to save context and time: an agent reads this, then knows where to look and what to watch for.

## Content rules

### Include

- **Purpose** — what problem the feature solves. One paragraph.
- **Architecture at a glance** — layers, components, their relationships. What depends on what. What knows about what.
- **Key abstractions** — concepts that span files, described in terms of their role and interactions, not their implementation.
- **Design decisions and rationale** — especially non-obvious ones: why two backends, why state lives outside Redux, why broadcast is deliberately unsupported on a path, etc.
- **Invariants and gotchas** — constraints that must hold (e.g. "resume callbacks must never enter Redux", "this slice is not persisted"). Things agents could break if they don't know.
- **Extension points** — patterns for adding new variants of the thing (new task type, new mass op, etc.). Brief, not tutorial.
- **Deliberate gaps** — what was intentionally left out and why (no cancellation, no persistence).

### Exclude

- Implementation details discoverable by reading one file (how a key is constructed, what a function returns).
- Copy-pasted code snippets.
- File indexes / directory listings.
- Consumer/UI component lists (unless a specific integration point is architecturally significant).
- Anything an agent can find with a quick grep or by reading the file referenced.

### Style

- Dense, no filler. ~80 lines is a good target.
- Inline file references with concepts (e.g. "the active-operations Map in `actions/uav-test-actions.ts`") — agents shouldn't need to search for the file.
- Tables only for comparing alternatives or backends.
- Headings for navigation, not hierarchy for its own sake.

## Process

1. Study the actual implementation — diffs, current code, how things are wired. Understand the feature thoroughly before writing.
2. Ask the user clarifying questions. Don't assume; don't guess. The user knows what the feature does and why decisions were made.
3. Once you and the user have a shared understanding, write the overview.
4. Trim aggressively. Every sentence must earn its place.
