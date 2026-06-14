<script lang="ts">
  import { renderToolCall } from "slexkit";

  interface Message {
    role: "user" | "ai" | "tool";
    content: string;
    toolResult?: object;
  }

  let messages: Message[] = $state([
    { role: "ai", content: "你好！我是 AI 助手。我可以帮你创建项目、配置服务或提交工单。需要我帮忙吗？" },
  ]);

  let showToolHost = $state(false);
  let toolHandle: any = null;
  let container: HTMLElement;

  function startToolCall() {
    showToolHost = true;
    const toolContainer = container.querySelector("#toolhost-container");
    if (!toolContainer) return;
    
    toolHandle = renderToolCall({
      name: "create-project",
      arguments: { title: "创建新项目" }
    }, toolContainer);

    toolHandle.promise.then((result) => {
      showToolHost = false;
      messages = [...messages, 
        { role: "tool", content: "ToolResult", toolResult: result },
        { role: "ai", content: "收到！正在为你创建项目：" + (result.value?.name || "未命名") }
      ];
    });
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

    {#if showToolHost}
      <div id="toolhost-container" class="dialog-toolhost"></div>
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
  }
  .dialog-messages {
    padding: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }
  .dialog-message {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .dialog-message--ai {
    flex-direction: row;
  }
  .dialog-message--user {
    flex-direction: row-reverse;
  }
  .dialog-message--tool {
    flex-direction: row;
  }
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
  .dialog-toolhost {
    margin-top: 1rem;
  }
</style>
