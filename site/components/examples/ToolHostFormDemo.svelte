<script>
  import { onMount } from "svelte";
  import { renderToolCall } from "../../../src/toolhost/index";

  let { locale = "en-US" } = $props();
  let container = $state(null);
  let result = $state(null);
  let activeHandle;

  function start() {
    activeHandle?.dispose();
    result = null;
    const zh = locale === "zh-CN";
    const handle = renderToolCall({
      id: "example-project-form",
      name: "fill-form",
      arguments: {
        title: zh ? "收集项目信息" : "Project details",
        description: zh ? "填写项目字段，然后提交或忽略。" : "Fill in the project fields, then submit or ignore the request.",
        fields: [
          { name: "name", label: zh ? "项目名称" : "Project name", type: "text", required: true, placeholder: "my-project" },
          { name: "description", label: zh ? "项目描述" : "Description", type: "text" },
          { name: "type", label: zh ? "项目类型" : "Project type", type: "select", value: "web", options: [{ value: "web", label: "Web" }, { value: "service", label: zh ? "服务" : "Service" }] },
          { name: "priority", label: zh ? "优先级" : "Priority", type: "select", value: "medium", options: [{ value: "low", label: zh ? "低" : "Low" }, { value: "medium", label: zh ? "中" : "Medium" }, { value: "high", label: zh ? "高" : "High" }] },
        ],
        submitLabel: zh ? "提交" : "Submit",
        ignoreLabel: zh ? "忽略" : "Ignore",
      },
    }, container);
    activeHandle = handle;
    void handle.promise.then((value) => { if (activeHandle === handle) result = value; });
  }

  onMount(() => {
    start();
    return () => { activeHandle?.dispose(); activeHandle = undefined; };
  });
</script>

<section class="slex-toolhost-form-demo" aria-label={locale === "zh-CN" ? "表单示例" : "Form example"}>
  <div bind:this={container}></div>
  {#if result}
    <h3>{locale === "zh-CN" ? "返回结果" : "Returned result"}</h3>
    <pre><code>{JSON.stringify(result, null, 2)}</code></pre>
    <button type="button" class="slex-toolhost-form-restart" onclick={start}>{locale === "zh-CN" ? "重新填写" : "Start again"}</button>
  {/if}
</section>
