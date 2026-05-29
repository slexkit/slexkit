---
name: slexkit-update
description: Slash-command style `/update` skill for regenerating SlexKit AI docs, MCP data, skills, and tests after docs, component, or public API changes.
---

# SlexKit Update

Use this skill as `/update` after SlexKit docs, component specs, examples, or public APIs change.

## Workflow

1. Regenerate AI docs with `bun run ai:docs` or as part of `bun run build:core`.
2. Rebuild the MCP package with `bun run --filter @slexkit/mcp build`.
3. Verify `/llms.txt` remains a `.md` documentation index and contains no `.mdx`.
4. Verify `slexkit-ai-manifest.json` page entries have `rawHref` values ending in `.md`.
5. Run targeted AI tooling tests, then the normal project test gate.

## Checks

- `llms.txt` is navigable and grouped.
- `llms-full.txt` preserves Markdown `slex` fences.
- MCP exposes `slexkitDocs`, `slexkitExamples`, and `slexkitValidate`.
- Skills still describe `/slexkit`, `/author`, `/host`, `/toolhost`, `/secure`, and `/update`.
