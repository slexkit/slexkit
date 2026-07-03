export type SlexExpression = {
  slex?: string;
  namespace?: string;
  g?: Record<string, unknown>;
  layout?: LayoutNode;
  [key: string]: unknown;
};

/** @deprecated Use SlexExpression instead. */
export type DSL = SlexExpression;

export type LayoutNode = Record<string, unknown>;
export type ComponentState = Record<string, unknown>;
export type ComponentStateMap = Record<string, ComponentState>;
export type ComponentTypeMap = Record<string, string>;
export type ComponentStateMode = "value" | "checked" | "enabled" | "readable" | "none";

export type ComponentRegistrationOptions = {
  state?: ComponentStateMode;
};

export type ForContext = {
  $item?: unknown;
  $index?: number | (() => number);
  $key?: unknown;
  [identifier: string]: unknown;
};

export type ForSlot = {
    key: unknown;
    el: HTMLElement | null;
  forCtx: ForContext;
  index: number;
  item: unknown;
  props: Record<string, unknown>;
  children: Record<string, unknown>;
  indexSignal?: [() => number, (v: number) => void];
  revision?: number;
  revisionSignal?: [() => number, (v: number) => void];
  dispose?: () => void;
};

export type ComponentRenderer = (
  props: Record<string, unknown>,
  name: string,
  ctx: RenderContext,
) => HTMLElement | void;

export type ThemeMode = "auto" | "host-shadcn" | "uno" | "flowbite";
export type DirectionMode = "ltr" | "rtl" | "auto";
export type RuntimeLabels = Partial<Record<string, string>>;

export type MountOptions = {
  theme?: ThemeMode;
  dir?: DirectionMode;
  labels?: RuntimeLabels;
  api?: Record<string, unknown>;
  executionMode?: "live" | "preview";
};

export type RenderContext = {
  g: Record<string, unknown>;
  std: import("./stdlib").SlexKitStdlib;
  api?: Record<string, unknown>;
  dir: Exclude<DirectionMode, "auto">;
  labels: RuntimeLabels;
  document: Document;
  forCtx?: ForContext;
  children: Record<string, unknown>;
  renderTree: (layout: LayoutNode, container: HTMLElement, forCtx?: ForContext) => void;
  emit: (eventName: string, data?: unknown) => void;
  id: string | null;
};
