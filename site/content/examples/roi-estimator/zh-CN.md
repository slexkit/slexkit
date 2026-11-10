---
title: 自建还是外购决策
category: 决策辅助
status: published
order: 14
summary: 自建还是外购决策矩阵——功能覆盖、成本对比、时间线、风险四维度评估，自动推荐方案。
tags: build-vs-buy, decision, procurement, cost
components: card, grid, select, slider, stat, text
difficulty: 入门
runtime: secure
featured: true
slexkitRenderMode: component
---

# 自建还是外购决策

从功能匹配、成本、上线时间和供应商风险四个维度比较两种方案；评分仅用于演示。

```slex
<slex-card title="自建还是外购决策">
  <slex-select id="scope" label="功能定位"><option value="core">核心业务</option><option value="non-core">辅助功能</option></slex-select>
  <slex-grid columns="2">
    <slex-card title="自建方案"><slex-slider id="buildFit" label="功能匹配度" min="0" max="100" step="5" value="60"></slex-slider><slex-slider id="buildCost" label="成本评分（越低越好）" min="0" max="100" step="5" value="80"></slex-slider><slex-slider id="buildTime" label="上线时间（月）" min="1" max="12" value="6"></slex-slider></slex-card>
    <slex-card title="外购方案"><slex-slider id="buyFit" label="功能匹配度" min="0" max="100" step="5" value="85"></slex-slider><slex-slider id="buyCost" label="成本评分（越低越好）" min="0" max="100" step="5" value="40"></slex-slider><slex-slider id="buyTime" label="上线时间（月）" min="1" max="12" value="1"></slex-slider><slex-slider id="buyLock" label="供应商锁定风险" min="0" max="100" step="5" value="30"></slex-slider></slex-card>
  </slex-grid>
  <slex-grid columns="2"><slex-stat id="buildScore" label="自建综合得分"></slex-stat><slex-stat id="buyScore" label="外购综合得分"></slex-stat></slex-grid>
  <slex-text id="advice" label="比较说明"></slex-text>
</slex-card>
<script type="module">
  const get = id => slex.root.querySelector(`#${id}`);
  const ids = ["scope", "buildFit", "buildCost", "buildTime", "buyFit", "buyCost", "buyTime", "buyLock"];
  const copy = {"close": "两种方案接近，建议进一步验证。", "buildWins": "自建得分更高", "buyWins": "外购得分更高", "coreNote": "核心业务还应关注长期控制权。", "noncoreNote": "辅助功能也应考虑维护成本。"};
  const update = () => {
    const value = id => Number(get(id).value);
    const timeScore = id => Math.max(0, 100 - value(id) * 10);
    const build = (value("buildFit") + 100 - value("buildCost") + timeScore("buildTime")) / 3;
    const buy = (value("buyFit") + 100 - value("buyCost") + timeScore("buyTime") - value("buyLock") * 0.5) / 3;
    get("buildScore").value = build.toFixed(1); get("buyScore").value = buy.toFixed(1);
    const verdict = Math.abs(build - buy) < 10 ? copy.close : build > buy ? copy.buildWins : copy.buyWins;
    get("advice").text = `${verdict} ${get("scope").value === "core" ? copy.coreNote : copy.noncoreNote}`;
  };
  ids.forEach(id => get(id).addEventListener("input", update)); update();
  slex.onDispose(() => ids.forEach(id => get(id).removeEventListener("input", update)));
</script>
```

结果是可调整的示例评分，不代替实际预算、采购或风险评估。
