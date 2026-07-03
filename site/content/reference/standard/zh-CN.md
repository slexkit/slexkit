---
title: Slex Standard Artifacts
category: Reference
status: ready
order: 65
summary: "Slex envelope、组件目录、逻辑 profile、能力目录、conformance fixtures 与 manifest。"
slexkitRenderMode: component
---

# Slex Standard Artifacts

SlexKit 提供一组机器可读 JSON 文件，供 agents、host runtimes、MCP server 和 npm 包消费者读取。它们描述的是嵌入 Markdown 的、有本地状态和逻辑的 UI artifact，不是纯 JSON 卡片目录。

这些 JSON 文件由 TypeScript runtime registry、组件 specs、runtime 版本常量、表达式能力元数据和 conformance fixtures 生成。

## 文件

- [`/standard/slex-standard-manifest.json`](/standard/slex-standard-manifest.json)：版本、协议、logic profile、artifact 路径和 hash。
- [`/standard/slex-expression.schema.json`](/standard/slex-expression.schema.json)：Slex envelope、`namespace`、`g`、`layout`、组件 key 和 directive 字段的 JSON Schema。
- [`/standard/slex-component-catalog.json`](/standard/slex-component-catalog.json)：公开组件 props、dynamic 标记、生成的 prop JSON Schema、state mode、children、examples、docs 和组件 hash。
- [`/standard/slex-logic-profile.json`](/standard/slex-logic-profile.json)：`$` read-pipes、`on*` write-pipes、`$if`、`$for`、`$key`、上下文变量、保留名、组件状态和 secure mode 原生能力策略。
- [`/standard/slex-capabilities.catalog.json`](/standard/slex-capabilities.catalog.json)：确定性的 `std.*` 函数和受 policy 控制的 `api.*` secure runtime 能力。
- [`/standard/slex-conformance.json`](/standard/slex-conformance.json)：valid、warning、invalid fixtures，以及稳定的预期 diagnostic codes、paths 和 values。

## 校验模型

校验流程是 parse-first：

1. 先解析 JavaScript object literal source。
2. 校验 Slex envelope 和 component-key 形状。
3. 用生成的 component catalog 比对组件名和 props。
4. 按 logic profile 扫描逻辑字符串和 source。
5. 返回稳定的 diagnostic 与 warning codes。

`validateSlexSource()` 保留旧的 structured output，并新增 `schemaVersion`、`protocolVersion`、`logicProfileVersion`。Secure mode 的诊断会引导作者使用受 policy 控制的 `api.*`，而不是把所有逻辑都视为禁止。

解析成功后的 warnings 带有稳定 path。例如 `layout.text:value.$text` 里的未知 `std.*` 调用，与 `g.load` 里的原生 `fetch()` 调用，会返回不同 path，工具可以定位到具体表达式，而不是重写整个 artifact。

## 运行 Conformance

使用内置 conformance runner 验证 SlexKit validator 是否仍然符合已发布的标准 fixtures：

```sh
slex validate --standard
slex validate --standard --json
slex validate --standard --fixture valid-full-envelope
```

也可以校验单个 Slex source 文件：

```sh
slex validate ./artifact.slex --mode secure
slex validate ./artifact.slex --mode trusted --strict
```

Conformance 校验 source 结构、logic profile diagnostics、capability checks 和 warning 稳定性。它不是视觉渲染截图测试。

## 诊断代码

客户端用 `code`、`path` 和 `value` 做程序判断。`message` 只用于展示。

| Code | Severity | 含义 |
|---|---|---|
| `syntax` | error | JavaScript object literal 解析失败。它作为 `diagnostic.code` 返回，不是 warning。 |
| `unsupported_protocol` | warning | 可选 `slex` 标记与支持的 protocol version 不一致。 |
| `invalid_component_key` | warning | component key 不符合 `type:identifier` 形状。 |
| `invalid_directive_type` | warning | `$if`、`$for`、`$key` 等 structural directive 的值类型不合法。 |
| `unknown_component` | warning | component type 不在生成的 component catalog 中。 |
| `unknown_prop` | warning | component prop 不在对应组件的公开 spec 中。 |
| `unknown_std_member` | warning | 逻辑表达式引用了未发布的 `std.*` helper。 |
| `unknown_api_member` | warning | 逻辑表达式引用了 secure runtime capability catalog 之外的 `api.*` 成员。 |
| `native_secure_capability` | warning | Secure mode source 使用了 `fetch`、timer、`WebSocket` 等原生浏览器能力名；应改用受 policy 控制的 `api.*`。 |
| `reserved_context_shadowing` | warning | `g` key 或 component identifier 覆盖了保留表达式上下文名。 |

Path 指向解析后的 source tree，例如 `g.load` 或 `layout.text:value.$text`。如果 parse 失败，validator 仍可能返回 source-level usage warnings，但不会返回解析树 path。

## 一致性 fixture 契约

`slex-conformance.json` 包含 `valid`、`warning`、`invalid` fixtures。每个 fixture 都有 `id`、`mode`、source text 和 `expected` 对象。

- `expected.ok` 是 validator 的成功状态。
- `expected.warnings` 是该 fixture 的 warning 集合。缺少预期 warning 或出现额外 warning 都会失败。
- Warning 匹配使用 `code`，并在存在时同时匹配 `path` 和 `value`。
- `expected.diagnostic` 是 invalid fixture 预期的 parse diagnostic code。
- Fixture ID 保持稳定。行为变化时新增 fixture ID。

Conformance suite 只检查 source validation semantics。它不检查组件截图、浏览器布局、CSS output 或 host adapter lifecycle behavior。

## 版本策略

SlexKit 暴露多个 version 字段：

- `packageVersion`：npm package version，来自 `package.json`。
- `protocolVersion`：可接受的 Slex source protocol marker，值为 `0.1`。
- `schemaVersion`：生成 artifact 的 schema generation，使用 date-style。
- `logicProfileVersion`：expression、context、stdlib 与 secure capability profile version。

兼容 package release 可以更新 catalog hash、增加组件或 props、增加 examples，或改进 message，而不改变 `protocolVersion`。

如果变更会改变 source 解释、删除或重命名 diagnostic code、改变 expression semantics，或改变 secure capability 行为，就需要 protocol 或 logic profile review。Artifact hash 用于 cache invalidation，不是 semantic version。

## 与 A2UI 的区别

A2UI 描述跨平台声明式 UI。SlexKit 描述嵌入 Markdown 的、有状态、可执行 UI artifact；host 决定使用 trusted runtime 还是 secure runtime。

JSON Schema 负责描述 envelope 与 catalog。JavaScript expression profile 是标准的一部分，因为本地逻辑与状态本来就是 artifact 的组成部分。
