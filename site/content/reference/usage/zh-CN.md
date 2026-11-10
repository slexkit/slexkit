---
title: Slex 用法参考
category: Reference
status: ready
order: 20
summary: "HTML 源码结构、attribute、live property、原生事件、slot、主题与生命周期钩子。"
slexkitRenderMode: component
---

# Slex 用法参考

```slex
<slex-card title="Counter"><slex-stat id="count" label="Count" value="0"></slex-stat><slex-button id="add" label="Add"></slex-button></slex-card>
<script type="module">
  const count = slex.root.querySelector("#count"); const add = slex.root.querySelector("#add");
  const click = () => { count.value = Number(count.value) + 1; }; add.addEventListener("click", click);
  slex.onDispose(() => add.removeEventListener("click", click));
</script>
```

标量初值使用 attribute，实时值使用 DOM property。布尔 attribute 按“是否存在”判断。按照自定义元素 manifest 监听 `input`、`change` 与 `click`；表格的 columns/rows 是通过 property 赋值的数组。没有对应自定义元素时，应使用原生 HTML。
