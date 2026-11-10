---
title: Slex Usage Reference
category: Reference
status: ready
order: 20
summary: "HTML source structure, attributes, live properties, native events, slots, theming, and lifecycle hooks."
slexkitRenderMode: component
---

# Slex Usage Reference

```slex
<slex-card title="Counter"><slex-stat id="count" label="Count" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add");
  const click = () => { count.value = Number(count.value) + 1; }; add.addEventListener("click", click);
  slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

Use attributes for scalar initial values and DOM properties for live values. Boolean attributes use presence semantics. Listen to `input`, `change`, and `click` as documented by the custom-elements manifest. Table columns/rows are arrays assigned through properties. Native HTML is the supported alternative when no custom element exists.
