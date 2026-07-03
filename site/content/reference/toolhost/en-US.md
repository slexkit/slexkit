---
title: ToolHost
category: Reference
status: ready
order: 70
summary: "Structured user-input UI for confirmations, choices, forms, templates, and submit boundaries."
slexkitRenderMode: component
---

# ToolHost

ToolHost bridges AI tool calls to interactive UI. Instead of the AI executing tools server-side, ToolHost renders a structured input form in the browser and returns the user's response as a `ToolResult`.

## Concepts

When an AI model emits a tool call (e.g., `confirm-action`, `fill-form`), ToolHost compiles it into a standard `SlexExpression` and mounts it using the core runtime. The mounted UI has a **submit boundary** (`submit:actions` component) that settles a Promise with the user's input.

ToolHost is **separate from display-oriented `slex` fences**. Display components render information; ToolHost components collect structured user input and return it programmatically.

## Public API

### `renderToolCall(call, container) → ToolRenderHandle`

Compiles a tool call into a SlexExpression, mounts it, and returns a handle.

```ts
function renderToolCall(call: ToolCall, container: HTMLElement): ToolRenderHandle;
```

```ts
type ToolRenderHandle = {
  promise: Promise<ToolResult>;  // Resolves when user submits or ignores
  dispose: () => void;           // Clean up the rendered UI
};

type ToolResult =
  | { toolCallId?: string; toolName: string; status: "submitted"; value: Record<string, unknown> }
  | { toolCallId?: string; toolName: string; status: "ignored"; value: null };
```

**Usage:**

```js
import { renderToolCall } from "slexkit";

const handle = renderToolCall(
  {
    id: "call_001",
    name: "confirm-action",
    arguments: {
      title: "Delete file?",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      requireReason: true,
    },
  },
  document.getElementById("tool-container"),
);

handle.promise.then((result) => {
  console.log(result.status); // "submitted" or "ignored"
  console.log(result.value);  // { confirmed: true, reason: "Obsolete file" }
  handle.dispose();
});
```

### `registerToolTemplate(name, compiler)`

Register a custom tool template. The compiler function receives the tool arguments and returns a `SlexExpression`.

```ts
function registerToolTemplate(name: string, compiler: ToolTemplateCompiler): void;

type ToolTemplateCompiler<TArgs = Record<string, unknown>> = (
  args: TArgs,
  runtime: ToolRuntime,
  call: ToolCall,
) => SlexExpression;

type ToolRuntime = {
  submit: (value: Record<string, unknown>) => void;
  ignore: () => void;
};
```

## Built-in templates

### `confirm-action`

Yes/no confirmation dialog. Supports an optional reason field.

**Arguments (`ConfirmActionArguments`):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | `"Confirm action"` | Dialog title |
| `description` | `string` | — | Optional explanation text |
| `confirmLabel` | `string` | `"Confirm"` | Submit button label |
| `ignoreLabel` | `string` | `"Ignore"` | Cancel button label |
| `requireReason` | `boolean` | `false` | Show a reason text input |
| `reasonLabel` | `string` | `"Reason"` | Label for the reason input |
| `reasonPlaceholder` | `string` | `"Add a reason"` | Placeholder for the reason input |

**Result value:**

| Key | Type | Description |
|-----|------|-------------|
| `confirmed` | `boolean` | Always `true` when submitted |
| `reason` | `string` | User's reason text (only if `requireReason: true`) |

**Example:**

```js
renderToolCall({
  name: "confirm-action",
  arguments: {
    title: "Delete project?",
    description: "This will permanently delete all files.",
    confirmLabel: "Delete",
    requireReason: true,
  },
}, container);
```

### `choose-options` / `option-list`

Single or multi-select option list. `option-list` is an alias for `choose-options` — behavior is identical.

**Arguments (`ChooseOptionsArguments` / `OptionListArguments`):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | `"Choose options"` | Dialog title |
| `description` | `string` | — | Optional explanation text |
| `options` / `items` | `OptionListItem[]` | `[]` | List of selectable items |
| `multiple` | `boolean` | `true` | Allow multiple selection |
| `selected` | `string[]` | auto | Pre-selected item IDs |
| `minSelected` | `number` | `0` | Minimum required selections |
| `maxSelected` | `number` | `Infinity` | Maximum allowed selections |
| `submitLabel` | `string` | `"Submit"` | Submit button label |
| `ignoreLabel` | `string` | `"Ignore"` | Cancel button label |

**OptionListItem:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Display text (required) |
| `id` | `string` | Unique identifier (defaults to `value` or index) |
| `value` | `string` | Submitted value (defaults to `id`) |
| `description` | `string` | Secondary text shown after label |
| `selected` | `boolean` | Pre-selected state |
| `disabled` | `boolean` | Disabled state |

