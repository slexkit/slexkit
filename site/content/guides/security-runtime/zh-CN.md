---
title: 安全运行时接入
category: Guides
status: ready
order: 40
summary: "在隔离 HTML 文档宿主中运行未经审查的用户输入、第三方 Markdown 或 agent 输出。"
slexkitRenderMode: component
---

# 安全运行时接入

生成的 HTML 和 JavaScript 在隔离 frame 中运行。Shadow DOM 只负责 DOM/样式封装，并不是安全沙箱。静态检查不会执行脚本，并会拒绝外部脚本/import、内联事件属性、嵌入式 frame/插件、导航元数据与可执行 URL scheme。

宿主必须提供有效的运行时 URL，加载失败时按失败关闭处理。受支持浏览器中的 frame 策略会拒绝 payload 发起的 fetch、图片、字体、外部脚本和外部 link 资源加载；获准请求通过策略控制的 `slex.api`。

这不是通用网络出口防火墙：payload 可以用 `location.href` 导航自己的沙箱 iframe，而导航可能发出网络请求。SlexKit 也不能抢占任意计算；敌意代码需要浏览器/进程外部的网络控制与超时。
