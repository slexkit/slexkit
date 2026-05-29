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
