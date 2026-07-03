---
title: AI / Agents
category: Guides
status: ready
order: 50
summary: "供 agents 使用的 LLM 文档、MCP、skills 与创作规则。"
slexkitRenderMode: component
---

# AI / Agents

## AI 可访问文档

SlexKit 遵循 assistant-ui 的信息架构：提供清晰的索引、完整上下文文件、按任务划分的 skills，以及精简的 MCP 工具面。原始文档保持 `.md` 格式，交互示例使用显式 `slex` fence。

```slex
{
  namespace: "ai_docs_links",
  layout: {
    "column:links": {
      gap: "sm",
      "link:index": { href: "/llms.txt", text: "/llms.txt - 文档索引", icon: "list-magnifying-glass" },
      "link:full": { href: "/llms-full.txt", text: "/llms-full.txt - 完整英文上下文", icon: "book-open-text" },
      "link:components": { href: "/llms-components.txt", text: "/llms-components.txt - 组件与 API", icon: "puzzle-piece" },
      "link:runtime": { href: "/llms-runtime.txt", text: "/llms-runtime.txt - runtime 与 host", icon: "cpu" },
      "link:capabilities": { href: "/llms-capabilities.txt", text: "/llms-capabilities.txt - std 与 api 能力", icon: "function" },
      "link:toolhost": { href: "/llms-toolhost.txt", text: "/llms-toolhost.txt - 结构化输入", icon: "cursor-click" },
      "link:authoring": { href: "/llms-authoring.txt", text: "/llms-authoring.txt - slex fence 写作规则", icon: "pencil-simple" },
      "link:manifest": { href: "/slexkit-ai-manifest.json", text: "/slexkit-ai-manifest.json - 机器可读索引", icon: "brackets-curly" },
      "link:standard": { href: "/standard/slex-standard-manifest.json", text: "/standard/slex-standard-manifest.json - 标准产物", icon: "brackets-curly" },
      "link:catalog": { href: "/standard/slex-component-catalog.json", text: "/standard/slex-component-catalog.json - 组件目录", icon: "puzzle-piece" },
      "link:logic": { href: "/standard/slex-logic-profile.json", text: "/standard/slex-logic-profile.json - 逻辑规则", icon: "function" },
      "link:conformance": { href: "/standard/slex-conformance.json", text: "/standard/slex-conformance.json - 一致性 fixtures", icon: "check-circle" },
      "text:note": { text: "原始文档使用 .md 路由，例如 /docs/components/card.md；不要增加 .mdx 路由。" }
    }
  }
}
```

最小读取顺序：

1. 先读 [`/llms.txt`](/llms.txt)，拿到分组索引。
2. 需要全量上下文时读 [`/llms-full.txt`](/llms-full.txt)。
3. 写组件时读 [`/llms-components.txt`](/llms-components.txt) 和对应 raw `.md` 页面。
4. 需要 `std.*` 标准库或受 policy 控制的 `api.*` 能力时读 [`/llms-capabilities.txt`](/llms-capabilities.txt)。
5. 集成 host 或安全运行时时读 [`/llms-runtime.txt`](/llms-runtime.txt)。
6. 只有需要用户提交结构化结果时读 [`/llms-toolhost.txt`](/llms-toolhost.txt)。
7. 需要机器可读的创作或校验上下文时读 [`/standard/slex-standard-manifest.json`](/standard/slex-standard-manifest.json)、[`/standard/slex-logic-profile.json`](/standard/slex-logic-profile.json) 和 [`/standard/slex-component-catalog.json`](/standard/slex-component-catalog.json)。

SlexKit 原始文档为普通 `.md` 文件，包含显式 `slex` fence。无 `.mdx` 路由，`slex` fence 即交互层。

## 上下文文件

可以把这段加入 `AGENTS.md`、`CLAUDE.md` 或 `.cursorrules`：

````md
## SlexKit

This project uses SlexKit for Markdown-native interactive AI output.

Documentation: https://slexkit.dev/llms-full.txt

Key patterns:
- 展示型 UI 使用 explicit `slex` fenced blocks，并保留 Markdown fallback.
- Slex source uses `{ slex, namespace, g, layout }`; 公开协议使用 `slex: "0.1"`。
- Use `std.*` for common calculations, formatting, units, and small statistics.
- Use `/standard/slex-logic-profile.json` and `/standard/slex-component-catalog.json` for machine-readable rules before generating Slex.
- Run `slex validate --standard` to verify the current package against bundled standard fixtures.
- ToolHost 只用于需要结构化返回值的交互。
- Untrusted or agent-generated source should use the secure runtime.
- Raw docs are `.md` files with `slex` fences, not `.mdx`.
````

## Skills

仓库 `skills/` 目录提供以下任务入口：

- `/slexkit`：总览、架构和定位
- `/author`：编写展示型 `slex` fence，保留 Markdown fallback
- `/host`：集成 Markdown、Streamdown、Obsidian 或自定义 host
- `/toolhost`：构建确认、选择和结构化表单
- `/secure`：配置 sandbox runtime 和 host policy
- `/update`：API、文档或组件变化后重新生成 AI docs

创建展示 UI 时使用 `/author`；需要向 host 返回提交结果时使用 `/toolhost`。

## MCP

`@slexkit/mcp` 提供只读的 SlexKit 文档、示例和 Slex source 校验能力。公开工具面保持小而自然：docs、examples、validate。

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
        "text:body": { text: "按 query、group、slug 或 raw .md URL 搜索/读取 Markdown 文档。" }
      },
      "card:examples": {
        title: "slexkitExamples",
        icon: "code",
        "text:body": { text: "浏览组件示例、ToolHost 模板和宿主接入片段。" }
      },
      "card:validate": {
        title: "slexkitValidate",
        icon: "check-circle",
        "text:body": { text: "解析 Slex source，返回 diagnostics 和 component usage。" }
      }
    }
  }
}
```

### 快速安装

```sh
npx add-mcp @slexkit/mcp
```

也可以指定 app：

```sh
npx add-mcp @slexkit/mcp -a claude-code
npx add-mcp @slexkit/mcp -a codex
npx add-mcp @slexkit/mcp -a cursor
npx add-mcp @slexkit/mcp -a vscode
npx add-mcp @slexkit/mcp -a zed
```

### 手动配置

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

## 排查

- MCP server 启动失败：确认 `npx` 和 MCP 配置 JSON 正确，然后重启 IDE。
- 工具调用失败：重启 MCP server，并确认 `tools/list` 只暴露 `slexkitDocs`、`slexkitExamples`、`slexkitValidate`。
- 文档过期：运行 `bun run ai:docs` 或 `bun run build:core`。
- Raw source 路由不对：使用包含 `slex` fence 的 `.md` 路由，不要请求 `.mdx`。
