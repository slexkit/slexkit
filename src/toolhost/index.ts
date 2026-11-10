import { parseEngineeringNumber } from "../engine/engineering";
import { defineSlexElements, type SlexElement } from "../web-components";

export type ToolCall = {
  id?: string;
  name: string;
  arguments?: Record<string, unknown>;
};

export type ToolResultStatus = "submitted" | "ignored";

export type ToolResult = {
  toolCallId?: string;
  toolName: string;
  status: ToolResultStatus;
  value: Record<string, unknown> | null;
};

export type ToolRenderHandle = {
  promise: Promise<ToolResult>;
  dispose: () => void;
};

export type ToolRuntime = {
  submit: (value: Record<string, unknown>) => void;
  ignore: () => void;
};

export type ToolTemplateRender = Node | { node: Node; dispose?: () => void };

/** A trusted host-side DOM factory. Tool arguments are data, never executable source. */
export type ToolTemplateFactory<TArgs extends Record<string, unknown> = Record<string, unknown>> = (
  args: TArgs,
  runtime: ToolRuntime,
  call: ToolCall,
  document: Document,
) => ToolTemplateRender;

export type OptionListItem = {
  id?: string;
  value?: string;
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
};

export type ChooseOptionsArguments = {
  title?: string;
  description?: string;
  options?: OptionListItem[];
  items?: OptionListItem[];
  multiple?: boolean;
  selected?: string[];
  minSelected?: number;
  maxSelected?: number;
  submitLabel?: string;
  ignoreLabel?: string;
};

export type OptionListArguments = ChooseOptionsArguments;

export type ConfirmActionArguments = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  ignoreLabel?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
};

export type FormFieldType = "text" | "number" | "engineering" | "select" | "checkbox" | "switch";

export type FormField = {
  name: string;
  label?: string;
  type?: FormFieldType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: unknown;
  options?: Array<{ label: string; value: string; disabled?: boolean }>;
};

export type FillFormArguments = {
  title?: string;
  description?: string;
  fields?: FormField[];
  values?: Record<string, unknown>;
  submitLabel?: string;
  ignoreLabel?: string;
};

type Listener = { target: EventTarget; type: string; listener: EventListener };

const templates = new Map<string, ToolTemplateFactory>();

