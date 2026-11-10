---
title: "First Interaction: Button Counter"
category: "Getting Started"
status: published
order: 2
summary: "A button updates a stat through native click handling and live component properties."
tags: beginner, native-events, button
components: button, card, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# First Interaction: Button Counter

A native click listener updates the stat's live `.value` property and is released when the script scope is disposed.

```slex
<slex-card title="First Interaction: Button Counter"><slex-stat id="count" label="Count" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add"); const click = () => { count.value = Number(count.value) + 1; };
  add.addEventListener("click", click); slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

The stable element IDs let compatible commits retain the button/stat instances while script changes still replace their module scope cleanly.
