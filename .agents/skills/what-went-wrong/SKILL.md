---
name: what-went-wrong
description: Diagnose what went wrong in the session, why it was inefficient, or where the session derailed
---

Analyze this session and identify what went wrong

Focus on:

- Wrong assumptions, e.g. what we assumed that turned out to be incorrect
- Misleading information, e.g. outdated information in read files, misleading user prompt
- Missed information, e.g. what was available but overlooked or not sought out
- Process failures, e.g. skipped verification (linting, typechecking, tests)
- Bad project state, e.g. lack of relevant information, documentation, architecture guide

Do not overload the user with unimportant comments, nitpicking! Just high impact changes, if there are any. Highlight 0-3 issues at most.

If you find no issues, briefly summarize what you considered and state why you see no room for improvement

If there are issues, for each issue:

1. Describe where it occurred
2. Explain the root cause
3. Give recommendations for avoiding similar issues in the future, e.g. adding or fixing docs, tests, typing; updating AGENTS.md; fixing a skill

Be informative but concise!
