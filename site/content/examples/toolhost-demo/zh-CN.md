---
title: "发布计划确认"
category: "配置向导"
status: published
order: 13
summary: "ToolHost 回放发布计划流程，并在关键节点收集发布参数。"
tags: toolhost, dialog, demo, live
components: toolhost, card, radio-group, input, button
difficulty: 进阶
runtime: trusted
featured: true
slexkitRenderMode: dialog
---

# 发布计划确认

该示例回放一次 Web 控制台发布计划。流程到达人工输入节点时，页面会暂停并渲染对应的 ToolHost 卡片：先确认发布策略，再补充窗口、负责人和回滚条件，最后确认是否采用计划。

该示例是纯前端 fixture：不连接模型，不执行发布。协议细节收在底部事件区。
