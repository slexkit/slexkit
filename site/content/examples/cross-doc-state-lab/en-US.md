---
title: "Artifact Shared JSON Lab"
category: "Platform Features"
status: published
order: 15
summary: "Publish and subscribe to bounded JSON through artifact-local slex.shared without sharing DOM or module globals."
tags: artifact, shared-json, subscription
components: card, input, text
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Artifact Shared JSON Lab

The input publishes a JSON string through `slex.shared`; a subscription reflects the artifact-local value without sharing DOM or module globals.

```slex
<slex-card title="Artifact Shared JSON Lab"><slex-input id="name" label="Shared name" value="SlexKit"></slex-input><slex-text id="mirror"></slex-text></slex-card>
<script type="module">
  const input = slex.root.querySelector("#name"); const mirror = slex.root.querySelector("#mirror");
  const publish = () => slex.shared.set("name", input.value); const unsubscribe = slex.shared.subscribe("name", (value) => { mirror.text = String(value ?? ""); });
  input.addEventListener("input", publish); publish(); slex.onDispose(() => { input.removeEventListener("input", publish); unsubscribe(); });
</script>
```

The unsubscribe function and input listener are both released through `slex.onDispose` when this module scope is replaced.
