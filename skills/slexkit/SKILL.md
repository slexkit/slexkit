---
name: slexkit
description: Slash-command style `/slexkit` skill for SlexKit architecture, positioning, package boundaries, and display UI versus ToolHost decisions.
---

# SlexKit

Use this skill as `/slexkit` for project overview and boundary decisions.

## Core Position

SlexKit is a zero-build, Markdown-friendly reactive UI runtime for AI output. It renders small interactive fragments in chat messages, documents, agent panels, and tool dashboards.

## Boundaries

- Display UI goes through Markdown `slex` fences or direct runtime mounting.
- Structured user input goes through ToolHost.
- Untrusted or agent-generated source uses secure runtime mode.
- SlexKit raw docs are `.md` files with `slex` fences, not `.mdx`.
- SlexKit is not a full app framework and not a React JSX generator.

## Workflow

1. Read `/llms.txt` first for navigation.
2. Use `slexkitDocs` from `@slexkit/mcp` when available.
3. Use `slexkitExamples` for component examples or host snippets.
4. Use `slexkitValidate` before presenting generated Slex source.
