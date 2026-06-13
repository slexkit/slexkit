---
title: JSONPlaceholder 网络请求实验台
category: 平台能力
status: published
order: 16
summary: 用 JSONPlaceholder 演示 secure runtime 如何把用户触发的网络请求交给 host policy 审核和代理。
tags: network, fetch, host-policy, jsonplaceholder
components: card, select, slider, stat, code-block, callout, button, table, grid, row
difficulty: 进阶
runtime: secure
featured: true
slexkitRenderMode: component
---

# JSONPlaceholder 网络请求实验台

这个示例不再只是展示一段策略配置，而是让用户在沙盒内选择真实的网络任务：读取 posts、查看详情、拉取评论、按用户过滤，或者向 JSONPlaceholder 发起一个演示用 POST。请求不会从 iframe 直接出网，而是通过 `api.fetch()` 交给宿主，由宿主按 allowlist、方法、超时、请求体大小和响应类型决定是否代理。

```slex
{
  slex: "0.1",
  namespace: "example_jsonplaceholder_network_lab",
  g: {
    scenario: "posts",
    postId: 1,
    userId: 1,
    timeout: 3000,
    title: "SlexKit network demo",
    status: "未请求",
    statusCode: "-",
    elapsed: "-",
    response: "选择一个网络任务，然后点击“发起请求”。",
    lastUrl: "https://jsonplaceholder.typicode.com/posts",
    method: function () { return this.scenario === "create" ? "POST" : "GET"; },
    url: function () {
      if (this.scenario === "detail") return "https://jsonplaceholder.typicode.com/posts/" + this.postId;
      if (this.scenario === "comments") return "https://jsonplaceholder.typicode.com/posts/" + this.postId + "/comments";
      if (this.scenario === "user-posts") return "https://jsonplaceholder.typicode.com/users/" + this.userId + "/posts";
      if (this.scenario === "create") return "https://jsonplaceholder.typicode.com/posts";
      return "https://jsonplaceholder.typicode.com/posts?_limit=5";
    },
    requestBody: function () {
      if (this.scenario !== "create") return undefined;
      return {
        title: this.title,
        body: "这是一条从 SlexKit secure runtime 发起、由宿主代理的演示请求。",
        userId: this.userId
      };
    },
    description: function () {
      if (this.scenario === "detail") return "读取单篇 post，适合详情页或引用卡片。";
      if (this.scenario === "comments") return "读取某篇 post 的评论，适合评论摘要、审阅流和证据面板。";
      if (this.scenario === "user-posts") return "按用户读取 posts，适合个人空间、作者档案或关联资源列表。";
      if (this.scenario === "create") return "提交一条演示 post。JSONPlaceholder 会返回假写入结果，不会持久化。";
      return "读取最新 posts 列表，适合 feed、任务列表和知识库索引。";
    },
    riskText: function () {
      if (this.method() === "POST") return "POST 已被限制为 JSONPlaceholder origin，且请求体大小受 policy 约束。";
      return "GET 请求仍然要经过 origin、超时、响应大小和 content-type 校验。";
    },
    requestSnippet: function () {
      var body = this.requestBody();
      var lines = [
        "await api.fetch('" + this.url() + "', {",
        "  method: '" + this.method() + "',",
        "  timeoutMs: " + this.timeout + ","
      ];
      if (body) lines.push("  body: " + JSON.stringify(body, null, 2).replace(/\n/g, "\n  ") + ",");
      lines.push("  credentials: 'omit'");
      lines.push("})");
      return lines.join("\n");
    },
    policyRows: function () {
      return [
        { item: "Origin", value: "https://jsonplaceholder.typicode.com", reason: "只允许演示 API" },
        { item: "Method", value: "GET, POST", reason: "读列表/详情和创建演示数据" },
        { item: "Credentials", value: "omit", reason: "不携带 cookie 或站点身份" },
        { item: "Content-Type", value: "application/json", reason: "拒绝非 JSON 响应进入沙盒" },
        { item: "Body", value: "<= 4096 bytes", reason: "避免大请求体被模型输出滥用" }
      ];
    },
    async run(api) {
      var targetUrl = String(this.url());
      this.status = "请求中";
      this.statusCode = "-";
      this.elapsed = "-";
      this.lastUrl = targetUrl;
      this.response = "等待宿主代理 " + this.method() + " " + targetUrl;
      try {
        var result = await api.fetch(targetUrl, {
          method: this.method(),
          timeoutMs: this.timeout,
          body: this.requestBody(),
          credentials: "omit"
        });
        this.status = result.ok ? "成功" : "HTTP 错误";
        this.statusCode = String(result.status) + " " + result.statusText;
        this.elapsed = Math.round(result.elapsedMs) + " ms";
        this.response = JSON.stringify(result.data === undefined ? result.text : result.data, null, 2).slice(0, 2400);
      } catch (error) {
        this.status = api.isPolicyError(error) ? "Policy 拦截" : api.isTimeoutError(error) ? "超时" : "网络失败";
        this.statusCode = api.isPolicyError(error) ? "policy" : api.isTimeoutError(error) ? "timeout" : "network";
        var elapsedMs = error && typeof error === "object" && typeof error.elapsedMs === "number" ? error.elapsedMs : undefined;
        this.elapsed = elapsedMs === undefined ? "-" : Math.round(elapsedMs) + " ms";
        this.response = targetUrl + "\n" + api.errorMessage(error);
      }
    },
    async runBlocked(api) {
      var targetUrl = "https://example.com/posts/1";
      this.status = "请求中";
      this.statusCode = "-";
      this.elapsed = "-";
      this.lastUrl = targetUrl;
      this.response = "这次请求故意访问 allowlist 外的 origin，应该被 host policy 拦截。";
      try {
        await api.get(targetUrl, { timeoutMs: this.timeout, credentials: "omit" });
        this.status = "异常通过";
        this.statusCode = "unexpected";
        this.response = "如果看到这行，说明 policy 没有按预期拦截。";
      } catch (error) {
        this.status = api.isPolicyError(error) ? "Policy 拦截" : "失败";
        this.statusCode = api.isPolicyError(error) ? "origin_blocked" : "network";
        this.response = targetUrl + "\n" + api.errorMessage(error);
      }
    }
  },
  layout: {
    "card:network": {
      title: "JSONPlaceholder 请求实验台",
      "callout:intent": { tone: "info", "$text": "g.description()" },
      "grid:controls": {
        columns: 1,
        mdColumns: 2,
        "select:scenario": {
          label: "网络任务",
          "$value": "g.scenario",
          options: [
            { label: "Posts 列表 GET /posts", value: "posts" },
            { label: "Post 详情 GET /posts/:id", value: "detail" },
            { label: "评论列表 GET /posts/:id/comments", value: "comments" },
            { label: "用户 posts GET /users/:id/posts", value: "user-posts" },
            { label: "创建 post POST /posts", value: "create" }
          ],
          onchange: "g.scenario = String($event)"
        },
        "slider:postId": { label: "Post ID", "$value": "g.postId", min: 1, max: 10, step: 1, onchange: "g.postId = Number($event)" },
        "slider:userId": { label: "User ID", "$value": "g.userId", min: 1, max: 10, step: 1, onchange: "g.userId = Number($event)" },
        "slider:timeout": { label: "超时上限", "$value": "g.timeout", min: 500, max: 8000, step: 500, unit: "ms", onchange: "g.timeout = Number($event)" }
      },
      "row:actions": {
        "button:run": { label: "发起请求", icon: "paper-plane-tilt", onclick: "g.run(api)" },
        "button:block": { label: "测试拦截", variant: "secondary", icon: "shield-warning", onclick: "g.runBlocked(api)" }
      },
      "grid:status": {
        columns: 1,
        mdColumns: 3,
        "stat:method": { label: "方法", "$value": "g.method()" },
        "stat:status": { label: "状态", "$value": "g.status" },
        "stat:elapsed": { label: "耗时", "$value": "g.elapsed" }
      },
      "code-block:request": { title: "沙盒内请求代码", language: "ts", "$code": "g.requestSnippet()" },
      "code-block:response": { title: "宿主代理响应", language: "json", "$code": "g.response" },
      "table:policy_matrix": {
        columns: [
          { key: "item", label: "Policy 项" },
          { key: "value", label: "允许值" },
          { key: "reason", label: "原因" }
        ],
        "$rows": "g.policyRows()"
      },
      "callout:policy_note": { "$tone": "g.status === 'Policy 拦截' ? 'warning' : 'success'", "$text": "g.riskText()" }
    }
  }
}
```

Fallback：如果宿主没有开启网络 policy，或者用户请求了 allowlist 外的 origin，界面应该保留最后一次请求意图、展示 policy 错误，并提示用户由宿主审批或改用缓存快照。
