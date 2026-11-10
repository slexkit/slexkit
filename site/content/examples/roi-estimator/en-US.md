---
title: Build vs Buy Decision
category: Decision Support
status: published
order: 14
summary: A build-vs-buy decision matrix — four-dimension evaluation across feature coverage, cost, timeline, and risk with automatic recommendation.
tags: build-vs-buy, decision, procurement, cost
components: card, grid, select, slider, stat, text
difficulty: Beginner
runtime: secure
featured: true
slexkitRenderMode: component
---

# Build vs Buy Decision

Compare feature fit, cost, delivery time, and vendor risk. The scores are illustrative.

```slex
<slex-card title="Build vs Buy Decision">
  <slex-select id="scope" label="Function role"><option value="core">Core business</option><option value="non-core">Supporting function</option></slex-select>
  <slex-grid columns="2">
    <slex-card title="Build"><slex-slider id="buildFit" label="Feature fit" min="0" max="100" step="5" value="60"></slex-slider><slex-slider id="buildCost" label="Cost score (lower is better)" min="0" max="100" step="5" value="80"></slex-slider><slex-slider id="buildTime" label="Time to launch (months)" min="1" max="12" value="6"></slex-slider></slex-card>
    <slex-card title="Buy"><slex-slider id="buyFit" label="Feature fit" min="0" max="100" step="5" value="85"></slex-slider><slex-slider id="buyCost" label="Cost score (lower is better)" min="0" max="100" step="5" value="40"></slex-slider><slex-slider id="buyTime" label="Time to launch (months)" min="1" max="12" value="1"></slex-slider><slex-slider id="buyLock" label="Vendor lock-in risk" min="0" max="100" step="5" value="30"></slex-slider></slex-card>
  </slex-grid>
  <slex-grid columns="2"><slex-stat id="buildScore" label="Build score"></slex-stat><slex-stat id="buyScore" label="Buy score"></slex-stat></slex-grid>
  <slex-text id="advice" label="Decision notes"></slex-text>
</slex-card>
<script type="module">
  const get = id => slex.root.querySelector(`#${id}`);
  const ids = ["scope", "buildFit", "buildCost", "buildTime", "buyFit", "buyCost", "buyTime", "buyLock"];
  const copy = {"close": "The scores are close; investigate both options further.", "buildWins": "Build scores higher", "buyWins": "Buy scores higher", "coreNote": "For core capabilities, also consider long-term control.", "noncoreNote": "For supporting capabilities, also consider maintenance cost."};
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

These adjustable example scores do not replace a real budget, procurement, or risk assessment.
