import type { SvelteBuiltinComponent } from "../components/svelte/types";
import Column from "../components/svelte/layout/Column.svelte";
import Card from "../components/svelte/layout/Card.svelte";
import Grid from "../components/svelte/layout/Grid.svelte";
import Row from "../components/svelte/layout/Row.svelte";
import Input from "../components/svelte/input/Input.svelte";
import Slider from "../components/svelte/input/Slider.svelte";
import Checkbox from "../components/svelte/input/Checkbox.svelte";
import Switch from "../components/svelte/input/Switch.svelte";
import Button from "../components/svelte/input/Button.svelte";
import Stat from "../components/svelte/display/Stat.svelte";
import Text from "../components/svelte/display/Text.svelte";
import Progress from "../components/svelte/feedback/Progress.svelte";
import Badge from "../components/svelte/content/Badge.svelte";
import CodeBlock from "../components/svelte/content/CodeBlock.svelte";
import Divider from "../components/svelte/content/Divider.svelte";
import Link from "../components/svelte/content/Link.svelte";
import Table from "../components/svelte/content/Table.svelte";
import Select from "../components/svelte/input/Select.svelte";
import RadioGroup from "../components/svelte/input/RadioGroup.svelte";
import Tabs from "../components/svelte/input/Tabs.svelte";
import Accordion from "../components/svelte/disclosure/Accordion.svelte";
import Collapsible from "../components/svelte/disclosure/Collapsible.svelte";
import Formula from "../components/svelte/content/Formula.svelte";
import Callout from "../components/svelte/content/Callout.svelte";
import Section from "../components/svelte/content/Section.svelte";
import Step from "../components/svelte/input/Step.svelte";
import Toast from "../components/svelte/feedback/Toast.svelte";
import Submit from "./Submit.svelte";

type Definition = {
  component: SvelteBuiltinComponent;
  properties: string[];
  children?: boolean;
  state?: "value" | "checked" | "enabled" | "open";
};

const input = ["label", "unit", "description", "disabled", "name", "value", "aria-label"];

/** One source for registration, observed attributes, and the published manifest. */
export const elementDefinitions = {
  column: { component: Column, properties: [], children: true },
  card: { component: Card, properties: ["title", "icon", "tone", "variant"], children: true },
  grid: {
    component: Grid,
    properties: ["columns", "smColumns", "mdColumns", "lgColumns", "xlColumns", "gap"],
    children: true,
  },
  row: { component: Row, properties: ["gap", "align", "justify"], children: true },
  input: {
    component: Input,
    properties: [
      ...input,
      "type",
      "placeholder",
      "readOnly",
      "required",
      "invalid",
      "error",
      "min",
      "max",
      "step",
    ],
    state: "value",
  },
  slider: {
    component: Slider,
    properties: [...input, "min", "max", "step", "orientation"],
    state: "value",
  },
  checkbox: { component: Checkbox, properties: [...input, "checked"], state: "checked" },
  switch: { component: Switch, properties: [...input, "checked", "enabled"], state: "enabled" },
  button: {
    component: Button,
    properties: [
      "label",
      "icon",
      "variant",
      "disabled",
      "pressed",
      "selected",
      "title",
      "aria-label",
    ],
  },
  stat: {
    component: Stat,
    properties: ["label", "value", "unit", "icon", "tone", "animateInitial"],
  },
  text: { component: Text, properties: ["content", "text", "label", "variant", "color", "size"] },
  progress: {
    component: Progress,
    properties: ["label", "value", "icon", "indeterminate", "aria-label"],
  },
  badge: { component: Badge, properties: ["label", "text", "icon", "tone", "variant"] },
  "code-block": { component: CodeBlock, properties: ["code", "content", "language", "title"] },
  divider: { component: Divider, properties: ["label", "icon"] },
  link: { component: Link, properties: ["text", "label", "href", "target", "icon", "variant"] },
  table: { component: Table, properties: ["columns", "rows", "items"] },
  select: {
    component: Select,
    properties: [...input, "options", "placeholder", "icon", "variant", "required"],
    state: "value",
  },
  "radio-group": {
    component: RadioGroup,
    properties: [...input, "options", "orientation", "icon", "variant", "required"],
    state: "value",
  },
  tabs: { component: Tabs, properties: ["value", "tabs", "orientation"], state: "value" },
  accordion: { component: Accordion, properties: ["value", "items", "multiple"], state: "value" },
  collapsible: {
    component: Collapsible,
    properties: ["open", "trigger", "icon", "content"],
    state: "open",
    children: true,
  },
  formula: { component: Formula, properties: ["tex", "displayMode"] },
  callout: {
    component: Callout,
    properties: ["title", "content", "description", "tone", "icon"],
    children: true,
  },
  section: { component: Section, properties: ["title", "subtitle", "icon"], children: true },
  step: {
    component: Step,
    properties: ["title", "description", "index", "total", "state", "progress"],
    children: true,
  },
  toast: {
    component: Toast,
    properties: ["title", "description", "tone", "icon", "duration", "dismissable"],
  },
  submit: { component: Submit, properties: ["submitLabel", "ignoreLabel", "disabled"] },
} satisfies Record<string, Definition>;

export type SlexElementType = keyof typeof elementDefinitions;
export const booleanProperties = new Set([
  "disabled",
  "readOnly",
  "required",
  "invalid",
  "checked",
  "enabled",
  "pressed",
  "selected",
  "animateInitial",
  "indeterminate",
  "open",
  "multiple",
  "displayMode",
  "dismissable",
]);
export const objectProperties = new Set(["rows", "items", "options", "tabs"]);
export const attributeName = (property: string): string =>
  property === "readOnly"
    ? "readonly"
    : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export function describeSlexElements() {
  return Object.entries(elementDefinitions).map(([type, definition]) => ({
    tagName: `slex-${type}`,
    properties: definition.properties.map((name) => ({
      name,
      attribute:
        objectProperties.has(name) || (type === "table" && name === "columns")
          ? undefined
          : attributeName(name),
      type: booleanProperties.has(name)
        ? "boolean"
        : objectProperties.has(name) || (type === "table" && name === "columns")
          ? "array"
          : "string | number",
    })),
    slots:
      type === "tabs" || type === "accordion"
        ? ["(named panels)"]
        : "children" in definition
          ? [""]
          : [],
    events:
      "state" in definition
        ? ["input", "change"]
        : type === "button"
          ? ["click"]
          : type === "submit"
            ? ["submit", "ignore"]
            : type === "toast"
              ? ["close"]
              : [],
  }));
}
