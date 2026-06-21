import { mount } from "../engine/index";
import { parseEngineeringNumber } from "../engine/engineering";
import { SLEX_PROTOCOL_VERSION } from "../version";
import type { SlexExpression } from "../engine/types";

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

export type ToolTemplateCompiler<TArgs extends Record<string, unknown> = Record<string, unknown>> = (
  args: TArgs,
  runtime: ToolRuntime,
  call: ToolCall,
) => SlexExpression;

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

const templates = new Map<string, ToolTemplateCompiler>();

function cloneValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function namespaceFor(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeId(value: string, index: number): string {
  const id = value.replace(/[^A-Za-z0-9_$]/g, "_");
  return id ? `${id}_${index}` : `field_${index}`;
}

function exprKey(key: string): string {
  return JSON.stringify(key);
}

function normalizeOption(item: OptionListItem, index: number): Required<OptionListItem> {
  const id = item.id ?? item.value ?? String(index);
  return {
    id,
    value: item.value ?? id,
    label: item.label,
    description: item.description ?? "",
    selected: item.selected ?? false,
    disabled: item.disabled ?? false,
  };
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function registerBuiltInTemplate(name: string, compiler: ToolTemplateCompiler): void {
  templates.set(name, compiler);
}

export function registerToolTemplate(name: string, compiler: ToolTemplateCompiler): void {
  templates.set(name, compiler);
}

function compileConfirmAction(args: ConfirmActionArguments, runtime: ToolRuntime): SlexExpression {
  const requireReason = args.requireReason === true;

  return {
    slex: SLEX_PROTOCOL_VERSION,
    namespace: namespaceFor("tool_confirm_action"),
    g: {
      __slexkitTool: runtime,
      confirmed: true,
      requireReason,
      reason: "",
      canSubmit(this: { requireReason: boolean; reason: string }) {
        return !this.requireReason || this.reason.trim().length > 0;
      },
    },
    layout: {
      "card:tool": {
        title: args.title ?? "Confirm action",
        "text:description": {
          $if: args.description ? "true" : "false",
          text: args.description ?? "",
        },
        "column:reasonField": {
          $if: requireReason ? "true" : "false",
          "text:reasonLabel": {
            text: args.reasonLabel ?? "Reason",
          },
          "input:reason": {
            $value: "g.reason",
            placeholder: args.reasonPlaceholder ?? "Add a reason",
            onchange: "g.reason = String($event || '')",
          },
        },
        "submit:actions": {
          returnKeys: requireReason ? ["confirmed", "reason"] : ["confirmed"],
          submitLabel: args.confirmLabel ?? "Confirm",
          ignoreLabel: args.ignoreLabel ?? "Ignore",
          $disabled: "!g.canSubmit()",
        },
      },
    },
  };
}

function compileChooseOptions(args: ChooseOptionsArguments, runtime: ToolRuntime): SlexExpression {
  const options = (args.options ?? args.items ?? []).map(normalizeOption);
  const selected = Array.isArray(args.selected)
    ? args.selected
    : options.filter((item) => item.selected).map((item) => item.id);
  const multiple = args.multiple !== false;
  const minSelected = normalizeNumber(args.minSelected, 0);
  const maxSelected = normalizeNumber(args.maxSelected, Number.POSITIVE_INFINITY);
  const choiceNode = multiple
    ? {
        "checkbox:": {
          $for: "g.options",
          $key: "id",
          $checked: "g.selected.includes($item.id)",
          $label: "$item.description ? $item.label + ' - ' + $item.description : $item.label",
          $disabled: "$item.disabled",
          onchange: "g.toggle($item.id, Boolean($event))",
        },
      }
    : {
        "radio-group:option": {
          $value: "g.selected[0] || ''",
          options,
          onchange: "g.selectOne(String($event || ''))",
        },
      };

  return {
    slex: SLEX_PROTOCOL_VERSION,
    namespace: namespaceFor("tool_choose_options"),
    g: {
      __slexkitTool: runtime,
      options,
      multiple,
      minSelected,
      maxSelected,
      selected,
      canSubmit(this: { selected: string[]; minSelected: number; maxSelected: number }) {
        return this.selected.length >= this.minSelected && this.selected.length <= this.maxSelected;
      },
      toggle(
        this: {
          options: OptionListItem[];
          multiple: boolean;
          selected: string[];
          maxSelected: number;
        },
        id: string,
        checked: boolean,
      ) {
        const option = this.options.find((item: OptionListItem) => item.id === id);
        if (option?.disabled) return;
        if (!this.multiple) {
          this.selected = checked ? [id] : [];
          return;
        }
        const exists = this.selected.includes(id);
        if (checked && !exists && this.selected.length < this.maxSelected) {
          this.selected = [...this.selected, id];
        }
        if (!checked && exists) {
          this.selected = this.selected.filter((value: string) => value !== id);
        }
      },
      selectOne(this: { selected: string[]; options: OptionListItem[] }, id: string) {
        const option = this.options.find((item: OptionListItem) => item.id === id);
        if (option?.disabled) return;
        this.selected = id ? [id] : [];
      },
    },
    layout: {
      "card:tool": {
        title: args.title ?? "Choose options",
        "text:description": {
          $if: args.description ? "true" : "false",
          text: args.description ?? "",
        },
        ...choiceNode,
        "submit:actions": {
          returnKeys: ["selected"],
          submitLabel: args.submitLabel ?? "Submit",
          ignoreLabel: args.ignoreLabel ?? "Ignore",
          $disabled: "!g.canSubmit()",
        },
      },
    },
  };
}

function initialFieldValues(fields: FormField[], args: FillFormArguments): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (args.values && Object.prototype.hasOwnProperty.call(args.values, field.name)) {
      values[field.name] = args.values[field.name];
    } else if (field.value !== undefined) {
      values[field.name] = field.value;
    } else if (field.type === "checkbox" || field.type === "switch") {
      values[field.name] = false;
    } else {
      values[field.name] = "";
    }
  }
  return values;
}

