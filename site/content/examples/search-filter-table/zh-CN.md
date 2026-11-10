---
title: "搜索与过滤表格"
category: "数据浏览"
status: published
order: 10
summary: "搜索输入框实时过滤表格行，并用 collapsible 展开行详情。"
tags: search, filter, table, collapsible
components: card, input, table
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 搜索与过滤表格

搜索框过滤内存数组，并把匹配结果赋给表格的实时 `.rows` property。

```slex
<slex-card title="搜索与过滤表格"><slex-input id="query" label="筛选"></slex-input><slex-table id="results"></slex-table></slex-card>
<script type="module">
  const rows = [{ name: "Ada", role: "Engineer" }, { name: "Lin", role: "Designer" }]; const query = slex.root.querySelector("#query"); const table = slex.root.querySelector("#results");
  table.columns = [{ key: "name", label: "Name" }, { key: "role", label: "Role" }]; const update = () => { const needle = query.value.toLowerCase(); table.rows = rows.filter((row) => Object.values(row).some((value) => value.toLowerCase().includes(needle))); };
  query.addEventListener("input", update); update(); slex.onDispose(() => query.removeEventListener("input", update));
</script>
```

表格数据以数组形式通过 property 赋值，不会编码进 HTML attribute；文本单元格也不会按 HTML 解析。
