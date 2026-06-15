# Changelog

All notable changes to SlexKit.

## Unreleased

### Added
- English translations for all 17 example pages
- Component state eval context shadowing test suite (`component-state-shadowing.test.ts`)
- Collapsible and Callout double-rendering regression tests
- Slider component name shadowing regression test

### Fixed
- Eval context shadowing: component names `g` and `api` no longer overwrite reserved context keys
- `renderChildren` now clears existing content when children are present, preventing double rendering in Collapsible and Callout
- Switch component now accepts `checked`/`value` props for initialization consistency with Checkbox
- Voltage divider summary typo ("输入输入电压")
- Salary calculator fallback numbers to match actual calculator output
- Tabs-and-branching: title and length conversion mismatch
- 4 pre-existing test failures (ai-docs, page-structure, theme, markdown-content)
- Toolhost test: added setup import to fix `document is not defined`

### Removed
- Dead "Fallback" copywriting from all 17 example files
- Post-slex explanatory text from 4 example files
- Orphaned `test-if` example directory
- Agent-generated `docs/compose` planning files
- Temporary `screenshot-*.png` files
- Unused `DialogShell.svelte` component

## v0.2.0 - First public release

### Added
- `@slexkit/mcp`: AI Agent Model Context Protocol server with `slexkitDocs`, `slexkitExamples`, `slexkitValidate` tools
- Protocol marker: `"slex": "0.1"` required on all Slex expressions and ToolHost templates
- SPEC contract validation: component specs are now validated against the runtime contract
- Version sync automation (`scripts/sync-version.ts`) and changelog sync (`scripts/sync-changelog.ts`)
- AI documentation generation pipeline with structured LLM-friendly output
- Static site export with SEO metadata engine (`site/data/seo.js`, `site/scripts/export-static.ts`)
- Chinese documentation for all reference and guide pages
- Enhanced component state management with lifecycle hooks (`onMount`, `onUnmount`, `onUpdate`)

### Changed
- Switch component migrated from `checked` to `enabled` state mode
- Documentation: restructured site content, synced en-US with zh-CN, added reference section
- Theme: refined select styling, dropdown shadows, footer and info tone polish
- AI docs generation enhanced with Chinese/English locale awareness

### Fixed
- Component spec alignment with documentation across all 28 components
- Site routing and code block highlighting
- Introduction and quick-start guide wording for clarity
- Broken links and factual errors in component and reference documentation

## v0.1.9

### Added
- Icon manager with Phosphor icon system (`registerIcon`, `registerIcons`, `getIcon`, `loadIcon`)
- Expanded icon support across labeled components (badge, button, callout, etc.)
- Icon docs page with registration API reference

### Fixed
- Refined component interactions in static site export
- Tabs indicator animation restored
- Callout and toast icon placement in titles
- Numeric value display formatting

### Changed
- Site docs shell refactored for static export
- Site navigation and theme controls alignment
- Slex naming standardized across codebase

## v0.1.8

### Added
- CSP-hardened secure runtime sandbox with heartbeat watchdog
- `mountSecureArtifact()` for isolated iframe rendering
- `createSlexKitMarkdownRuntimeHost()` for Markdown-hosted SlexKit blocks
- Streamdown React renderer (`@slexkit/streamdown`)
- Obsidian plugin adapter (`@slexkit/obsidian`)
- Shadcn-compatible CSS theme (`@slexkit/theme-shadcn`)
- Package boundary wrappers (`@slexkit/runtime`, `@slexkit/components-svelte`)
- ToolHost with built-in templates: `confirm-action`, `choose-options`, `fill-form`

### Changed
- Component registration model: side-effect import registers all components
- Styles reorganized into per-component CSS files
- Build system: Bun.build with Svelte plugin, split ESM entries

## v0.1.7

### Added
- `$for` list rendering with keyed reconciliation (delete / add-update-reorder / trim phases)
- `$if` conditional rendering with enter/leave animation support
- `$key` strategy: `$value`, property-based, or fallback to index
- Component instance state modes: `value`, `checked`, `enabled`, `readable`, `none`
- Lifecycle hooks: `g.onMount_<name>()`, `g.onUnmount_<name>()`, `g.onUpdate_<name>()`
- Engineering number input with SI prefix parsing
- Rich error diagnostics with line/column/excerpt display

### Changed
- Expression evaluation: `new Function()` compilation with reactive dependency tracking
- Layout tree renderer now supports three rendering paths (normal, `$if`, `$for`)
- `g` deep-merge preserves keys not present in the new state

## v0.1.6 and earlier

### Added
- Reactive `g`/`layout` split with expression pipes (`$` read-pipes, `on*` write-pipes)
- Custom fine-grained reactivity system (~280 lines, no external dependency)
- Component registry with extensible renderer interface
- Svelte 5 component adapter (creates stores from props, flushSync DOM)
- `mount()`, `ingest()`, `boot()` entry points
- 28 built-in Svelte components across 8 categories
- `parseSlexSource()` DSL parser with `diagnoseSlexKitSource()` error reporting
- Documentation site with interactive playground