function initialEngineeringValues(fields: FormField[], values: Record<string, unknown>): Record<string, unknown> {
  const engineering: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "engineering") {
      const result = parseEngineeringNumber(values[field.name]);
      engineering[field.name] = result;
      values[field.name] = result.valid ? result.number : null;
    }
  }
  return engineering;
}

function fieldLayout(field: FormField, index: number): Record<string, unknown> {
  const id = safeId(field.name, index);
  const type = field.type ?? "text";
  const nameExpr = exprKey(field.name);
  const children: Record<string, unknown> = {};

  if (type === "checkbox" || type === "switch") {
    const component = type === "switch" ? "switch" : "checkbox";
    const stateProp = type === "switch" ? "$enabled" : "$checked";
    children[`${component}:${id}`] = {
      [stateProp]: `g.values[${nameExpr}]`,
      label: field.label ?? field.name,
      disabled: field.disabled === true,
      onchange: `g.setField(${nameExpr}, $event, ${exprKey(type)})`,
    };
  } else if (type === "select") {
    children[`select:${id}`] = {
      $value: `g.values[${nameExpr}]`,
      label: field.label ?? field.name,
      placeholder: field.placeholder ?? "Select...",
      options: field.options ?? [],
      disabled: field.disabled === true,
      onchange: `g.setField(${nameExpr}, $event, ${exprKey(type)})`,
    };
  } else {
    children[`text:label_${id}`] = {
      text: field.label ?? field.name,
    };
    children[`input:${id}`] = {
      $value: type === "engineering"
        ? `g.engineering[${nameExpr}] ? g.engineering[${nameExpr}].raw : g.values[${nameExpr}]`
        : `g.values[${nameExpr}]`,
      type: type === "number" || type === "engineering" ? type : "text",
      placeholder: field.placeholder ?? "",
      disabled: field.disabled === true,
      onchange: `g.setField(${nameExpr}, $event, ${exprKey(type)})`,
    };
  }

  if (field.description) {
    children[`text:description_${id}`] = {
      text: field.description,
    };
  }

  return children;
}