**Rendering:**
- When `multiple: true` (default): renders **checkboxes**
- When `multiple: false`: renders a **radio group**

**Result value:**

| Key | Type | Description |
|-----|------|-------------|
| `selected` | `string[]` | IDs of selected items |

**Example:**

```js
renderToolCall({
  name: "choose-options",
  arguments: {
    title: "Select dependencies",
    options: [
      { id: "react", label: "React", description: "UI library" },
      { id: "vue", label: "Vue", description: "Progressive framework" },
      { id: "svelte", label: "Svelte", description: "Compiled framework", selected: true },
    ],
    multiple: true,
    minSelected: 1,
    maxSelected: 2,
  },
}, container);
```

### `fill-form`

Multi-field form with various field types.

**Arguments (`FillFormArguments`):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | `"Fill form"` | Form title |
| `description` | `string` | — | Optional explanation text |
| `fields` | `FormField[]` | `[]` | Form field definitions |
| `values` | `Record<string, unknown>` | — | Initial field values |
| `submitLabel` | `string` | `"Submit"` | Submit button label |
| `ignoreLabel` | `string` | `"Ignore"` | Cancel button label |

**FormField:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | (required) | Field name (used as key in result value) |
| `type` | `FormFieldType` | `"text"` | Field type |
| `label` | `string` | `name` | Display label |
| `description` | `string` | — | Help text below the field |
| `placeholder` | `string` | — | Input placeholder |
| `required` | `boolean` | `false` | Require non-empty value to submit |
| `disabled` | `boolean` | `false` | Disable the field |
| `value` | `unknown` | — | Initial value |
| `options` | `Array<{label, value}>` | — | Options for `select` type |

**FormFieldType:**

| Type | Renders | Description |
|------|---------|-------------|
| `text` | `<input>` | Free-form text |
| `number` | `<input type="number">` | Numeric input, value is `number \| null` |
| `engineering` | `<input>` with SI prefix parsing | Accepts values like `"10kΩ"`, `"100nF"`, `"1.5MegHz"`. Parsed with `parseEngineeringNumber()`. State includes `raw`, `number`, `valid`, `prefix`, `unit`, `normalized` |
| `select` | `<select>` | Dropdown from `options` array |
| `checkbox` | Checkbox | Boolean toggle |
| `switch` | Switch toggle | Boolean toggle (switch style) |

**Result value:**

An object with a key for each field name, containing the submitted value. For `engineering` fields, the raw input string is submitted. For `checkbox`/`switch` fields, a boolean is submitted. For `number` fields, a number or `null` is submitted.

**Example:**

```js
renderToolCall({
  name: "fill-form",
  arguments: {
    title: "New project",
    fields: [
      { name: "name", type: "text", label: "Project name", required: true },
      { name: "framework", type: "select", label: "Framework", options: [
        { label: "React", value: "react" },
        { label: "Svelte", value: "svelte" },
      ]},
      { name: "resistance", type: "engineering", label: "Target resistance", placeholder: "e.g. 10kΩ" },
      { name: "typescript", type: "checkbox", label: "Use TypeScript", value: true },
    ],
  },
}, container);
```

## Writing a custom template

Implement the `ToolTemplateCompiler` function and register it:

```js
import { registerToolTemplate, renderToolCall } from "slexkit";

registerToolTemplate("greet-user", (args, runtime, call) => ({
  namespace: `tool_greet_${Date.now()}`,
  g: {
    __slexkitTool: runtime,
    name: args.name || "World",
  },
  layout: {
    "card:tool": {
      title: "Greeting",
      "text:message": { "$content": "'Hello, ' + g.name + '!'" },
      "submit:actions": {
        returnKeys: ["name"],
        submitLabel: args.submitLabel || "OK",
        ignoreLabel: args.ignoreLabel || "Cancel",
      },
    },
  },
}));

renderToolCall(
  { name: "greet-user", arguments: { name: "Alice" } },
  container,
);
```

### Key patterns

1. **`__slexkitTool`** — Set `g.__slexkitTool = runtime` to give expressions access to `submit()` and `ignore()`
2. **`submit:actions`** — Always include a `submit:actions` component to return the ToolHost result. Set `returnKeys` to the property names that should be included in the result value
3. **`canSubmit`** — Add a `g.canSubmit()` method to control the submit button's disabled state
4. **Unique namespace** — Use a timestamp-based namespace to avoid collisions with other tool calls
5. **Validation** — Implement validation logic in `g` methods and wire `$disabled` on the submit button
