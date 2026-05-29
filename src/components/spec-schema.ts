import type { ComponentStateMode, SlexExpression } from "../engine/types";

export type ComponentSpecStatus = "ready" | "draft" | "experimental" | "deprecated";

export type ComponentSpecCategory =
  | "Layout"
  | "Content"
  | "Display"
  | "Action"
  | "Input"
  | "Navigation"
  | "Disclosure"
  | "Feedback"
  | "Data"
  | "Tooling"
  | "Component";

export type PropSpec = {
  type: string;
  required?: boolean;
  default?: unknown;
  dynamic?: boolean;
  values?: readonly string[];
  description: string;
};

export type ChildrenSpec = {
  allowed: boolean;
  description?: string;
};

export type ComponentExampleSpec = {
  id: string;
  title: string;
  description?: string;
  source: SlexExpression;
};

export type ComponentDocsSpec = {
  href: string;
  anchors?: Record<string, string>;
};

export type ComponentSpec = {
  type: string;
  category: ComponentSpecCategory;
  status: ComponentSpecStatus;
  state: ComponentStateMode;
  since: string;
  title: string;
  summary: string;
  description: string;
  props: Record<string, PropSpec>;
  children: ChildrenSpec;
  examples: ComponentExampleSpec[];
  docs: ComponentDocsSpec;
};

export type ComponentSpecLocaleEntry = {
  source: string;
  sourceHash: string;
  translation: string;
};

export type ComponentSpecLocaleOverlay = {
  locale: string;
  entries: Record<string, ComponentSpecLocaleEntry>;
};

export type LocalizedText = {
  value: string;
  source: string;
  key: string;
  stale: boolean;
  missing: boolean;
};

export type LocalizedPropSpec = Omit<PropSpec, "description"> & {
  description: string;
  descriptionMeta: LocalizedText;
};

export type LocalizedChildrenSpec = Omit<ChildrenSpec, "description"> & {
  description?: string;
  descriptionMeta?: LocalizedText;
};

export type LocalizedComponentSpec = Omit<ComponentSpec, "title" | "summary" | "description" | "props" | "children"> & {
  locale: string;
  title: string;
  summary: string;
  description: string;
  titleMeta: LocalizedText;
  summaryMeta: LocalizedText;
  descriptionMeta: LocalizedText;
  props: Record<string, LocalizedPropSpec>;
  children: LocalizedChildrenSpec;
};
