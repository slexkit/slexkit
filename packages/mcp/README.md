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
| `slexkitDocs` | Search or fetch generated Markdown docs, standard artifact JSON, conformance reports, and optional `std.*` / `api.*` capability metadata. |
| `slexkitExamples` | Return component examples or generated templates such as `status`, `calculator`, `stdlib-calculator`, `secure-network-card`, `toolhost-form`, and `host-integration`. |
| `slexkitValidate` | Parse Slex source and return diagnostics, warnings, component usage, `std.*` usage, and `api.*` usage. |

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
  "schemaVersion": "2026-06",
  "protocolVersion": "0.1",
  "logicProfileVersion": "0.1",
  "componentUsage": ["text"]
}
```

Invalid source returns `ok: false` plus a SlexKit diagnostic with message, location, and excerpt.

Fetch standard artifacts through `slexkitDocs`:

```json
{
  "name": "slexkitDocs",
  "arguments": {
    "standardArtifact": "slex-standard-manifest.json"
  }
}
```

Available standard artifacts include `slex-expression.schema.json`, `slex-component-catalog.json`, `slex-logic-profile.json`, `slex-capabilities.catalog.json`, `slex-conformance.json`, and `slex-standard-manifest.json`.

Run the bundled conformance fixtures through `slexkitDocs`:

```json
{
  "name": "slexkitDocs",
  "arguments": {
    "conformanceReport": true
  }
}
```

## Safety

The MCP server is read-only. It serves bundled docs and generated metadata from the package, validates source text, and writes no project files.
