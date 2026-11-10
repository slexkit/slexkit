---
title: "Artifact 共享状态实验室"
category: "平台能力"
status: published
order: 15
summary: "同一篇文档中的三个独立 fence 通过 artifact-local slex.shared 同步 JSON 状态。"
tags: artifact, shared-json, subscription
components: card, grid, input, select, slider, text, stat
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---
# Artifact 共享状态实验室

修改主控面板的名称、字号或颜色，下面两个独立的交互块会同步更新。

## 主控面板

```slex
<slex-card title="主控面板">
  <slex-grid columns="3">
    <slex-input id="name" label="显示名称" value="SlexKit"></slex-input>
    <slex-slider id="size" label="字号" min="12" max="30" value="18" unit="px"></slex-slider>
    <slex-select id="color" label="文字颜色"><option value="blue">蓝色</option><option value="green">绿色</option><option value="orange">橙色</option></slex-select>
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

## 实时预览

此面板通过订阅接收共享值。

```slex
<slex-card title="实时预览"><slex-text id="message"></slex-text></slex-card>
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

## 观察面板

第二个独立 fence 订阅同一份 JSON。

```slex
<slex-card title="观察面板"><slex-grid columns="2"><slex-stat id="nameValue" label="当前名称"></slex-stat><slex-stat id="sizeValue" label="字号" unit="px"></slex-stat></slex-grid></slex-card>
<script type="module">
  const stop = slex.shared.subscribe("profile", profile => {
    if (!profile) return;
    slex.root.querySelector("#nameValue").value = String(profile.name);
    slex.root.querySelector("#sizeValue").value = Number(profile.size);
  });
  slex.onDispose(stop);
</script>
```

各 fence 只有共享的 JSON，没有共享 DOM 或 JavaScript 全局对象。每个订阅和事件监听器都会在释放时清理。
