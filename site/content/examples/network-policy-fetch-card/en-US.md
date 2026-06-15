---
title: JSONPlaceholder Network Request Lab
category: Platform Features
status: published
order: 16
summary: Uses JSONPlaceholder to demonstrate how the secure runtime delegates user-triggered network requests to host policy for review and proxying.
tags: network, fetch, host-policy, jsonplaceholder
components: card, select, slider, stat, code-block, callout, button, table, grid, row
difficulty: Intermediate
runtime: secure
featured: true
slexkitRenderMode: component
---

# JSONPlaceholder Network Request Lab

This example goes beyond showing a policy configuration — it lets users select real network tasks inside the sandbox: read posts, view details, pull comments, filter by user, or send a demo POST to JSONPlaceholder. Requests don't leave the iframe directly; they go through `api.fetch()` to the host, which decides whether to proxy based on allowlist, method, timeout, body size, and response type.

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
    status: "Not requested",
    statusCode: "-",
    elapsed: "-",
    response: "Select a network task, then click 'Send request'.",
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
        body: "A demo request from SlexKit secure runtime, proxied by the host.",
        userId: this.userId
      };
    },
    description: function () {
      if (this.scenario === "detail") return "Read a single post — suitable for detail pages or citation cards.";
      if (this.scenario === "comments") return "Read comments on a post — suitable for comment summaries, review flows, and evidence panels.";
      if (this.scenario === "user-posts") return "Read posts by user — suitable for personal spaces, author profiles, or related resource lists.";
      if (this.scenario === "create") return "Submit a demo post. JSONPlaceholder returns a fake write result — nothing is persisted.";
      return "Read the latest posts list — suitable for feeds, task lists, and knowledge base indexes.";
    },
    riskText: function () {
      if (this.method() === "POST") return "POST is restricted to the JSONPlaceholder origin, and request body size is constrained by policy.";
      return "GET requests still go through origin, timeout, response size, and content-type validation.";
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
        { item: "Origin", value: "https://jsonplaceholder.typicode.com", reason: "Demo API only" },
        { item: "Method", value: "GET, POST", reason: "Read lists/details and create demo data" },
        { item: "Credentials", value: "omit", reason: "No cookies or site identity" },
        { item: "Content-Type", value: "application/json", reason: "Reject non-JSON responses in sandbox" },
        { item: "Body", value: "<= 4096 bytes", reason: "Prevent large request body abuse" }
      ];
    },
    async run(api) {
      var targetUrl = String(this.url());
      this.status = "Requesting";
      this.statusCode = "-";
      this.elapsed = "-";
      this.lastUrl = targetUrl;
      this.response = "Waiting for host proxy " + this.method() + " " + targetUrl;
      try {
        var result = await api.fetch(targetUrl, {
          method: this.method(),
          timeoutMs: this.timeout,
          body: this.requestBody(),
          credentials: "omit"
        });
        this.status = result.ok ? "Success" : "HTTP Error";
        this.statusCode = String(result.status) + " " + result.statusText;
        this.elapsed = Math.round(result.elapsedMs) + " ms";
        this.response = JSON.stringify(result.data === undefined ? result.text : result.data, null, 2).slice(0, 2400);
      } catch (error) {
        this.status = api.isPolicyError(error) ? "Policy Blocked" : api.isTimeoutError(error) ? "Timeout" : "Network Error";
        this.statusCode = api.isPolicyError(error) ? "policy" : api.isTimeoutError(error) ? "timeout" : "network";
        var elapsedMs = error && typeof error === "object" && typeof error.elapsedMs === "number" ? error.elapsedMs : undefined;
        this.elapsed = elapsedMs === undefined ? "-" : Math.round(elapsedMs) + " ms";
        this.response = targetUrl + "\n" + api.errorMessage(error);
      }
    },
    async runBlocked(api) {
      var targetUrl = "https://example.com/posts/1";
      this.status = "Requesting";
      this.statusCode = "-";
      this.elapsed = "-";
      this.lastUrl = targetUrl;
      this.response = "This request intentionally targets an origin outside the allowlist — it should be blocked by host policy.";
      try {
        await api.get(targetUrl, { timeoutMs: this.timeout, credentials: "omit" });
        this.status = "Unexpected pass";
        this.statusCode = "unexpected";
        this.response = "If you see this, the policy didn't block as expected.";
      } catch (error) {
        this.status = api.isPolicyError(error) ? "Policy Blocked" : "Failed";
        this.statusCode = api.isPolicyError(error) ? "origin_blocked" : "network";
        this.response = targetUrl + "\n" + api.errorMessage(error);
      }
    }
  },
  layout: {
    "section:network": {
      eyebrow: "Platform Features",
      title: "JSONPlaceholder Network Request Lab",
      subtitle: "Select network tasks inside the sandbox — requests go through host policy proxy.",
      "card:network": {
        title: "JSONPlaceholder Request Lab",
      "callout:intent": { tone: "info", "$text": "g.description()" },
      "grid:controls": {
        columns: 1,
        mdColumns: 2,
        "select:scenario": {
          label: "Network task",
          "$value": "g.scenario",
          options: [
            { label: "Posts list GET /posts", value: "posts" },
            { label: "Post detail GET /posts/:id", value: "detail" },
            { label: "Comments GET /posts/:id/comments", value: "comments" },
            { label: "User posts GET /users/:id/posts", value: "user-posts" },
            { label: "Create post POST /posts", value: "create" }
          ],
          onchange: "g.scenario = String($event)"
        },
        "slider:postId": { label: "Post ID", "$value": "g.postId", min: 1, max: 10, step: 1, onchange: "g.postId = Number($event)" },
        "slider:userId": { label: "User ID", "$value": "g.userId", min: 1, max: 10, step: 1, onchange: "g.userId = Number($event)" },
        "slider:timeout": { label: "Timeout limit", "$value": "g.timeout", min: 500, max: 8000, step: 500, unit: "ms", onchange: "g.timeout = Number($event)" }
      },
      "row:actions": {
        "button:run": { label: "Send request", icon: "paper-plane-tilt", onclick: "g.run(api)" },
        "button:block": { label: "Test block", variant: "secondary", icon: "shield-warning", onclick: "g.runBlocked(api)" }
      },
      "grid:status": {
        columns: 1,
        mdColumns: 3,
        "stat:method": { label: "Method", "$value": "g.method()" },
        "stat:status": { label: "Status", "$value": "g.status" },
        "stat:elapsed": { label: "Elapsed", "$value": "g.elapsed" }
      },
      "code-block:request": { title: "Sandbox request code", language: "ts", "$code": "g.requestSnippet()" },
      "code-block:response": { title: "Host proxy response", language: "json", "$code": "g.response" },
      "table:policy_matrix": {
        columns: [
          { key: "item", label: "Policy Item" },
          { key: "value", label: "Allowed Value" },
          { key: "reason", label: "Reason" }
        ],
        "$rows": "g.policyRows()"
      },
      "callout:policy_note": { "$tone": "g.status === 'Policy Blocked' ? 'warning' : 'success'", "$text": "g.riskText()" }
      }
    }
  }
}
```
