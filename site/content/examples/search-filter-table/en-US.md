---
title: "Search and Filter Table"
category: "Data Browsing"
status: published
order: 10
summary: "A search input filters table rows in real time and uses collapsible for row details."
tags: search, filter, table, collapsible
components: card, input, table
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Search and Filter Table

The search input filters an in-memory array and assigns the matching rows to the table's live `.rows` property.

```slex
<slex-card title="Search and Filter Table"><slex-input id="query" label="Filter"></slex-input><slex-table id="results"></slex-table></slex-card>
<script type="module">
  const rows = [{ name: "Ada", role: "Engineer" }, { name: "Lin", role: "Designer" }]; const query = slex.root.querySelector("#query"); const table = slex.root.querySelector("#results");
  table.columns = [{ key: "name", label: "Name" }, { key: "role", label: "Role" }]; const update = () => { const needle = query.value.toLowerCase(); table.rows = rows.filter((row) => Object.values(row).some((value) => value.toLowerCase().includes(needle))); };
  query.addEventListener("input", update); update(); slex.onDispose(() => query.removeEventListener("input", update));
</script>
```

Table data is assigned as arrays through properties rather than encoded into HTML attributes, and text cells are not parsed as HTML.
