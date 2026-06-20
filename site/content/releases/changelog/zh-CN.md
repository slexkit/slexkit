---
title: 更新日志
category: Releases
status: ready
order: 10
summary: "SlexKit 的发布说明和重要变更记录。"
slexkitRenderMode: component
---

# 更新日志

SlexKit 的所有重要变更。

## v0.3.1 - 宿主稳定性与控件渲染加固

### Added
- 新增 runtime 样式安全测试，阻止已发布 CSS 中出现宽泛 `:has()`、`clip-path` 和 slider 轨道回归。
- 新增 Switch、Checkbox、Radio 禁用状态属性的回归覆盖。

### Changed
- CI 现在使用 `bun install --frozen-lockfile`，并在测试前运行 lint。
- Switch、Checkbox、Radio 的禁用态样式改用显式 `data-disabled` 属性，不再依赖宽泛关系选择器。
- Select 和 sr-only 辅助样式不再使用 `clip-path`，提升宿主和 Obsidian CSS 兼容性。

### Fixed
- 修复 range track 绘制在原生 input 盒子上导致的 Slider 圆点方形背景伪影。
- 修复移除工程输入自绘 stepper 后 Input 聚焦态不可见的问题。
- 首页 RC 示例改用 Input 组件自身 label，避免单独文本标签造成样式不一致。
- 修复跨文档状态示例中 Stat 卡片更新后文字被裁切的问题。
- 修复 Markdown 计算器示例重复渲染区块标题的问题。

## v0.3.0 - 示例体系重构、组件审计与国际化

### Added
- 示例画廊：17 个高质量示例，按使用场景分类（入门教程、计算器、数据浏览、仪表盘、配置向导、决策辅助、平台能力）
- 全部 17 个示例的英文翻译
- `toolhost-demo`：使用真实 `renderToolCall` API 的对话式 ToolHost 演示
- 示例渲染基础设施：`site/routes/examples.js`、`site/pages/examples.slex.js`、`site/data/examples.js`
- Formula 组件（`src/components/svelte/content/Formula.svelte`），支持 KaTeX 渲染
- `src/engine/capabilities.ts`：面向 AI Agent 的结构化能力文档
- `src/engine/validation.ts`：SPEC 合约验证
- `src/engine/stdlib.ts`：标准库，包含 `math.clamp`、`math.safeDivide` 等工具函数
- `src/engine/sandbox-runner.ts`：安全运行时沙箱执行器
- 组件状态 eval 上下文遮蔽测试套件（`component-state-shadowing.test.ts`）
- Collapsible 和 Callout 双重渲染回归测试
- Slider 组件名遮蔽回归测试

### Changed
- 示例从 64 个精简为 17 个高质量示例，按用户故事重新组织
- 示例源语言：`zh-CN`（附 `en-US` 翻译）
- `renderChildren`（`helpers.ts`）在有子节点时清除已有内容
- Switch 组件现在接受 `checked`/`value` 属性，与 Checkbox 保持一致
- 站点 UI：DocsShell、DocRail、路由、Shell 改进
- 组件：Input、Select、Tabs、Table、PlaygroundMarkdown 优化
- CSS：theme-shadcn、text-input、docs-shell 样式更新

### Fixed
- eval 上下文遮蔽：组件名 `g` 和 `api` 不再覆盖保留上下文键
- `renderChildren` 在 Collapsible 和 Callout 中的双重渲染
- 分压器摘要错别字（"输入输入电压"）
- 五险一金计算器 Fallback 数字与实际计算结果不匹配
- tabs-and-branching 标题和长度转换不匹配
- 4 个预先存在的测试失败（ai-docs、page-structure、theme、markdown-content）

### Removed
- 47 个低质量/重复示例（从 64 个精简为 17 个）
- 所有示例文件中的死文案"Fallback"行
- 未使用的 `DialogShell.svelte` 组件

## v0.2.0

