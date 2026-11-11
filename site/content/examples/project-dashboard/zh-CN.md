---
title: "项目仪表盘"
category: "仪表盘"
status: published
order: 11
summary: "用 section + grid 搭建信息仪表盘，覆盖 Sprint 进度、质量指标和团队健康度的多卡片联动。"
tags: dashboard, sprint, metrics, team
components: section, card, grid, input, slider, select, stat, progress, badge, table, text
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# 项目仪表盘

该仪表盘组合卡片、网格、控件与指标，并由一个 JavaScript 更新函数统一协调项目数据。

```slex
<slex-section title="Sprint 项目仪表盘" subtitle="调整数据，观察进度、质量与团队负载。">
  <slex-grid columns="3">
    <slex-card title="Sprint 进度">
      <slex-slider id="progress" label="完成度" value="72" min="0" max="100" unit="%"></slex-slider>
      <slex-progress id="progressBar" label="完成度"></slex-progress>
      <slex-select id="scope" label="范围状态"><option value="on-track">正常</option><option value="at-risk">有风险</option><option value="off-track">已偏离</option></slex-select>
      <slex-badge id="scopeBadge"></slex-badge>
    </slex-card>
    <slex-card title="质量指标">
      <slex-input id="bugs" type="number" min="0" label="缺陷总数" value="12"></slex-input>
      <slex-input id="resolved" type="number" min="0" label="已修复" value="9"></slex-input>
      <slex-stat id="remaining" label="剩余缺陷" unit="个"></slex-stat>
      <slex-progress id="fixRate" label="修复率"></slex-progress>
    </slex-card>
    <slex-card title="团队健康度">
      <slex-input id="workload" type="number" min="0" label="工作量" value="8"></slex-input>
      <slex-input id="team" type="number" min="1" label="团队成员" value="6"></slex-input>
      <slex-stat id="load" label="负载指数" unit="%"></slex-stat>
      <slex-text id="note"></slex-text>
    </slex-card>
  </slex-grid>
  <slex-card title="任务明细"><div style="overflow-x: auto"><slex-table id="tasks" style="min-width: 300px"></slex-table></div></slex-card>
</slex-section>
<script type="module">
  const get = id => slex.root.querySelector(`#${id}`);
  const controls = ["progress", "scope", "bugs", "resolved", "workload", "team"].map(get);
  const statuses = { "on-track": ["正常", "success"], "at-risk": ["有风险", "warning"], "off-track": ["已偏离", "destructive"] };
  const update = () => {
    const bugs = Math.max(0, Number(get("bugs").value) || 0);
    const resolved = Math.min(bugs, Math.max(0, Number(get("resolved").value) || 0));
    const team = Math.max(1, Number(get("team").value) || 1);
    const load = Math.min(100, Math.max(0, Number(get("workload").value) || 0) / team * 20);
    const [label, tone] = statuses[get("scope").value] || statuses["on-track"];
    get("progressBar").value = Number(get("progress").value);
    get("scopeBadge").label = label; get("scopeBadge").tone = tone;
    get("remaining").value = bugs - resolved;
    get("fixRate").value = bugs ? resolved / bugs * 100 : 0;
    get("load").value = load.toFixed(1);
    get("note").text = load > 80 ? "团队负载偏高，建议调整任务分配。" : "团队负载在健康范围内。";
  };
  get("tasks").columns = ["任务", "负责人", "状态"];
  get("tasks").rows = [["API 重构", "张三", "已完成"], ["前端组件", "李四", "进行中"], ["集成测试", "王五", "代码审查"]];
  controls.forEach(control => control.addEventListener("input", update));
  update();
  slex.onDispose(() => controls.forEach(control => control.removeEventListener("input", update)));
</script>
```

数据保存在组件 property 与普通 JavaScript 中，不依赖隐藏 namespace store 或表达式求值器。
