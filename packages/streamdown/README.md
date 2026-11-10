# @slexkit/streamdown

Official Streamdown renderer for HTML-first `slex` fences.

```tsx
import { useMemo } from "react";
import { Streamdown } from "streamdown";
import { createSlexKitRenderer } from "@slexkit/streamdown";
import "@slexkit/streamdown/style.css";

export function Message({ id, markdown, streaming }) {
  const renderer = useMemo(() => createSlexKitRenderer({
    domain: id,
    secureFrame: { runtimeUrl: "/assets/slexkit.runtime.js" },
  }), [id]);
  return <Streamdown isAnimating={streaming} plugins={{ renderers: [renderer] }}>{markdown}</Streamdown>;
}
```

Model output uses the ordinary `slex` language label. The Markdown parser handles
both backtick and tilde delimiters.

````md
```slex
<slex-card title="Status" data-key="status">
  <slex-badge label="Ready" tone="success"></slex-badge>
  <slex-button id="refresh" label="Refresh"></slex-button>
</slex-card>
<script type="module">
  const refresh = slex.root.querySelector("#refresh");
  refresh.addEventListener("click", () => console.log("refresh"));
</script>
```
````

The source is always an HTML string. The adapter does not interpret object-tree
DSL, namespaces, state-only fences, expression strings, or handler strings.
Every official-host block runs in its own isolated iframe. Supply an explicit,
self-contained frame runtime URL with CORS headers suitable for an opaque-origin
sandbox. A missing or failed runtime never falls back to inline execution.

During streaming, incomplete candidates are sent as `phase: "preview"`. Preview
never executes generated scripts and does not replace the last committed UI.
Complete candidates are statically inspected and atomically committed with
stable artifact/block IDs. Invalid source displays a diagnostic beside the live
commit. `streaming` remains accepted for source compatibility; it does not
enable DSL token repair.

The factory accepts `runtimeHost` for host integration. Current hosts implement
`updateArtifact` and `resetArtifact`; custom legacy hosts with only `mountBlock`
receive complete valid commits only.

```ts
createSlexKitRenderer({
  languages: ["slex"],
  domain: "message-or-document-id",
  runtimeHost,
  secureFrame: { runtimeUrl: "/assets/slexkit.runtime.js" },
  showChrome: true,
  showSource: false,
  placeholder: "Rendering SlexKit...",
  onError(error, source) {},
});
```

Exports: `SlexKitRenderer`, `createSlexKitRenderer`, `slexkitRenderer`, and the
associated option/prop types. Ordinary Markdown and non-`slex` fences remain
owned by Streamdown.
