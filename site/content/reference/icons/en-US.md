---
title: Icon System
category: Reference
status: ready
order: 90
summary: "Phosphor icons, custom icon registration, Iconify fallback, and component icon usage."
slexkitRenderMode: component
---

# Icon System

SlexKit includes a built-in icon system powered by Phosphor Icons with a custom registration API for extended icon sets.

## Resolution chain

When a component requests an icon by name, the system resolves it through this chain:

1. **Registered icons** — custom icons registered via `registerIcon()` or `registerIcons()`
2. **Phosphor Icons** — 24 bundled Phosphor icons available synchronously
3. **Iconify fallback** — `loadIcon()` fetches from the Iconify API if neither source has the icon

## Public API

### Registration

#### `registerIcon(name, svg, options?)`

Register a single SVG icon globally. All components with an `icon` field can reference it by name.

```ts
function registerIcon(name: string, svg: string, options?: RegisterIconOptions): void;
```

```ts
type RegisterIconOptions = {
  aliases?: string[];    // Alternative names for the same icon
  weight?: IconWeight;   // "regular" | "duotone" — defaults to "regular"
};
```

**Example:**

```js
import { registerIcon } from "slexkit";

registerIcon(
  "my-custom-icon",
  `<svg viewBox="0 0 24 24" fill="none" ...>...</svg>`,
  { aliases: ["custom", "my-icon"] }
);
```

#### `registerIcons(icons, options?)`

Register multiple icons at once.

```ts
function registerIcons(icons: Record<string, string>, options?: RegisterIconOptions): void;
```

**Example:**

```js
import { registerIcons } from "slexkit";

registerIcons(
  {
    "cpu": `<svg>...</svg>`,
    "memory": `<svg>...</svg>`,
    "database": `<svg>...</svg>`,
  },
  { weight: "regular" }
);
```

#### `clearRegisteredIcons()`

Remove all custom registered icons from the global registry.

```ts
function clearRegisteredIcons(): void;
```

### Retrieval

#### `getIcon(name, state?)`

Resolve an icon synchronously. Returns the SVG string or an empty string if not found.

```ts
function getIcon(name: string, state?: IconWeight | IconState): string;
```

Looks up registered icons first, then falls back to bundled Phosphor icons. Does **not** fetch from Iconify.

#### `getRegisteredIcon(name, state?)`

Look up only from the registered icon registry. Returns the SVG string or an empty string. Does not check Phosphor or Iconify.

```ts
function getRegisteredIcon(name: string, state?: IconWeight | IconState): string;
```

Useful for checking if a custom icon exists without triggering Phosphor or Iconify lookups.

#### `loadIcon(name, state?)`

Resolve an icon asynchronously. Returns a Promise that resolves to the SVG string.

```ts
function loadIcon(name: string, state?: IconWeight | IconState): Promise<string>;
```

Searches registered icons → Phosphor → fetches from Iconify API as a last resort. Use this when the icon set is not known at build time.

### Name and weight utilities

#### `normalizeIconName(name)`

Normalize an icon name to standard kebab-case format. Handles set prefixes.

```ts
function normalizeIconName(name: string): string;
```

**Examples:**
- `"ArrowCircleUp"` → `"arrow-circle-up"`
- `"ph:arrow-circle-up"` → `"ph:arrow-circle-up"`
- `"my_set:MyIcon"` → `"my-set:my-icon"`
- `"phosphor:ArrowCircleUp"` → `"ph:arrow-circle-up"`

Set prefixes are normalized: `"phosphor"` / `"phosphor-icons"` become `"ph"`.

#### `resolveIconWeight(state?)`

Resolve the icon weight from component state. Auto-selects `"duotone"` for `selected`/`active`/`pressed`/`current` states.

```ts
function resolveIconWeight(state?: IconWeight | IconState): IconWeight;
```

```ts
type IconWeight = "regular" | "duotone";
type IconState = {
  selected?: boolean;
  active?: boolean;
  pressed?: boolean;
  current?: boolean;
};
```

#### `resolveIconifyIcon(name, state?)`

Resolve to an Iconify-compatible `{ prefix, name }` pair.

```ts
function resolveIconifyIcon(name: string, state?: IconWeight | IconState): { prefix: string; name: string };
```

#### `iconifySvgUrl(name, state?)`

Build the full Iconify API SVG URL for fetching a remote icon.

```ts
function iconifySvgUrl(name: string, state?: IconWeight | IconState): string;
```

#### `iconCacheKey(name, state?)`

Return the lookup key used internally for icon caching.

```ts
function iconCacheKey(name: string, state?: IconWeight | IconState): string;
```

## Built-in Phosphor icons

SlexKit bundles 23 Phosphor Icons in both regular and duotone weights (46 total SVG files):

| Icon | Name |
|------|------|
| CaretDown | `caret-down` |
| Check | `check` |
| CircleHalf | `circle-half` |
| List | `list` |
| Moon | `moon` |
| Sun | `sun` |
| Code | `code` |
| BookOpenText | `book-open-text` |
| CursorClick | `cursor-click` |
| GearSix | `gear-six` |
| Nut | `nut` |
| Screwdriver | `screwdriver` |
| Sparkle | `sparkle` |
| TerminalWindow | `terminal-window` |
| Wrench | `wrench` |
| Copy | `copy` |
| Eye | `eye` |
| ArrowSquareOut | `arrow-square-out` |
| SplitHorizontal | `split-horizontal` |
| SquareHalf | `square-half` |
| SquareSplitHorizontal | `square-split-horizontal` |
| File | `file` |
| X | `x` |

## Icon naming convention

Icons are referenced in Slex expressions using kebab-case names:

```js
"button:add": { text: "Add", icon: "plus" }
"link:docs": { text: "Docs", icon: "book-open-text" }
```

To use a custom icon set prefix:

```js
"card:info": { title: "Info", icon: "ph:info" }
"callout:tip": { title: "Tip", icon: "my-set:custom-bulb" }
```

The name resolution chain handles: `custom-icon` → registered first → bundled Phosphor → Iconify fetch (async only).

## Iconify fallback

When `loadIcon()` cannot find an icon in the registered or Phosphor sets, it fetches from the Iconify API:

```
https://api.iconify.design/<prefix>/<name>.svg
```

This enables access to thousands of icons beyond the built-in set. Fetched SVGs are sanitized before use.

## Usage in components

Components that accept an `icon` prop:

| Component | Icon location |
|-----------|--------------|
| Button | Before text |
| Badge | Before text |
| Card | Title area |
| Callout | Title area |
| Section | Eyebrow/title area |
| Link | Before text |
| Divider | Before/around label |
| Tabs | Tab header (icon or iconOnly mode) |
| Toast | Title area |
| Stat | Next to value |
| Accordion | Trigger area |
| Collapsible | Trigger area |
| Submit | Button icon area |

Icons automatically use duotone weight when the component or icon is in a selected/active/pressed state.
