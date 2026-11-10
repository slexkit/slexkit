---
title: "Project Dashboard"
category: "Dashboard"
status: published
order: 11
summary: "Build an information dashboard with section + grid — covering Sprint progress, quality metrics, and team health with multi-card coordination."
tags: dashboard, sprint, metrics, team
components: section, card, grid, input, slider, select, stat, progress, badge, table, text
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# Project Dashboard

The dashboard composes cards, grids, controls, and stats while one JavaScript update function coordinates the displayed project metrics.

```slex
<slex-section title="Sprint dashboard" subtitle="Adjust the inputs to explore progress, quality, and team load.">
  <slex-grid columns="3">
    <slex-card title="Sprint progress">
      <slex-slider id="progress" label="Completion" value="72" min="0" max="100" unit="%"></slex-slider>
      <slex-progress id="progressBar" label="Completion"></slex-progress>
      <slex-select id="scope" label="Scope status"><option value="on-track">On track</option><option value="at-risk">At risk</option><option value="off-track">Off track</option></slex-select>
      <slex-badge id="scopeBadge"></slex-badge>
    </slex-card>
    <slex-card title="Quality">
      <slex-input id="bugs" type="number" min="0" label="Total defects" value="12"></slex-input>
      <slex-input id="resolved" type="number" min="0" label="Resolved" value="9"></slex-input>
      <slex-stat id="remaining" label="Remaining defects"></slex-stat>
      <slex-progress id="fixRate" label="Resolution rate"></slex-progress>
    </slex-card>
    <slex-card title="Team health">
      <slex-input id="workload" type="number" min="0" label="Workload" value="8"></slex-input>
      <slex-input id="team" type="number" min="1" label="Team members" value="6"></slex-input>
      <slex-stat id="load" label="Load index" unit="%"></slex-stat>
      <slex-text id="note"></slex-text>
    </slex-card>
  </slex-grid>
  <slex-card title="Task details"><slex-table id="tasks"></slex-table></slex-card>
</slex-section>
<script type="module">
  const get = id => slex.root.querySelector(`#${id}`);
  const controls = ["progress", "scope", "bugs", "resolved", "workload", "team"].map(get);
  const statuses = { "on-track": ["On track", "success"], "at-risk": ["At risk", "warning"], "off-track": ["Off track", "destructive"] };
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
    get("note").text = load > 80 ? "Team load is high; consider redistributing work." : "Team load is within the healthy range.";
  };
  get("tasks").columns = ["Task", "Owner", "Status"];
  get("tasks").rows = [["API refactor", "Alex", "Done"], ["UI components", "Lee", "In progress"], ["Integration tests", "Sam", "Review"]];
  controls.forEach(control => control.addEventListener("input", update));
  update();
  slex.onDispose(() => controls.forEach(control => control.removeEventListener("input", update)));
</script>
```

The values stay in component properties and ordinary JavaScript; no hidden namespace store or expression evaluator participates.
