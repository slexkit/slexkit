---
title: "Artifact Shared State Lab"
category: "Platform Features"
status: published
order: 15
summary: "Synchronize JSON state between three independent fences in the same artifact."
tags: artifact, shared-json, subscription
components: card, grid, input, select, slider, text, stat
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---
# Artifact Shared State Lab

Change the name, font size, or color in the control panel. The two independent panels below update through shared JSON.

## Control panel

```slex
<slex-card title="Control panel">
  <slex-grid columns="3">
    <slex-input id="name" label="Display name" value="SlexKit"></slex-input>
    <slex-slider id="size" label="Font size" min="12" max="30" value="18" unit="px"></slex-slider>
    <slex-select id="color" label="Text color"><option value="blue">Blue</option><option value="green">Green</option><option value="orange">Orange</option></slex-select>
  </slex-grid>
</slex-card>
<script type="module">
  const get = id => slex.root.querySelector(`#${id}`);
  const controls = ["name", "size", "color"].map(get);
  const publish = () => slex.shared.set("profile", { name: get("name").value, size: Number(get("size").value), color: get("color").value });
  controls.forEach(control => control.addEventListener("input", publish));
  publish();
  slex.onDispose(() => controls.forEach(control => control.removeEventListener("input", publish)));
</script>
```

## Live preview

This panel subscribes to the shared value.

```slex
<slex-card title="Live preview"><slex-text id="message"></slex-text></slex-card>
<script type="module">
  const message = slex.root.querySelector("#message");
  const stop = slex.shared.subscribe("profile", profile => {
    if (!profile) return;
    message.text = String(profile.name);
    message.size = Number(profile.size);
    message.color = ({ blue: "#2563eb", green: "#15803d", orange: "#c2410c" })[profile.color] || "#2563eb";
  });
  slex.onDispose(stop);
</script>
```

## Observer panel

A second independent fence subscribes to the same JSON.

```slex
<slex-card title="Observer panel"><slex-grid columns="2"><slex-stat id="nameValue" label="Current name"></slex-stat><slex-stat id="sizeValue" label="Font size" unit="px"></slex-stat></slex-grid></slex-card>
<script type="module">
  const stop = slex.shared.subscribe("profile", profile => {
    if (!profile) return;
    slex.root.querySelector("#nameValue").value = String(profile.name);
    slex.root.querySelector("#sizeValue").value = Number(profile.size);
  });
  slex.onDispose(stop);
</script>
```

The fences share JSON only, not DOM nodes or JavaScript globals. Subscriptions and listeners are cleaned up on disposal.
