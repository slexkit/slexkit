<script lang="ts">
  import { mount } from "../../src/engine/index";

  interface Message {
    role: "user" | "ai" | "tool";
    content: string;
    toolResult?: object;
  }

  let messages: Message[] = $state([
    { role: "ai", content: "你好！我是 AI 助手。我可以帮你创建项目。点击下方按钮发起工具调用。" },
  ]);

  let showForm = $state(false);
  let container: HTMLElement;
  let formContainer: HTMLElement;
  let cleanupSlex: (() => void) | null = null;

  function startToolCall() {
    showForm = true;
    messages = [...messages, { role: "user", content: "帮我创建一个新项目" }];

    // 用 slex fence 渲染表单
    setTimeout(() => {
      if (!formContainer) return;
      if (cleanupSlex) cleanupSlex();
      
      const formData = { name: "", type: "web", priority: "medium" };
      
      cleanupSlex = mount({
        slex: "0.1",
        namespace: "dialog_toolhost_" + Date.now(),
        g: {
          fields: formData,
          submitted: false,
          submit: function() {
            this.submitted = true;
            showForm = false;
            const result = {
              toolCallId: "call_" + Math.random().toString(36).slice(2, 8),
              toolName: "create-project",
              status: "submitted",
              value: { ...this.fields, timestamp: new Date().toISOString() }
            };
            messages = [...messages,
              { role: "tool", content: "ToolResult", toolResult: result },
              { role: "ai", content: "收到！正在为你创建项目：" + this.fields.name }
            ];
          }
        },
        layout: {
          "card:form": {
            title: "创建新项目",
            "grid:fields": {
              columns: 1, mdColumns: 2,
              "input:name": { label: "项目名称", "$value": "g.fields.name", placeholder: "my-project", onchange: "g.fields.name = String($event || '')" },
              "select:type": {
                label: "项目类型",
                "$value": "g.fields.type",
                options: [
                  { label: "Web 应用", value: "web" },
                  { label: "API 服务", value: "api" },
                  { label: "CLI 工具", value: "cli" }
                ],
                onchange: "g.fields.type = String($event)"
              },
              "select:priority": {
                label: "优先级",
                "$value": "g.fields.priority",
                options: [
                  { label: "低", value: "low" },
                  { label: "中", value: "medium" },
                  { label: "高", value: "high" }
                ],
                onchange: "g.fields.priority = String($event)"
              }
            },
            "grid:actions": {
              columns: 2,
              "button:submit": { label: "提交", onclick: "g.submit()" },
              "button:cancel": { label: "取消", onclick: "g.submitted = false; showForm = false" }
            }
          }
        }
      }, formContainer);
    }, 50);
  }
</script>

<div class="dialog-shell" bind:this={container}>
  <div class="dialog-messages">
    {#each messages as msg}
      <div class="dialog-message dialog-message--{msg.role}">
        {#if msg.role === "ai"}
          <div class="dialog-avatar">AI</div>
        {/if}
        <div class="dialog-bubble">
          {msg.content}
          {#if msg.toolResult}
            <pre class="dialog-toolresult">{JSON.stringify(msg.toolResult, null, 2)}</pre>
          {/if}
        </div>
      </div>
    {/each}

    {#if showForm}
      <div bind:this={formContainer} class="dialog-form-container"></div>
    {/if}
  </div>

  <div class="dialog-input">
    <button onclick={startToolCall}>发起工具调用</button>
  </div>
</div>

<style>
  .dialog-shell {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--background);
  }
  .dialog-messages {
    padding: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }
  .dialog-message {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .dialog-message--ai { flex-direction: row; }
  .dialog-message--user { flex-direction: row-reverse; }
  .dialog-message--tool { flex-direction: row; }
  .dialog-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--primary);
    color: var(--primary-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  .dialog-bubble {
    max-width: 80%;
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    background: var(--muted);
  }
  .dialog-message--user .dialog-bubble {
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .dialog-toolresult {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--background);
    border-radius: calc(var(--radius) - 2px);
    font-size: 0.75rem;
    overflow-x: auto;
  }
  .dialog-input {
    padding: 1rem;
    border-top: 1px solid var(--border);
  }
  .dialog-input button {
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: var(--primary-foreground);
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.875rem;
  }
  .dialog-input button:hover {
    opacity: 0.9;
  }
  .dialog-form-container {
    margin-top: 1rem;
  }
</style>
