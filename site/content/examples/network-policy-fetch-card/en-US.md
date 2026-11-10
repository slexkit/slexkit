---
title: JSONPlaceholder Network Request Lab
category: Platform Features
status: published
order: 16
summary: Uses JSONPlaceholder to demonstrate how the secure runtime delegates user-triggered network requests to host policy for review and proxying.
tags: network, fetch, host-policy, jsonplaceholder
components: button, card, text
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# JSONPlaceholder Network Request Lab

The button calls policy-gated `slex.api.fetch`; the host decides whether the URL and request are allowed and returns a serializable result.

```slex
<slex-card title="JSONPlaceholder Network Request Lab"><slex-button id="load" label="Load"></slex-button><slex-text id="status" text="Idle"></slex-text></slex-card>
<script type="module">
  const load = slex.root.querySelector("#load"); const status = slex.root.querySelector("#status");
  const run = async () => { try { const result = await slex.api.fetch("https://jsonplaceholder.typicode.com/posts/1"); status.text = String(result.status); } catch (error) { status.text = error instanceof Error ? error.message : String(error); } };
  load.addEventListener("click", run); slex.onDispose(() => load.removeEventListener("click", run));
</script>
```

Static validation does not contact JSONPlaceholder. The request occurs only after commit and user interaction, and only if host policy allows the bridge call.
