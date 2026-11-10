# @slexkit/mcp

Read-only MCP server for HTML-first SlexKit documentation, examples, custom-element metadata, standard artifacts, and static validation.

```sh
bunx @slexkit/mcp
```

Tools:

- `slexkitDocs` searches/fetches published documentation and HTML-profile metadata.
- `slexkitExamples` returns HTML examples and metadata generated from the actual Web Components definitions.
- `slexkitValidate` statically inspects HTML and inline JavaScript. It never executes payload scripts.

Validation input:

```json
{
  "source": "<slex-stat label=\"Count\" value=\"3\"></slex-stat>"
}
```

The validator rejects legacy object source as well as external scripts/imports, inline event-handler attributes, embedded frames/plugins, navigation metadata, and executable URL schemes according to the runtime inspector. Static success is not permission to execute source in the host page; generated code still belongs in the isolated SlexKit document runtime.

Standard metadata is published as an HTML profile, custom-element catalog, sandbox SDK, static policy, conformance fixtures, and manifest. Component setup and asset URLs remain host-owned.
