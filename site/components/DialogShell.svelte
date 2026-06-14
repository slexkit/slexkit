<script lang="ts">
  interface Message {
    role: "user" | "ai" | "tool";
    content: string;
    toolResult?: object;
  }

  let messages: Message[] = $state([
    { role: "ai", content: "你好！我是 AI 助手。我可以帮你创建项目。点击下方按钮发起工具调用。" },
  ]);

  let showForm = $state(false);
  let fields = $state({ name: "", type: "web", priority: "medium" });

  function startToolCall() {
    showForm = true;
    messages = [...messages, { role: "user", content: "帮我创建一个新项目" }];
  }

  function submitForm() {
    const result = {
      toolCallId: "call_" + Math.random().toString(36).slice(2, 8),
      toolName: "create-project",
      status: "submitted",
      value: { ...fields, timestamp: new Date().toISOString() }
    };
    showForm = false;
    messages = [...messages,
      { role: "tool", content: "ToolResult", toolResult: result },
      { role: "ai", content: "收到！正在为你创建项目：" + fields.name }
    ];
  }

  function cancelForm() {
    showForm = false;
    messages = [...messages, { role: "tool", content: "操作已取消" }];
  }
</script>

<div class="dialog-shell">
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
      <div class="dialog-form">
        <div class="dialog-form-title">创建新项目</div>
        <div class="dialog-form-fields">
          <label>
            项目名称
            <input type="text" bind:value={fields.name} placeholder="my-project" />
          </label>
          <label>
            项目类型
            <select bind:value={fields.type}>
              <option value="web">Web 应用</option>
              <option value="api">API 服务</option>
              <option value="cli">CLI 工具</option>
            </select>
          </label>
          <label>
            优先级
            <select bind:value={fields.priority}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </label>
        </div>
        <div class="dialog-form-actions">
          <button onclick={submitForm}>提交</button>
          <button onclick={cancelForm} class="secondary">取消</button>
        </div>
      </div>
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
    white-space: pre-wrap;
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
  .dialog-input button:hover { opacity: 0.9; }
  .dialog-form {
    margin-top: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
  }
  .dialog-form-title {
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  .dialog-form-fields {
    display: grid;
    gap: 0.75rem;
  }
  .dialog-form-fields label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--muted-foreground);
  }
  .dialog-form-fields input,
  .dialog-form-fields select {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
    background: var(--background);
    font-size: 0.875rem;
  }
  .dialog-form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .dialog-form-actions button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.875rem;
  }
  .dialog-form-actions button:first-child {
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .dialog-form-actions button.secondary {
    background: var(--muted);
    color: var(--foreground);
  }
</style>