function compileFillForm(args: FillFormArguments, runtime: ToolRuntime): SlexExpression {
  const fields = args.fields ?? [];
  const values = initialFieldValues(fields, args);
  const engineering = initialEngineeringValues(fields, values);
  const fieldNodes: Record<string, unknown> = {};

  fields.forEach((field, index) => {
    fieldNodes[`column:${safeId(field.name, index)}`] = {
      ...fieldLayout(field, index),
    };
  });

  return {
    slex: SLEX_PROTOCOL_VERSION,
    namespace: namespaceFor("tool_fill_form"),
    g: {
      __slexkitTool: runtime,
      fields,
      values,
      engineering,
      ...values,
      setField(this: Record<string, unknown> & { values: Record<string, unknown>; engineering: Record<string, unknown> }, name: string, value: unknown, type: string) {
        let next = value;
        if (type === "number") {
          next = value === "" || value == null ? null : Number(value);
        } else if (type === "engineering") {
          const result = parseEngineeringNumber(value && typeof value === "object" && "raw" in value ? (value as { raw: unknown }).raw : value);
          this.engineering[name] = result;
          next = result.valid ? result.number : null;
        } else if (type === "checkbox" || type === "switch") {
          next = Boolean(value);
        }
        this.values[name] = next;
        this[name] = next;
      },
      canSubmit(this: { fields: FormField[]; values: Record<string, unknown>; engineering: Record<string, { valid?: boolean }> }) {
        return this.fields.every((field) => {
          if (!field.required) return true;
          if (field.type === "engineering") return this.engineering[field.name]?.valid === true;
          const value = this.values[field.name];
          if (typeof value === "string") return value.trim().length > 0;
          return value !== null && value !== undefined && value !== false;
        });
      },
    },
    layout: {
      "card:tool": {
        title: args.title ?? "Fill form",
        "text:description": {
          $if: args.description ? "true" : "false",
          text: args.description ?? "",
        },
        ...fieldNodes,
        "submit:actions": {
          returnKeys: fields.map((field) => field.name),
          submitLabel: args.submitLabel ?? "Submit",
          ignoreLabel: args.ignoreLabel ?? "Ignore",
          $disabled: "!g.canSubmit()",
        },
      },
    },
  };
}

registerBuiltInTemplate("confirm-action", compileConfirmAction as ToolTemplateCompiler);
registerBuiltInTemplate("choose-options", compileChooseOptions as ToolTemplateCompiler);
registerBuiltInTemplate("option-list", compileChooseOptions as ToolTemplateCompiler);
registerBuiltInTemplate("fill-form", compileFillForm as ToolTemplateCompiler);

function compileToolCall(call: ToolCall, runtime: ToolRuntime): SlexExpression {
  const compiler = templates.get(call.name);
  if (!compiler) throw new Error(`[SlexKit] Unknown tool template: ${call.name}`);
  return compiler(call.arguments ?? {}, runtime, call);
}

export function renderToolCall(call: ToolCall, container: HTMLElement): ToolRenderHandle {
  if (!templates.has(call.name)) {
    throw new Error(`[SlexKit] Unknown tool template: ${call.name}`);
  }

  let cleanup: (() => void) | undefined;
  let settled = false;

  const promise = new Promise<ToolResult>((resolve) => {
    const settle = (status: ToolResultStatus, value: Record<string, unknown> | null) => {
      if (settled) return;
      settled = true;
      resolve({
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

    cleanup = mount(compileToolCall(call, runtime), container);
  });

  return {
    promise,
    dispose: () => {
      if (cleanup) cleanup();
    },
  };
}
