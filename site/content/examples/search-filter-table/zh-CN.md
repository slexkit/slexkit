---
title: "搜索与过滤表格"
category: "数据浏览"
status: published
order: 10
summary: "搜索输入框实时过滤表格行，并用 collapsible 展开行详情。"
tags: search, filter, table, collapsible
components: card, input, table, collapsible
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 搜索与过滤表格

搜索框过滤内存数组，并把匹配结果赋给表格的实时 `.rows` property。

```slex
<slex-card title="搜索与过滤表格"><slex-input id="query" label="筛选"></slex-input><slex-table id="results"></slex-table><div id="details"></div></slex-card>
<script type="module">
  const rows = [{ name: "Ada", role: "Engineer" }, { name: "Lin", role: "Designer" }]; const query = slex.root.querySelector("#query"); const table = slex.root.querySelector("#results");
  const details = slex.root.querySelector("#details");
  table.columns = [{ key: "name", label: "姓名" }, { key: "role", label: "角色" }];
  const update = () => {
    const needle = query.value.toLowerCase();
    const matches = rows.filter((row) => Object.values(row).some((value) => value.toLowerCase().includes(needle)));
    table.rows = matches;
    details.replaceChildren(...matches.map((row) => {
      const item = document.createElement("slex-collapsible");
      item.setAttribute("trigger", `${row.name} — 详情`);
      item.setAttribute("content", `角色：${row.role}`);
      return item;
    }));
  };
  query.addEventListener("input", update); update(); slex.onDispose(() => query.removeEventListener("input", update));
</script>
```

表格数据以数组形式通过 property 赋值，不会编码进 HTML attribute；可在表格下展开匹配行的详情，文本不会按 HTML 解析。