function cloneValue<T>(value: T): T {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function element(document: Document, type: string): SlexElement {
  return document.createElement(`slex-${type}`) as SlexElement;
}

function set(target: SlexElement, values: Record<string, unknown>): SlexElement {
  Object.assign(target, values);
  return target;
}

function listen(
  listeners: Listener[],
  target: EventTarget,
  type: string,
  listener: EventListener,
): void {
  target.addEventListener(type, listener);
  listeners.push({ target, type, listener });
}

function disposeListeners(listeners: Listener[]): void {
  for (const { target, type, listener } of listeners.splice(0))
    target.removeEventListener(type, listener);
}

function toolCard(
  document: Document,
  title: string,
  description: string,
): { root: SlexElement; body: SlexElement } {
  const root = set(element(document, "card"), { title, variant: "tool" });
  root.classList.add("slex-toolhost");
  const body = element(document, "column");
  if (description) body.append(set(element(document, "text"), { text: description }));
  root.append(body);
  return { root, body };
}

function submitBar(
  document: Document,
  listeners: Listener[],
  runtime: ToolRuntime,
  readValue: () => Record<string, unknown>,
  submitLabel: string,
  ignoreLabel: string,
): SlexElement {
  const actions = set(element(document, "submit"), { submitLabel, ignoreLabel });
  listen(listeners, actions, "submit", () => runtime.submit(readValue()));
  listen(listeners, actions, "ignore", () => runtime.ignore());
  return actions;
}

function normalizeOption(item: OptionListItem, index: number): Required<OptionListItem> {
  const id = text(item.id, text(item.value, String(index)));
  return {
    id,
    value: text(item.value, id),
    label: text(item.label, id),
    description: text(item.description),
    selected: item.selected === true,
    disabled: item.disabled === true,
  };
}

function confirmActionFactory(
  raw: Record<string, unknown>,
  runtime: ToolRuntime,
  _call: ToolCall,
  document: Document,
): ToolTemplateRender {
  const args = raw as ConfirmActionArguments;
  const listeners: Listener[] = [];
  const requireReason = args.requireReason === true;
  const { root, body } = toolCard(
    document,
    text(args.title, "Confirm action"),
    text(args.description),
  );
  let reason = "";
  if (requireReason) {
    const input = set(element(document, "input"), {
      label: text(args.reasonLabel, "Reason"),
      placeholder: text(args.reasonPlaceholder, "Add a reason"),
      value: "",
    });
    listen(listeners, input, "input", () => {
      reason = String(input.value ?? "");
      actions.disabled = reason.trim().length === 0;
    });
    body.append(input);
  }
  const actions = submitBar(
    document,
    listeners,
    runtime,
    () => (requireReason ? { confirmed: true, reason } : { confirmed: true }),
    text(args.confirmLabel, "Confirm"),
    text(args.ignoreLabel, "Ignore"),
  );
  actions.disabled = requireReason;
  body.append(actions);
  return { node: root, dispose: () => disposeListeners(listeners) };
}

function chooseOptionsFactory(
  raw: Record<string, unknown>,
  runtime: ToolRuntime,
  _call: ToolCall,
  document: Document,
): ToolTemplateRender {
  const args = raw as ChooseOptionsArguments;
  const listeners: Listener[] = [];
  const options = (Array.isArray(args.options) ? args.options : Array.isArray(args.items) ? args.items : [])
    .filter((item): item is OptionListItem => !!item && typeof item === "object")
    .map(normalizeOption);
  const knownIds = new Set(options.map((item) => item.id));
  let selected = (Array.isArray(args.selected)
    ? args.selected.filter((id): id is string => typeof id === "string" && knownIds.has(id))
    : options.filter((item) => item.selected).map((item) => item.id));
  const multiple = args.multiple !== false;
  if (!multiple) selected = selected.slice(0, 1);
  const minSelected = Math.max(0, number(args.minSelected, 0));
  const maxSelected = Math.max(minSelected, number(args.maxSelected, Number.POSITIVE_INFINITY));
  const { root, body } = toolCard(
    document,
    text(args.title, "Choose options"),
    text(args.description),
  );
  const updateValidity = () => {
    actions.disabled = selected.length < minSelected || selected.length > maxSelected;
  };

  if (multiple) {
    for (const option of options) {
      const choice = set(element(document, "checkbox"), {
        label: option.description ? `${option.label} - ${option.description}` : option.label,
        checked: selected.includes(option.id),
        disabled: option.disabled,
      });
      choice.dataset.optionId = option.id;
      listen(listeners, choice, "change", () => {
        if (option.disabled) return;
        const checked = choice.checked;
        const exists = selected.includes(option.id);
        if (checked && !exists) {
          if (selected.length >= maxSelected) choice.checked = false;
          else selected = [...selected, option.id];
        } else if (!checked && exists) {
          selected = selected.filter((id) => id !== option.id);
        }
        updateValidity();
      });
      body.append(choice);
    }
  } else {
    const choices = set(element(document, "radio-group"), {
      value: selected[0] ?? "",
      variant: "list",
      options: options.map((option) => ({
        value: option.id,
        label: option.label,
        description: option.description,
        disabled: option.disabled,
      })),
    });
    listen(listeners, choices, "change", () => {
      const id = String(choices.value ?? "");
      const option = options.find((candidate) => candidate.id === id);
      selected = id && option && !option.disabled ? [id] : [];
      updateValidity();
    });
    body.append(choices);
  }

  const actions = submitBar(
    document,
    listeners,
    runtime,
    () => ({ selected: [...selected] }),
    text(args.submitLabel, "Submit"),
    text(args.ignoreLabel, "Ignore"),
  );
  updateValidity();
  body.append(actions);
  return { node: root, dispose: () => disposeListeners(listeners) };
}

function fillFormFactory(
  raw: Record<string, unknown>,
  runtime: ToolRuntime,
  _call: ToolCall,
  document: Document,
): ToolTemplateRender {
  const args = raw as FillFormArguments;
  const listeners: Listener[] = [];
  const fields = (Array.isArray(args.fields) ? args.fields : []).filter(
    (field): field is FormField => !!field && typeof field === "object" && typeof field.name === "string" && field.name.length > 0,
  );
  if (new Set(fields.map((field) => field.name)).size !== fields.length)
    throw new Error("[SlexKit] fill-form field names must be unique");
  const values: Record<string, unknown> = {};
  const engineeringValidity = new Map<string, boolean>();
  const { root, body } = toolCard(
    document,
    text(args.title, "Fill form"),
    text(args.description),
  );
  const valid = () => fields.every((field) => {
    if (!field.required) return true;
    if (field.type === "engineering") return engineeringValidity.get(field.name) === true;
    const value = values[field.name];
    return typeof value === "string"
      ? value.trim().length > 0
      : value !== null && value !== undefined && value !== false;
  });
  const updateValidity = () => { actions.disabled = !valid(); };

  for (const field of fields) {
    const type = field.type ?? "text";
    const initial = args.values && Object.hasOwn(args.values, field.name)
      ? args.values[field.name]
      : field.value !== undefined
        ? field.value
        : type === "checkbox" || type === "switch"
          ? false
          : "";
    const controlType = type === "checkbox" || type === "switch" ? type : type === "select" ? "select" : "input";
    const control = set(element(document, controlType), {
      label: text(field.label, field.name),
      description: text(field.description),
      placeholder: text(field.placeholder, type === "select" ? "Select..." : ""),
      disabled: field.disabled === true,
    });
    control.dataset.fieldName = field.name;
    if (type === "checkbox") {
      control.checked = Boolean(initial);
      values[field.name] = control.checked;
    } else if (type === "switch") {
      control.enabled = Boolean(initial);
      values[field.name] = control.enabled;
    } else if (type === "select") {
      control.options = Array.isArray(field.options) ? field.options : [];
      control.value = initial == null ? "" : String(initial);
      values[field.name] = control.value;
    } else if (type === "engineering") {
      control.setAttribute("type", "engineering");
      control.value = initial == null ? "" : String(initial);
      const result = parseEngineeringNumber(control.value);
      engineeringValidity.set(field.name, result.valid);
      values[field.name] = result.valid ? result.number : null;
    } else if (type === "number") {
      control.setAttribute("type", "number");
      control.value = initial == null ? "" : String(initial);
      values[field.name] = control.value === "" ? null : Number(control.value);
    } else {
      control.setAttribute("type", "text");
      control.value = initial == null ? "" : String(initial);
      values[field.name] = control.value;
    }
    const eventType = type === "select" || type === "checkbox" || type === "switch" ? "change" : "input";
    listen(listeners, control, eventType, () => {
      if (type === "checkbox") values[field.name] = control.checked;
      else if (type === "switch") values[field.name] = control.enabled;
      else if (type === "number") {
        const rawValue = String(control.value ?? "");
        values[field.name] = rawValue === "" ? null : Number(rawValue);
      } else if (type === "engineering") {
        const result = parseEngineeringNumber(control.value);
        engineeringValidity.set(field.name, result.valid);
        values[field.name] = result.valid ? result.number : null;
      } else values[field.name] = control.value;
      updateValidity();
    });
    body.append(control);
  }

  const actions = submitBar(
    document,
    listeners,
    runtime,
    () => cloneValue(values),
    text(args.submitLabel, "Submit"),
    text(args.ignoreLabel, "Ignore"),
  );
  updateValidity();
  body.append(actions);
  return { node: root, dispose: () => disposeListeners(listeners) };
}

function registerBuiltInTemplate(name: string, factory: ToolTemplateFactory): void {
  templates.set(name, factory);
}

registerBuiltInTemplate("confirm-action", confirmActionFactory);
registerBuiltInTemplate("choose-options", chooseOptionsFactory);
registerBuiltInTemplate("option-list", chooseOptionsFactory);
registerBuiltInTemplate("fill-form", fillFormFactory);

export function registerToolTemplate(name: string, factory: ToolTemplateFactory): void {
  if (!name.trim()) throw new Error("[SlexKit] Tool template name is required");
  if (typeof factory !== "function") throw new TypeError("[SlexKit] Tool template must be a DOM factory");
  templates.set(name, factory);
}

export function renderToolCall(call: ToolCall, container: HTMLElement): ToolRenderHandle {
  const factory = templates.get(call.name);
  if (!factory) throw new Error(`[SlexKit] Unknown tool template: ${call.name}`);
  const document = container.ownerDocument;
  const owner = document.defaultView as (Window & typeof globalThis) | null;
  if (!owner) throw new Error("[SlexKit] ToolHost requires a document window");
  defineSlexElements({ window: owner });

  let settled = false;
  let disposed = false;
  let factoryDispose: (() => void) | undefined;
  let root: Node | undefined;
  let resolveResult!: (result: ToolResult) => void;
  const promise = new Promise<ToolResult>((resolve) => { resolveResult = resolve; });
  const settle = (status: ToolResultStatus, value: Record<string, unknown> | null) => {
    if (settled || disposed) return;
    settled = true;
    resolveResult({
      toolCallId: call.id,
      toolName: call.name,
      status,
      value: cloneValue(value),
    });
  };
  const runtime: ToolRuntime = {
    submit: (value) => settle("submitted", value),
    ignore: () => settle("ignored", null),
  };
  const rendered = factory(call.arguments ?? {}, runtime, call, document);
  if (rendered instanceof owner.Node) root = rendered;
  else if (rendered && rendered.node instanceof owner.Node) {
    root = rendered.node;
    factoryDispose = rendered.dispose;
  } else throw new TypeError("[SlexKit] Tool template must return a DOM Node");
  container.replaceChildren(root);

  return {
    promise,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      factoryDispose?.();
      if (root?.parentNode === container) container.removeChild(root);
    },
  };
}
