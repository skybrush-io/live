---
name: changelog
description: Update the changelog from recent changes
---

## What to do

- Look at the git history, eg. current branch vs its base, ask user if uncertain
- Collect all user-facing changes
- Understand the changes and the intent, ask the user if uncertain!
- Update `CHANGELOG.md`

## When to use

- Use this skill when a feature or change is fully implemented
- Ask clarifying questions if the you're not absolutely sure

## Do NOT

- Do NOT change files other than `CHANGELOG.md`

## Changelog format

- New changes go into the first h2 (##) section without a version number and release date in it
- If there is no such section, add it, eg. as `## Unreleased`
- The changelog section can have the following subsections (in this order): `Added`, `Changed`, and `Fixed`
- The `Added`, `Changed`, and `Fixed` sections can only contain a single, unordered list
- New entries are added to the end of the corresponding list
- List items are separated by an empty line
- Each changelist item has exactly one new list item
- Descriptions are short (preferably 1 line, max 3), but informative
- Descriptions are full sentences
- Descriptions are user-facing, they avoid technical jargon and implementation details
- **Avoid**: bold and italic text, unnecessary hyphenation and punctuation, filler text and AI slop in general
- Max 80 chars per line
