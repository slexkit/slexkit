# SlexKit

**简体中文** | [**English**](README.md)

面向 AI 输出的零构建、Markdown 友好响应式 UI 运行时。

SlexKit 让语言模型输出一个 JavaScript 对象字面量：`g` 存状态和逻辑，`layout` 存组件树；浏览器运行时会把它渲染成交互式 UI。它适合聊天消息、文档、Agent 面板和工具看板，不是完整应用框架。

## 特性

- **JS 对象字面量 Slex 源** — 无构建步骤、无 import、无项目脚手架
- **响应式 `g`/`layout` 分离** — 状态和逻辑集中在 `g`，UI 结构在 `layout`
- **`$if` / `$for` 指令** — 条件渲染和带 key 协调的数组迭代
- **表达式管道** — `$` 读管道和 `on*` 写管道用于动态属性和事件处理
- **组件注册表** — 可扩展的组件类型，支持多种状态模式（`value`/`checked`/`enabled`/`readable`/`none`）
- **可信 + 安全双运行时** — 可信模式在宿主域运行；安全模式在沙箱 iframe 中隔离不可信的 Slex 源
- **CSP 加固沙箱** — 不透明来源、基于 nonce 的 CSP、锁定全局变量、心跳检测
- **官方 Svelte 组件** — 40+ 个即用组件（input、navigation、layout、feedback、content、disclosure、display、tooling）
- **ToolHost** — 结构化用户输入收集（确认、选择、填表），带提交边界
- **MCP 服务器** — `@slexkit/mcp` 为 AI Agent 提供文档、示例和源码校验
- **Markdown fence 原生支持** — 宿主仅检测显式 `slex` fence，从不猜测代码块
- **框架集成** — React/Streamdown 渲染器、Obsidian 适配器

## 快速开始

```sh
npm install slexkit
```

```html
<div id="app"></div>

<script type="module">
  import { mount } from "slexkit";

  mount(
    {
      slex: "0.1",
      namespace: "hello",
      g: { name: "World" },
      layout: {
        "card:greeting": {
          title: "Greeting",
          "text:message": {
            "$content": "'Hello, ' + g.name + '!'"
          }
        }
      }
    },
    document.getElementById("app")
  );
</script>
```

## Markdown 输出

支持 SlexKit 的宿主仅处理显式 `slex` fence，从不处理纯 JavaScript 或 JSON 代码块。

~~~~md
```slex
{
  slex: "0.1",
  namespace: "status",
  g: { done: 3, total: 4 },
  layout: {
    "text:summary": { "$content": "g.done + '/' + g.total + ' complete'" }
  }
}
```

**状态：** 3/4 已完成
~~~~

不支持 SlexKit 的平台会显示 fallback 文本，支持的宿主则渲染交互式 UI。

## 安装

```sh
npm install slexkit
```

更精细的导入：

| 包 | 安装命令 | 内容 |
|---------|----------|------|
| `slexkit` | `npm install slexkit` | 运行时 + Svelte 组件 + ToolHost + 样式 |
| `@slexkit/runtime` | `npm install slexkit @slexkit/runtime` | 纯运行时（薄封装） |
| `@slexkit/components-svelte` | `npm install slexkit @slexkit/runtime @slexkit/components-svelte` | Svelte 组件注册 |
| `@slexkit/theme-shadcn` | `npm install @slexkit/theme-shadcn` | CSS 主题 |
| `@slexkit/streamdown` | `npm install slexkit @slexkit/theme-shadcn @slexkit/streamdown streamdown react react-dom` | React/Streamdown 渲染器 |
| `@slexkit/obsidian` | `npm install slexkit @slexkit/obsidian` | Obsidian 插件适配器 |
| `@slexkit/mcp` | `npx -y @slexkit/mcp` | 只读 MCP 服务器 |

## 版本信息

```js
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION, getSlexKitInfo } from "slexkit";
```

npm 包版本、组件实现版本和 Slex 协议版本分别独立暴露。当前公开协议为 `v0.1`，可在多次包发布中保持稳定。

## 文档

| 文档 | 主题 |
|----------|------|
| [快速开始](site/content/guides/quick-start/zh-CN.md) | 安装并渲染第一个 Markdown 友好的 Slex 源 |
| [集成指南](site/content/guides/integration/zh-CN.md) | Streamdown 和 Obsidian 宿主插件路径 |
| [运行时模型](site/content/reference/runtime/zh-CN.md) | `mount()`、`ingest()`、`boot()`、命名空间存储、生命周期 |
| [Slex 用法参考](site/content/reference/usage/zh-CN.md) | Slex 源码结构、`$if`/`$for`、表达式、事件、自定义组件 |
| [安全运行时](site/content/reference/security/zh-CN.md) | 威胁模型、策略、沙箱 iframe、postMessage 桥接、fail-closed |
| [Slex 规范](site/content/reference/spec/zh-CN.md) | 协议规范 v0.1、类型、合并规则、生命周期钩子 |
| [设计理念](site/content/reference/rationale/zh-CN.md) | 为何选择对象字面量、表达式、显式 fence、可信/安全分离 |
| [包边界](site/content/reference/packages/zh-CN.md) | 包关系图、安装矩阵 |
| [宿主集成](site/content/reference/integration/zh-CN.md) | MarkdownRuntimeHost、Streamdown、Obsidian、自定义宿主适配器 |
| [ToolHost](site/content/reference/toolhost/zh-CN.md) | Tool call 渲染、内置模板、自定义模板开发 |
| [图标系统](site/content/reference/icons/zh-CN.md) | Phosphor 图标、自定义注册、Iconify 回退、API 参考 |
| [AI / Agents](site/content/guides/ai-agents/zh-CN.md) | `llms.txt`、MCP 服务器、skills、创作规则 |
| [更新日志](CHANGELOG.md) | 发布说明和重要变更 |

## 许可证

MIT
