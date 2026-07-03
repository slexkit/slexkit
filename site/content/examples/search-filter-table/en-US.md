---
title: "Search and Filter Table"
category: "Data Browsing"
status: published
order: 10
summary: "A search input filters table rows in real time and uses collapsible for row details."
tags: search, filter, table, collapsible
components: section, card, input, table, collapsible, callout, stat
difficulty: Intermediate
runtime: trusted
featured: true
slexkitRenderMode: component
---

# Search and Filter Table

The table binds an `input` value to search keywords, generates filtered rows dynamically, and expands row details with `collapsible`.

```slex
{
  slex: "0.1",
  namespace: "example_search_filter",
  g: {
    query: "", selected: "", selectedItem: null,
    allItems: [
      { id: "btn-1", name: "Button", category: "Action", status: "ready", notes: "Supports variant and size." },
      { id: "card-1", name: "Card", category: "Layout", status: "ready", notes: "The most common grouping container." },
      { id: "input-1", name: "Input", category: "Input", status: "ready", notes: "Supports type, unit, and placeholder." },
      { id: "tabs-1", name: "Tabs", category: "Navigation", status: "ready", notes: "Supports horizontal and vertical orientation." },
      { id: "table-1", name: "Table", category: "Display", status: "ready", notes: "columns array + rows array." },
      { id: "formula-1", name: "Formula", category: "Display", status: "ready", notes: "Depends on KaTeX for LaTeX rendering." },
      { id: "toast-1", name: "Toast", category: "Feedback", status: "preview", notes: "Supports type variants." },
      { id: "secure-1", name: "Secure Runtime", category: "Tooling", status: "beta", notes: "Based on iframe sandbox." }
    ],
    filtered: function () {
      var q = this.query.toLowerCase();
      if (!q) return this.allItems;
      return this.allItems.filter(function (item) { return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q); });
    },
    matched: function () { return this.filtered().length; },
    select: function (id) { this.selected = this.selected === id ? "" : id; }
  },
  layout: {
    "section:search": {
      eyebrow: "Component Explorer",
      title: "Search and Filter Table",
      subtitle: "Type keywords to filter the component list in real time. Click any row for details.",
      "input:query": { label: "Search components", "$value": "g.query", type: "text", placeholder: "Type a name or category...", onchange: "g.query = String($event || '')" },
      "stat:matched": { "$label": "'Results'", "$value": "g.matched()", "$unit": "'/' + g.allItems.length + ' items'" },
      "table:list": {
        columns: ["Name", "Category", "Status", ""],
        "$rows": "g.filtered().map(function(item) { return [item.name, item.category, item.status, item.id]; })"
      },
      "callout:empty": {
        "$if": "g.matched() === 0",
        tone: "warning",
        "$text": "'No components matching 「' + g.query + '」 found.'"
      }
    }
  }
}
```

**Core techniques in the table:**

- `input`'s `onchange` updates `g.query` → triggers `g.filtered()` to recompute
- `g.filtered()` uses `filter` to filter the `allItems` array
- `"$rows"` dynamically computes a 2D array of rows — each item maps to one row
- `g.matched()` returns the filtered count, used by stat and callout for conditional display
- `$if` shows an empty result prompt when there are no matches

This is the basic pattern for input-driven table rows. Unlike hardcoded rows, dynamic rows can change in real time with input.

---

## Advanced: Expandable Row Details

```slex
{
  slex: "0.1",
  namespace: "example_search_filter",
  layout: {
    "section:detail": {
      eyebrow: "Component Details",
      title: "Selected Item Details",
      "accordion:faq": {
        multiple: true,
        items: [
          { value: "btn-1", label: "Button", icon: "cursor-click", content: "A basic component for triggering actions. Supports variants (solid/outline/ghost) and sizes (sm/md/lg)." },
          { value: "card-1", label: "Card", icon: "rectangle", content: "A content grouping container. One of the most commonly used layout components, lighter than section." },
          { value: "input-1", label: "Input", icon: "textbox", content: "Single-line or numeric input. Supports type, unit, placeholder and other attributes." }
        ]
      }
    }
  }
}
```

## Why Dynamic Rows Matter

A static table uses a hardcoded 2D `rows` array. When data volume grows or filters are needed, use `"$rows"` to generate row data in a `g` method:

- **In-document data browsing**: catalogs, API lists, configuration items
- **AI output display**: LLM-generated table results that need filtering
- **Knowledge base queries**: searching internal components/APIs/terminology
