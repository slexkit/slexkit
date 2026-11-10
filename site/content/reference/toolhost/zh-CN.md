---
title: ToolHost
category: Reference
status: ready
order: 70
summary: "用于 confirmations、choices、forms 和 templates 的结构化用户输入 UI。"
slexkitRenderMode: component
---

# ToolHost

ToolHost 渲染确认、选项选择与表单填写等结构化工具请求。它是由宿主控制的工作流，与面向展示的普通 `slex` HTML 分开。工具结果必须经过明确的 submit/ignore 边界；不要让任意 artifact 代码伪装成工具提交。
