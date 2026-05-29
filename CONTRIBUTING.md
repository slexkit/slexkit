# Contributing to SlexKit

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- Node.js (for ESLint, Prettier, and the `slex` CLI script)

## Setup

```sh
git clone https://github.com/slexkit/slexkit.git
cd slexkit
bun install
```

## Development commands

| Command | What it does |
|---|---|
| `bun run dev` | Start docs site at `localhost:4000` |
| `bun run test` | Run all tests (Bun + jsdom) |
| `bun run test:watch` | Tests in watch mode |
| `bun run build:core` | Build core runtime to `dist/` |
| `bun run build` | Build all packages |
| `bun run lint` | ESLint check (`src/` only) |
| `bun run format` | Prettier format (`src/` only) |
| `bun run smoke:release` | Pre-release smoke test |

## Code style

- TypeScript strict mode, ES2022 target, ESNext modules, bundler resolution
- ES module syntax only (`import` / `export`)
- Prettier default config, ESLint with `typescript-eslint` recommended
- Files: kebab-case (`component-state.ts`), Svelte components: PascalCase (`Accordion.svelte`), API: camelCase (`mountSecureArtifact`)
- No JSDoc required — public API is documented in `docs/*.md`

## Adding a component

See [AGENTS.md](./AGENTS.md#adding-a-new-component) for the full checklist.

## Examples

```sh
bun examples/dev-server.mjs basic-resistor
```

Each example in `examples/` has an `index.html` and `main.js`. Run `bun run build:core` before running examples.

## Releasing

1. `bun run test && bun run smoke:release`
2. Bump version in root `package.json`, run `bun run scripts/sync-version.ts`
3. Update `CHANGELOG.md`, run `bun run scripts/sync-changelog.ts`
4. `bun run build`
5. Publish root + each scoped package

## Getting help

Open an issue on GitHub with a minimal reproduction if possible.
