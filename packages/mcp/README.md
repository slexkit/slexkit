# @slexkit/mcp

Read-only MCP server for SlexKit docs, component APIs, examples, and source validation.

## Configure

```json
{
  "mcpServers": {
    "slexkit": {
      "command": "npx",
      "args": ["-y", "@slexkit/mcp"]
    }
  }
}
```

The same command shape works in clients such as Codex, Claude Desktop, and other MCP-compatible agent tools:

```sh
npx -y @slexkit/mcp
```

## Tools

The server exposes three read-only tools:

| Tool | Purpose |
|------|---------|
| `slexkitDocs` | Search or fetch generated Markdown docs, including runtime, security, package, ToolHost, and component pages. |
| `slexkitExamples` | Return component examples or generated templates such as `status`, `calculator`, `toolhost-form`, and `host-integration`. |
| `slexkitValidate` | Parse Slex source and return diagnostics plus detected component usage. |

Example validation request:

```json
{
  "name": "slexkitValidate",
  "arguments": {
    "source": "{ slex: \"0.1\", namespace: \"demo\", layout: { \"text:message\": { text: \"Hello\" } } }"
  }
}
```

Successful validation returns structured content similar to:

```json
{
  "ok": true,
  "componentUsage": ["text"]
}
```

Invalid source returns `ok: false` plus a SlexKit diagnostic with message, location, and excerpt.

## Safety

The MCP server is read-only. It serves bundled docs and generated metadata from the package, validates source text, and writes no project files.
