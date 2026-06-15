---
title: AI / Agents
category: Guides
status: ready
order: 50
summary: "LLM docs, MCP server, skills, and authoring rules for SlexKit agents."
slexkitRenderMode: component
---

# AI / Agents

## AI Accessible Documentation

SlexKit follows the assistant-ui information architecture: a clear index, a full-context file, task-oriented skills, and a minimal MCP surface. Raw docs stay as `.md` pages, and interactive examples use explicit `slex` fences.

```slex
{
  namespace: "ai_docs_links",
  layout: {
    "column:links": {
      gap: "sm",
      "link:index": { href: "/llms.txt", text: "/llms.txt - docs index", icon: "list-magnifying-glass" },
      "link:full": { href: "/llms-full.txt", text: "/llms-full.txt - full English context", icon: "book-open-text" },
      "link:components": { href: "/llms-components.txt", text: "/llms-components.txt - components and API", icon: "puzzle-piece" },
      "link:runtime": { href: "/llms-runtime.txt", text: "/llms-runtime.txt - runtime and host integration", icon: "cpu" },
      "link:capabilities": { href: "/llms-capabilities.txt", text: "/llms-capabilities.txt - std and api capabilities", icon: "function" },
      "link:toolhost": { href: "/llms-toolhost.txt", text: "/llms-toolhost.txt - structured input", icon: "cursor-click" },
      "link:authoring": { href: "/llms-authoring.txt", text: "/llms-authoring.txt - slex fence authoring rules", icon: "pencil-simple" },
      "link:manifest": { href: "/slexkit-ai-manifest.json", text: "/slexkit-ai-manifest.json - machine-readable index", icon: "brackets-curly" },
      "text:note": { text: "Raw docs use .md routes such as /docs/components/card.md. Do not add .mdx routes." }
    }
  }
}
```

Minimal reading path:

1. Start with [`/llms.txt`](/llms.txt) for the grouped index.
2. Use [`/llms-full.txt`](/llms-full.txt) when the agent needs broad context.
3. Use [`/llms-components.txt`](/llms-components.txt) and raw component `.md` pages when authoring UI.
4. Use [`/llms-capabilities.txt`](/llms-capabilities.txt) for `std.*` and policy-gated `api.*`.
5. Use [`/llms-runtime.txt`](/llms-runtime.txt) for host and secure runtime integration.
6. Use [`/llms-toolhost.txt`](/llms-toolhost.txt) only when user input must return structured data to the host.

SlexKit raw docs are ordinary `.md` pages with explicit `slex` fences. There is no `.mdx` route — `slex` fences are the interactive layer.

## Context Files

Add SlexKit context to `AGENTS.md`, `CLAUDE.md`, or `.cursorrules`:

````md
## SlexKit

This project uses SlexKit for Markdown-native interactive AI output.

Documentation: https://slexkit.dev/llms-full.txt

Key patterns:
- Display UI uses explicit `slex` fenced blocks plus Markdown fallback.
- Slex source uses `{ slex, namespace, g, layout }`; use `slex: "0.1"` for the current public protocol.
- Use `std.*` for common calculations, formatting, units, and small statistics.
- ToolHost is only for structured user input flows.
- Untrusted or agent-generated source should use the secure runtime.
- Raw docs are `.md` files with `slex` fences, not `.mdx`.
````

## Skills

The `skills/` directory provides these task entry points:

- `/slexkit`: overview, architecture boundaries, and positioning
- `/author`: write display-oriented `slex` fences with Markdown fallback
- `/host`: integrate Markdown, Streamdown, Obsidian, or custom hosts
- `/toolhost`: build confirmations, choices, and structured forms
- `/secure`: configure sandbox runtime and host policy
- `/update`: regenerate AI docs after API, docs, or component changes

Use `/author` for display UI. Use `/toolhost` when the host must receive a submitted result.

## MCP

`@slexkit/mcp` provides read-only access to SlexKit documentation, examples, and Slex source validation. Keep the public surface small and natural: docs, examples, validate.

```slex
{
  namespace: "ai_mcp_tools",
  layout: {
    "grid:tools": {
      columns: 1,
      mdColumns: 3,
      "card:docs": {
        title: "slexkitDocs",
        icon: "book-open-text",
        "text:body": { text: "Search or fetch Markdown docs by query, group, slug, or raw .md URL." }
      },
      "card:examples": {
        title: "slexkitExamples",
        icon: "code",
        "text:body": { text: "Browse component examples, ToolHost templates, and host integration snippets." }
      },
      "card:validate": {
        title: "slexkitValidate",
        icon: "check-circle",
        "text:body": { text: "Parse Slex source and return diagnostics plus component usage." }
      }
    }
  }
}
```

### Quick Install

```sh
npx add-mcp @slexkit/mcp
```

Or specify an app:

```sh
npx add-mcp @slexkit/mcp -a claude-code
npx add-mcp @slexkit/mcp -a codex
npx add-mcp @slexkit/mcp -a cursor
npx add-mcp @slexkit/mcp -a vscode
npx add-mcp @slexkit/mcp -a zed
```

### Manual Installation

```slex
{
  namespace: "ai_manual_configs",
  layout: {
    "tabs:manualConfigs": {
      value: "cursor",
      tabs: [
        {
          value: "cursor",
          label: "Cursor",
          content: {
            "code-block:cursor": {
              title: ".cursor/mcp.json",
              language: "json",
              code: "{\n  \"mcpServers\": {\n    \"slexkit\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@slexkit/mcp\"]\n    }\n  }\n}"
            }
          }
        },
        {
          value: "codex",
          label: "Codex",
          content: {
            "code-block:codex": {
              title: "config.toml",
              language: "toml",
              code: "[mcp_servers.slexkit]\ncommand = \"npx\"\nargs = [\"-y\", \"@slexkit/mcp\"]"
            }
          }
        },
        {
          value: "vscode",
          label: "VS Code",
          content: {
            "code-block:vscode": {
              title: ".vscode/mcp.json",
              language: "json",
              code: "{\n  \"servers\": {\n    \"slexkit\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@slexkit/mcp\"],\n      \"type\": \"stdio\"\n    }\n  }\n}"
            }
          }
        }
      ]
    }
  }
}
```

## Troubleshooting

- MCP server does not start: verify `npx` and MCP config JSON, then restart the IDE.
- Tool calls fail: restart the MCP server and confirm `tools/list` exposes only `slexkitDocs`, `slexkitExamples`, and `slexkitValidate`.
- Docs are stale: run `bun run ai:docs` or `bun run build:core`.
- Wrong raw source route: use `.md` routes with `slex` fences. Do not request `.mdx`.