### Added
- `@slexkit/mcp`：AI Agent Model Context Protocol 服务器，提供 `slexkitDocs`、`slexkitExamples`、`slexkitValidate` 工具
- 协议标记：所有 Slex 表达式和 ToolHost 模板必须包含 `"slex": "0.1"`
- SPEC 合约验证：组件规范现已与运行时合约进行验证
- 版本同步自动化（`scripts/sync-version.ts`）和更新日志同步（`scripts/sync-changelog.ts`）
- AI 文档生成管道，输出结构化、对 LLM 友好的内容
- 静态站点导出及 SEO 元数据引擎（`site/data/seo.js`、`site/scripts/export-static.ts`）
- 所有参考文档和指南页面的中文文档
- 增强的组件状态管理，支持生命周期钩子（`onMount`、`onUnmount`、`onUpdate`）

### Changed
- Switch 组件从 `checked` 状态模式迁移至 `enabled`
- 文档：重构站点内容，同步 en-US 与 zh-CN，新增参考章节
- 主题：优化 Select 样式、下拉阴影、页脚和信息语调
- AI 文档生成增强，支持中英文语言环境感知

### Fixed
- 28 个组件的规范与文档对齐修正
- 站点路由和代码块高亮修复
- 简介和快速开始指南措辞优化
- 组件和参考文档中的断链与事实错误修复

## v0.1.9 - 首个公开版本

### Added
- 图标管理器，集成 Phosphor 图标系统（`registerIcon`、`registerIcons`、`getIcon`、`loadIcon`）
- 扩展了对带标签组件的图标支持（badge、button、callout 等）
- 图标文档页面及注册 API 参考

### Fixed
- 优化了静态站点导出中的组件交互
- 恢复了 Tabs 指示器动画
- 修复了 Callout 和 Toast 图标在标题中的位置
- 数字值显示格式修正

### Changed
- 站点文档外壳重构以支持静态导出
- 站点导航和主题控件对齐
- 统一了代码库中的 Slex 命名

## v0.1.8

### Added
- 基于 CSP 加固的安全运行时沙箱，含心跳看门狗
- `mountSecureArtifact()` 用于隔离 iframe 渲染
- `createSlexKitMarkdownRuntimeHost()` 用于 Markdown 托管的 SlexKit 块
- Streamdown React 渲染器（`@slexkit/streamdown`）
- Obsidian 插件适配器（`@slexkit/obsidian`）
- Shadcn 兼容 CSS 主题（`@slexkit/theme-shadcn`）
- 包边界封装（`@slexkit/runtime`、`@slexkit/components-svelte`）
- ToolHost 内置模板：`confirm-action`、`choose-options`、`fill-form`

### Changed
- 组件注册模型：通过副作用导入自动注册所有组件
- 样式重组为按组件划分的 CSS 文件
- 构建系统：使用 Bun.build + Svelte 插件，拆分 ESM 入口

## v0.1.7

### Added
- `$for` 列表渲染，支持键控协调（删除 / 增删改排序 / 修剪三个阶段）
- `$if` 条件渲染，支持进入/离开动画
- `$key` 策略：`$value`、基于属性、或回退到索引
- 组件实例状态模式：`value`、`checked`、`enabled`、`readable`、`none`
- 生命周期钩子：`g.onMount_<name>()`、`g.onUnmount_<name>()`、`g.onUpdate_<name>()`
- 工程数值输入，支持 SI 前缀解析
- 丰富的错误诊断，支持行/列/代码片段显示

### Changed
- 表达式求值：使用 `new Function()` 编译，配合响应式依赖追踪
- 布局树渲染器现支持三种渲染路径（普通、`$if`、`$for`）
- `g` 深层合并保留新状态中不存在的键

## v0.1.6 及更早版本

### Added
- 响应式 `g`/`layout` 分离，配表达式管道（`$` 读取管道、`on*` 写入管道）
- 自定义细粒度响应式系统（约 280 行，无外部依赖）
- 组件注册表，带可扩展渲染器接口
- Svelte 5 组件适配器（从 props 创建 store，flushSync DOM）
- `mount()`、`ingest()`、`boot()` 入口函数
- 8 个类别共 28 个内置 Svelte 组件
- `parseSlexSource()` DSL 解析器及 `diagnoseSlexKitSource()` 错误报告
- 带交互式 Playground 的文档站点
