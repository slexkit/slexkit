# Changelog

All notable changes to SlexKit.

## v0.3.4 - Production documentation polish

### Changed
- Reworked the documentation site shell labels, language menu, mobile navigation, and theme controls so localized pages no longer expose English-only UI chrome.
- Polished guide, reference, component, example, package README, and AI-facing documentation copy to remove report-like wording and visible placeholder phrasing.
- Localized generated Chinese component examples and API descriptions, including Formula props, through the component spec documentation pipeline.

### Fixed
- Chinese documentation no longer renders copied English UI phrases such as counter labels, ToolHost examples, Obsidian status text, or design-system tone labels.
- Markdown documentation tests now guard against copied English skeleton headings, visible English-only list rows, double-question-mark replacement corruption, stale generated spec blocks, and previously fixed English UI phrase regressions.

## v0.3.3 - Obsidian input control hardening

### Fixed
- Slider now renders its visual track outside the native range input while keeping the native input for interaction and accessibility, avoiding square thumb artifacts in Obsidian and other host themes.
- Input fields with trailing units now reset host input chrome with scoped selectors so unit add-ons stay aligned with the text field in Obsidian dark themes.

## v0.3.2 - Host CSS isolation and repeated layout hardening

### Changed
- `$for` rendering now uses comment anchors and direct child insertion instead of a wrapper element that depended on `display: contents`.
- Site-only mobile navigation CSS moved out of the runtime base stylesheet and into the documentation site shell.
- Component accessors now share one reactive effect across subscribers instead of creating duplicate subscriber fan-out work.

### Fixed
- Obsidian and other Markdown hosts no longer need to rewrite `$for` wrapper CSS to avoid `display: contents`, preserving grid and row layouts for repeated items.
- Published runtime base CSS no longer leaks `#mobileNav` or `body[data-mobile-nav-open]` selectors into host pages.
- Custom renderers that return no element no longer leave invalid `$for` slots behind during diffing or cleanup.

## v0.3.1 - Host stability and control rendering hardening

### Added
- Runtime style safety tests that block broad `:has()` selectors, `clip-path`, and slider track regressions in shipped CSS.
- Regression coverage for disabled Switch, Checkbox, and Radio state attributes.

### Changed
- CI now installs dependencies with `bun install --frozen-lockfile` and runs lint before tests.
- Disabled Switch, Checkbox, and Radio styling now uses explicit `data-disabled` attributes instead of broad relational selectors.
- Select and sr-only helper styles avoid `clip-path` for better host and Obsidian CSS compatibility.

### Fixed
- Slider thumb rendering artifacts caused by painting the range track on the native input box.
- Input focus visibility after removing custom engineering steppers.
- Home RC example input labels now use native Input component labels instead of separate text labels.
- Stat cards no longer clip updated text during cross-document state examples.
- Markdown calculator examples no longer render duplicate section labels.

## v0.3.0 - Examples overhaul with component audit and i18n

### Added
- Example gallery: 17 high-quality examples organized by usage scenario (Getting Started, Calculators, Data Browsing, Dashboards, Config Wizards, Decision Support, Platform Features)
- English translations for all 17 example pages
- `toolhost-demo`: real `renderToolCall` API with chat-style conversation UI
- Example rendering infrastructure: `site/routes/examples.js`, `site/pages/examples.slex.js`, `site/data/examples.js`
- Content discovery: `site/data/content-discovery.js` with locale fallback and allowed-slug filtering
- `site/data/content-discovery.js`: `discoverExampleMarkdown()` with per-locale discovery
- SEO metadata for example pages
- `examples/minimal-cdn/index.html`: zero-build CDN usage example
- Formula component (`src/components/svelte/content/Formula.svelte`) with KaTeX rendering
- `src/engine/capabilities.ts`: structured capability docs for AI agents
- `src/engine/validation.ts`: SPEC contract validation for component specs
- `src/engine/stdlib.ts`: standard library with `math.clamp`, `math.safeDivide`, and other utilities
- `src/engine/sandbox-runner.ts`: sandbox runner for secure runtime
- Component state eval context shadowing test suite (`component-state-shadowing.test.ts`)
- Collapsible and Callout double-rendering regression tests
- Slider component name shadowing regression test
- Tests for content, playground, select, tabs, slider, disclosure, feedback, policy-api

### Changed
- Examples reduced from 64 to 17 high-quality examples, organized by user story
- Example source locale: `zh-CN` (with `en-US` translations)
- `renderChildren` (`helpers.ts`) now clears existing content when children are present
- Switch component now accepts `checked`/`value` props for initialization consistency with Checkbox
- Site UI: DocsShell, DocRail, router, shell improvements
- Components: Input, Select, Tabs, Table, PlaygroundMarkdown refinements
- CSS: theme-shadcn, text-input, docs-shell styling updates
- MCP: enhanced with structured capability docs

### Fixed
- Eval context shadowing: component names `g` and `api` no longer overwrite reserved context keys
- `renderChildren` double rendering in Collapsible and Callout
- Voltage divider summary typo ("输入输入电压")
- Salary calculator fallback numbers to match actual calculator output
- Tabs-and-branching: title and length conversion mismatch
- 4 pre-existing test failures (ai-docs, page-structure, theme, markdown-content)
- Toolhost test: added setup import to fix `document is not defined`
- Badge stretching in grid layout
- Project-dashboard syntax error
- Salary-calculator rate configuration

### Removed
- 47 low-quality/duplicate examples (reduced from 64 to 17)
- Dead "Fallback" copywriting from all example files
- Post-slex explanatory text from example files
- Unused `DialogShell.svelte` component
- Orphaned `test-if` example directory
- Agent-generated `docs/compose` planning files
- Temporary `screenshot-*.png` files

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
- Obsidian plugin adapter (now released through `slexkit/obsidian-slexkit`)
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
