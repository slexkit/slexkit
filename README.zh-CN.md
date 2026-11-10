# SlexKit

Streaming Live EXpressions Kit 是面向交互式 Markdown 的 HTML-first 运行时。`slex` fence 直接包含标准 HTML 片段、可选 CSS、`slex-*` 自定义元素，以及可选的内联模块脚本。宿主默认在隔离 frame 中运行生成代码。

## 编写格式

````markdown
```slex
<slex-card title="计数器">
  <slex-stat id="count" label="数量" value="0"></slex-stat>
  <slex-button id="add" label="增加"></slex-button>
</slex-card>
<script type="module">
  const count = slex.root.querySelector("#count");
  const add = slex.root.querySelector("#add");
  const increment = () => { count.value = Number(count.value) + 1; };
  add.addEventListener("click", increment);
  slex.onDispose(() => add.removeEventListener("click", increment));
</script>
```
````

新格式没有对象式 `g/layout` envelope、表达式字符串属性、绑定语法或旧格式回退。请使用原生 DOM 属性和事件。组件注册、允许的 API、运行时 URL 与样式由宿主负责，不应放进 AI payload。

沙箱内提供精简的全局 SDK：

- `slex.root`
- `slex.signal`（模块作用域释放时中止的 `AbortSignal`）
- `slex.onDispose(fn)`
- `slex.onSnapshot(fn)` 与 `slex.onRestore(fn)`
- 受策略控制的 `slex.api`
- artifact 内共享的 `slex.shared.get/set/subscribe`

## 已支持的自定义元素

当前 `slexkit/web-components` 合约默认包含以下 28 个元素：

`slex-column`、`slex-card`、`slex-grid`、`slex-row`、`slex-input`、`slex-slider`、`slex-checkbox`、`slex-switch`、`slex-button`、`slex-stat`、`slex-text`、`slex-progress`、`slex-badge`、`slex-code-block`、`slex-divider`、`slex-link`、`slex-table`、`slex-select`、`slex-radio-group`、`slex-tabs`、`slex-accordion`、`slex-collapsible`、`slex-formula`、`slex-callout`、`slex-section`、`slex-step`、`slex-toast`、`slex-submit`。

不支持的界面请使用普通 HTML。属性、property、事件和 slot 的准确合约见 [docs/web-components.md](docs/web-components.md) 与生成的 `dist/custom-elements.json`。

目录中的第 29 个元素 `slex-playground` 是可选创作工具，需要从 `slexkit/tooling` 显式调用 `defineSlexPlayground(window, hostOptions)` 注册，并配置宿主拥有的运行时/样式资源。根入口通过 `defineSlexElements` 提供独立组件，不导出原始 Svelte 组件源码。

## 宿主接入

```js
import { createSlexKitMarkdownRuntimeHost } from "slexkit/runtime";

const host = createSlexKitMarkdownRuntimeHost({
  secureFrame: {
    runtimeUrl: new URL("./slexkit.runtime.js", import.meta.url).href,
    styleUrl: new URL("./slexkit.css", import.meta.url).href,
  },
});

await host.updateArtifact("message-42", [{
  artifactId: "message-42",
  blockId: "block-1",
  source: '<slex-text text="就绪"></slex-text>',
  container: document.querySelector("#preview"),
}], { phase: "commit" });
```

Preview 更新只做静态检查，不执行生成脚本；commit 更新在隔离文档中运行。稳定的 block ID 与元素 `id`/`data-key` 能帮助运行时保留兼容的 DOM/组件实例及可见控件值。frame 运行时资源缺失时必须失败关闭。

直接挂载 HTML 文档：

```js
import { mount } from "slexkit";

const handle = mount("<p>你好</p>", document.querySelector("#app"), {
  secureFrame: { runtimeUrl: "/assets/slexkit.runtime.js" },
});
await handle.ready;
```

## 静态检查

`inspectSlexSource(source)`、`parseSlexSource(source)` 和 `validateSlexSource(source)` 会检查 HTML 与内联 JavaScript，但绝不执行脚本；对象输入会被拒绝。检查会拒绝外部脚本/import、内联事件属性、嵌入式浏览或插件内容、导航 metadata 与可执行 URL scheme。静态检查只是防护，不是安全边界。

## 开发

```sh
bun install
bun run build
bun test
bun run dev
```

主要入口：

- `slexkit` 与 `slexkit/runtime`：HTML 文档运行时和宿主 API
- `slexkit/web-components`：独立自定义元素
- `slexkit/custom-elements.json`：编辑器/工具元数据
- `@slexkit/mcp`：只读文档、示例、组件元数据与静态验证

另见 [HTML 迁移合约](docs/html-migration-contract.md)、[主题合约](docs/theme-contract.md)、[示例](examples/README.md) 与 `site/content/` 中的双语文档。

## 安全边界

生成的 JavaScript 必须在隔离 frame 中运行，Shadow DOM 本身不是沙箱。受支持浏览器中的 frame 策略会拒绝 payload 发起的 fetch、图片、字体、外部脚本和外部 link 资源加载；获准请求通过宿主桥接。这并非通用网络出口防火墙：iframe 自身导航仍可能发出请求。运行时也不提供 CPU 抢占；敌意代码需要浏览器/进程外的网络控制与超时。

## 许可证

MIT
