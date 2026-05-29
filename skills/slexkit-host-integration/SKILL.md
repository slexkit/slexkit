---
name: slexkit-host-integration
description: Slash-command style `/host` skill for integrating SlexKit into Markdown renderers, chat hosts, Streamdown, Obsidian, or custom host adapters.
---

# SlexKit Host Integration

Use this skill as `/host` when adding SlexKit to a host application or documentation renderer.

## Workflow

1. Read `/llms-runtime.txt` or call `slexkitDocs` through `@slexkit/mcp` with `group: "Runtime"`.
2. Determine the trust boundary:
   - Trusted content: use `mount()` or trusted Markdown runtime mode.
   - Untrusted or agent-generated content: use `mountSecureArtifact()` or secure Markdown runtime mode.
3. Process only explicitly tagged `slex` fences.
4. Preserve fallback Markdown in unsupported environments.
5. Serve `slexkit.runtime.js` as a public ES module for secure iframe mode.

## Integration Paths

- Vanilla host: `createSlexKitMarkdownRuntimeHost`.
- React/Streamdown: `@slexkit/streamdown`.
- Obsidian: `@slexkit/obsidian`, readonly fenced block rendering.
- Custom host: detect the `slex` code fence, pass source plus artifact id to the runtime host, dispose when the block is removed.

## Rules

- Do not scan arbitrary JavaScript, JSON, or untagged code blocks.
- Do not add `.mdx` handling; use Markdown `.md` sources with explicit `slex` fences.
- Do not bypass secure mode for untrusted model output.
- Keep ToolHost separate from ordinary display fence rendering.
- Use `runtimeHost`, `securePolicy`, `hostAdapter`, and `secureFrame` options instead of inventing a second lifecycle.
