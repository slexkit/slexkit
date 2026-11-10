---
title: Getting Started
category: Guides
status: ready
order: 20
summary: "Install SlexKit, mount a first fragment, and keep readable Markdown fallback."
slexkitRenderMode: component
---

# Getting Started

Install the package and configure a host-owned frame runtime URL.

```js
import { createSlexKitMarkdownRuntimeHost } from "slexkit/runtime";
const host = createSlexKitMarkdownRuntimeHost({ secureFrame: { runtimeUrl: "/slexkit.runtime.js", styleUrl: "/slexkit.css" } });
await host.updateArtifact("message-1", [{ artifactId: "message-1", blockId: "block-1", source, container }], { phase: "commit" });
```

```slex
<slex-card title="Counter"><slex-stat id="count" label="Count" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add");
  const click = () => { count.value = Number(count.value) + 1; }; add.addEventListener("click", click);
  slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

Use stable block IDs and stable element `id` or `data-key` values. Preview updates validate without running new scripts; commit updates execute in the isolated document.
