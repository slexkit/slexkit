# AGENTS.md

SlexKit — Streaming Live EXpressions Kit. Zero-build, Markdown-friendly reactive UI runtime for AI output. This file tells AI agents how to work in this repository.

## Current authoring direction

- Prefer standard HTML, JavaScript and `slexkit/web-components` for new authoring. Read `docs/web-components.md` and `dist/custom-elements.json`; the DSL catalog is not the custom-element contract.
- Focus on runtime/lifecycle, theme styles and reusable components. Do not add expression/binding languages or more DSL-only features.
- The default `slex` fence is an HTML fragment with optional inline module scripts. Public mount/inspection APIs accept strings and reject object-tree DSL; never restore an old-format fallback.
- Runtime, adapters, Playground, MCP and Obsidian use this same HTML document host. Source runs in an isolated iframe; previews do not initialize scripts. Verify actual host behavior before declaring migration complete.
- Use scalar attributes, live properties/arrays, native events and slots. Generated JavaScript requires isolation; Shadow DOM is not a security sandbox.

## Tech stack

- **Runtime**: TypeScript (ES2022, strict mode, ESNext modules)
- **Components**: Svelte 5 (runes syntax, `$props()`, `$state()`)
- **Styling**: UnoCSS (wind4 preset) with shadcn/ui design tokens; per-component CSS files in `src/styles/components/`
- **Build**: Bun.build with custom Svelte plugin; TSC for declarations only
- **Test**: `bun test` with jsdom browser environment
- **Package manager**: Bun (workspaces in `packages/`)
- **Site**: Svelte 5 + Bun HTTP server + CodeMirror + KaTeX + Flowbite-Svelte

## Key commands

```sh
bun run dev           # Start site dev server
bun run build         # Build all (core + streamdown + mcp)
bun run build:core    # Build core runtime only
bun test              # Run all tests
bun run test:watch    # Run tests in watch mode
bun run lint          # ESLint (src/ only)
bun run format        # Prettier (src/ only)
bun run smoke:release # Release smoke test
```

## Directory map

```
src/
  html/             # Static inspection, isolated document host/runner, protocol and DOM coordination
  engine/           # Reused reactive utilities, theme, engineering units, permissions, animation
  web-components/   # Custom-element definitions, theme and optional Playground
  components/       # Internal Svelte implementations (layout/ content/ display/ input/ disclosure/ feedback/ tooling/)
  toolhost/         # AI tool-call rendering (confirm-action, choose-options, fill-form)
  icons/            # Phosphor icon system + custom registration API
  styles/           # CSS: layout, theme, content, display, input, disclosure, feedback, animation, tooling + per-component files

packages/
  runtime/          # @slexkit/runtime — thin wrapper re-exporting slexkit/runtime
  components-svelte/# @slexkit/components-svelte — thin wrapper re-exporting slexkit/components-svelte
  theme-shadcn/     # @slexkit/theme-shadcn — CSS only
  streamdown/       # @slexkit/streamdown — React/Streamdown custom renderer
  mcp/              # @slexkit/mcp — read-only docs/examples/validate MCP server

site/               # Documentation website (Svelte-based SPA)
  content/          # Markdown docs: guides/ + components/
  components/       # Site-specific Svelte components
  pages/            # Page data and HTML example strings (some retain .slex.js filenames)
  scripts/          # Site build and static export

tests/              # Bun test suites (runtime/, components/, secure/, site/, toolhost/, markdown/)
examples/           # Integration examples (basic-resistor, component-gallery, custom-component, markdown-fence, secure-fetch, toolhost)
scripts/            # Build (build-core.ts), CLI (cli.mjs), release-smoke (release-smoke.mjs)
```

## Code conventions

### Component registration pattern
1. Import the internal `.svelte` component in `src/web-components/definitions.ts`.
2. Describe scalar attributes, live properties, events and native slots.
3. `defineSlexElements()` registers `slex-*` elements in the selected window.
4. Elements mount their Svelte implementation in Shadow DOM. No expression evaluator or object-tree renderer is involved.

### Reactive state flow
1. HTML describes elements; standard inline JS modules read/write their live properties.
2. Native `input`, `change` and `click` events drive updates; optional reactive utilities are plain JavaScript APIs.
3. Each fence has its own isolated document. Cross-fence JSON sharing is explicit through artifact-local `slex.shared`.
4. Use `slex.signal` (AbortSignal) and `slex.onDispose()` for cleanup; hidden JavaScript state needs explicit snapshot/restore handlers.

### Theme architecture
1. CSS custom properties from shadcn/ui tokens (`--background`, `--foreground`, `--primary`, etc.)
2. Three theme modes: `uno` (built-in), `host-shadcn` (inherits host tokens), `flowbite`
3. `uno.config.ts` generates CSS variable declarations for light/dark
4. `.slexkit-theme-host-shadcn` generates primary color scale via `color-mix()`

### Naming
- Element names: `slex-card`, `slex-input`; stable `id` or `data-key` for updates
- Files: kebab-case (`component-state.ts`, `secure-runtime.ts`)
- Public API: camelCase (`defineSlexElements`, `createSecureRuntime`)
- Svelte components: PascalCase (`Accordion.svelte`, `Card.svelte`)

### Key exports (src/index.ts)
- **Runtime**: `mount`, `inspectSlexSource`, `parseSlexSource` (static alias), `createSecureRuntime`, `createSlexKitMarkdownRuntimeHost`
- **Components**: `defineSlexElements`, `describeSlexElements`
- **ToolHost**: `renderToolCall`, `registerToolTemplate`
- **Icons**: `registerIcon`, `registerIcons`, `clearRegisteredIcons`, `getIcon`, `getRegisteredIcon`, `loadIcon`, `normalizeIconName`, `resolveIconWeight`, `resolveIconifyIcon`, `iconifySvgUrl`
- **Diagnostics**: `validateSlexSource`, `formatSlexKitDiagnostic`, `SlexKitSyntaxError`, `SlexKitRuntimeError`
- **Sandbox**: `startSlexKitSandboxRunner`, `setSlexKitRuntimeUrl`, `getSlexKitRuntimeUrl`

### Adding a new component
1. Create `.svelte` file in `src/components/svelte/<category>/`
2. Create corresponding CSS in `src/styles/components/` (import from `src/styles/input.css` or similar)
3. Add the Web Component definition and native contract in `src/web-components/definitions.ts`
4. Add bilingual pages in `site/content/components/<name>/{en-US,zh-CN}.md`
5. Add entry to `publicComponentSlugs` in `site/data/component-docs.js`
6. Add tests in `tests/components/`

### Writing tests
- Tests use Bun test runner with `--conditions browser --isolate --preload ./tests/setup.ts`
- `tests/setup.ts` provides a jsdom DOM environment with mocked browser APIs
- Test custom elements directly with `defineSlexElements()`; test isolated execution in real Playwright browsers, not jsdom
- Test files are organized by domain: `tests/runtime/`, `tests/components/`, `tests/secure/`, etc.

## Documentation conventions

- All `docs/*.md` are in English — these are the authoritative technical docs
- `site/content/` contains English and Chinese user-facing documentation
- Package READMEs exist for each package in `packages/<name>/README.md`
- Component docs in `site/content/components/` use YAML frontmatter with `title`, `category`, `status`, `order`, `summary`
- Guide docs in `site/content/guides/` use YAML frontmatter with similar fields
- `site/data/component-docs.js` is the metadata engine — sync frontmatter data with it when adding guides/components
