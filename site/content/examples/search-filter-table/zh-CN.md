---
title: "搜索与过滤表格"
category: "数据浏览"
status: published
order: 10
summary: "搜索输入框实时过滤表格行，并用 collapsible 展开行详情。"
tags: search, filter, table, collapsible
components: section, card, input, table, collapsible, callout, stat
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: component
---

# 搜索与过滤表格

`input` 绑定搜索关键词，动态 `table` 生成过滤后的行，`collapsible` 负责展开行详情。

```slex
{
  slex: "0.1",
  namespace: "example_search_filter",
  g: {
    query: "", selected: "", selectedItem: null,
    allItems: [
      { id: "btn-1", name: "Button 按钮", category: "Action", status: "ready", notes: "支持 variant 和 size。" },
      { id: "card-1", name: "Card 卡片", category: "Layout", status: "ready", notes: "最常用的分组容器。" },
      { id: "input-1", name: "Input 输入框", category: "Input", status: "ready", notes: "支持 type、unit 和 placeholder。" },
      { id: "tabs-1", name: "Tabs 选项卡", category: "Navigation", status: "ready", notes: "支持水平和垂直方向。" },
      { id: "table-1", name: "Table 表格", category: "Display", status: "ready", notes: "columns 数组 + rows 数组。" },
      { id: "formula-1", name: "Formula 公式", category: "Display", status: "ready", notes: "依赖 KaTeX 渲染 LaTeX。" },
      { id: "toast-1", name: "Toast 通知", category: "Feedback", status: "ready", notes: "支持 type 变体。" },
      { id: "secure-1", name: "Secure 安全运行时", category: "Tooling", status: "ready", notes: "在 iframe 沙箱中运行不可信 source。" }
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
      eyebrow: "组件查询",
      title: "搜索与过滤表格",
      subtitle: "输入关键词实时过滤组件列表，点击任意行查看详情。",
      "input:query": { label: "搜索组件", "$value": "g.query", type: "text", placeholder: "输入名称或分类关键词...", onchange: "g.query = String($event || '')" },
      "stat:matched": { "$label": "'匹配结果'", "$value": "g.matched()", "$unit": "'/' + g.allItems.length + ' 项'" },
      "table:list": {
        columns: ["名称", "分类", "状态", ""],
        "$rows": "g.filtered().map(function(item) { return [item.name, item.category, item.status, item.id]; })"
      },
      "callout:empty": {
        "$if": "g.matched() === 0",
        tone: "warning",
        "$text": "'未找到匹配「' + g.query + '」的组件。'"
      }
    }
  }
}
```

**实现要点：**

- `input` 的 `onchange` 更新 `g.query` → 触发 `g.filtered()` 重新计算
- `g.filtered()` 用 `filter` 过滤 `allItems` 数组
- `"$rows"` 动态计算行的二维数组——每个 item 映射为一行
- `g.matched()` 返回过滤后数量，用于 stat 和 callout 的条件显示
- `$if` 在无匹配时显示空结果提示

这是 `input` 驱动动态表格的基本模式。相比硬编码 rows，动态 rows 可以随输入实时变化。

---

## 进阶玩法：展开行详情

```slex
{
  slex: "0.1",
  namespace: "example_search_filter",
  layout: {
    "section:detail": {
      eyebrow: "组件详情",
      title: "选中查看详情",
      "accordion:faq": {
        multiple: true,
        items: [
          { value: "btn-1", label: "Button 按钮", icon: "cursor-click", content: "触发操作的基础组件。支持 variant (solid/outline/ghost) 和 size (sm/md/lg) 等变体。" },
          { value: "card-1", label: "Card 卡片", icon: "rectangle", content: "内容分组容器。最常用的布局组件之一，比 section 更轻量。" },
          { value: "input-1", label: "Input 输入框", icon: "textbox", content: "单行或数字输入。支持 type、unit、placeholder 等属性。" }
        ]
      }
    }
  }
}
```

## 为什么动态 rows 值得学？

静态表格的 `rows` 是硬编码二维数组。数据量增加或需要条件筛选时，可以用 `"$rows"` 在 `g` 方法中动态生成行数据：

- **文档内数据浏览**：目录、API 列表、配置项
- **AI 输出展示**：大模型生成的表格结果需要可筛选
- **知识库查询**：搜索内部组件/API/术语

---

