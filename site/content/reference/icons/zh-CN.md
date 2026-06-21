---
title: 图标系统
category: Reference
status: ready
order: 90
summary: "Phosphor icons、自定义 icon 注册、Iconify fallback 与组件 icon 用法。"
slexkitRenderMode: component
---

# 图标系统

SlexKit 的 icon system 为组件提供统一 icon 解析链：先查自定义注册，再查内置 Phosphor icon，最后可选走 Iconify fallback。

## Resolution chain

当组件收到 `icon` 字段时，同步解析和异步加载按顺序使用：

1. `getRegisteredIcon(name, state)`：用户注册的 icon。
2. 内置 Phosphor icon。
3. `loadIcon(name, state)`：当前两步没有命中时，按 `resolveIconifyIcon()` 和 `iconifySvgUrl()` 走 Iconify async fallback。

同步 `getIcon()` 只返回已注册或内置 SVG string；不会发起网络请求。需要外部 Iconify fallback 的组件会调用 async `loadIcon()`。

## Public API

### Registration

#### `registerIcon(name, svg, options?)`

注册单个 SVG icon。

```ts
import { registerIcon } from "slexkit";

registerIcon("brand-logo", "<svg viewBox=\"0 0 24 24\">...</svg>");
```

`name` 会 normalize 成 kebab-case。`options` 可用于声明 state/weight 等元信息。

#### `registerIcons(icons, options?)`

批量注册 icons：

```ts
registerIcons({
  "brand-logo": "<svg viewBox=\"0 0 24 24\">...</svg>",
  "brand-mark": "<svg viewBox=\"0 0 24 24\">...</svg>"
});
```

#### `clearRegisteredIcons()`

清空自定义注册表。主要用于测试或宿主热重载。

### Retrieval

#### `getIcon(name, state?)`

同步获取自定义注册或内置 Phosphor icon。

#### `getRegisteredIcon(name, state?)`

只从用户注册表获取 icon。

#### `loadIcon(name, state?)`

加载 icon，必要时可触发 async fallback。

### Name and weight utilities

#### `normalizeIconName(name)`

把 icon name 归一化为 kebab-case：

```ts
normalizeIconName("BookOpenText"); // "book-open-text"
normalizeIconName("book_open_text"); // "book-open-text"
```

#### `resolveIconWeight(state?)`

根据组件 state 解析 Phosphor weight。常见状态包括默认、hover、active、selected、disabled。

#### `resolveIconifyIcon(name, state?)`

解析 Iconify icon id 与 state。

#### `iconifySvgUrl(name, state?)`

生成 Iconify SVG URL。

#### `iconCacheKey(name, state?)`

生成用于缓存的 key，避免不同 state 或 weight 互相覆盖。

## Built-in Phosphor icons

SlexKit 内置一组 Phosphor 风格 icons，覆盖常见 UI 动作与状态，例如：

- `check`
- `x`
- `plus`
- `minus`
- `info`
- `warning`
- `spinner`
- `caret-down`
- `book-open`
- `terminal-window`
- `cursor-click`
- `gear-six`

实际可用列表以当前 icon registry 为准。

## Icon naming convention

Slex expressions 使用 kebab-case 引用 icons：

```js
{
  layout: {
    "button:save": {
      icon: "floppy-disk",
      label: "Save"
    }
  }
}
```

避免在 source 中混用 PascalCase、snake_case 和 provider-specific 前缀。自定义 icon 也应注册成语义名称，而不是文件名。

## Iconify fallback

Iconify fallback 用于宿主希望按需加载外部 icon 集合的场景。由于它可能产生网络请求或依赖外部资源，secure runtime 中是否可用取决于 host policy 和宿主实现。

生产宿主应优先注册必要 icons 或使用内置 Phosphor set，减少运行时外部依赖。

## Usage in components

大多数组件通过 `icon` 字段使用 icon：

```js
"button:next": {
  icon: "arrow-right",
  label: "Next"
}
```

Icon-only 按钮仍必须提供可访问 label：

```js
"button:settings": {
  icon: "gear-six",
  iconOnly: true,
  label: "Settings"
}
```

Icon 是语义辅助，不应替代必要文本。状态色、hover、selected 等视觉状态应由主题 tokens 和组件状态控制，而不是注册多套硬编码颜色的 SVG。
