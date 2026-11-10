---
title: 安全运行时契约
category: Reference
status: ready
order: 50
summary: "威胁模型、沙箱 iframe 部署、宿主策略、消息桥接与失败关闭行为。"
slexkitRenderMode: component
---

# 安全运行时契约

隔离 frame 是代码执行边界。宿主与 guest 之间的消息会校验来源 window、通道 token、请求 ID、revision 与 payload 结构；旧响应不能覆盖更新的 revision。preview 只检查新源码，并让上一次 commit 的视图继续可交互。

静态检查可减少误用，但不能证明代码安全。宿主桥接默认不暴露网络操作，只有策略允许的调用才能通过 `slex.api`。不存在把 payload 改为宿主页内联执行的逃生开关。

受支持浏览器中的 frame 策略会拒绝 payload 发起的 fetch、图片、字体、外部脚本和外部 link 资源加载，包括带 nonce 的资源。这不是完整的出口防火墙：iframe 自身导航仍可发出请求。运行时也不提供 CPU 抢占；敌意执行需要浏览器/进程外部控制与超时。
