import { register } from "../engine/registry";
import { createSvelteRenderer } from "./svelte/adapter";
import type { SvelteBuiltinComponent } from "./svelte/types";
import type { ComponentRegistrationOptions, ComponentStateMode } from "../engine/types";
import Column from "./svelte/layout/Column.svelte";
import Card from "./svelte/layout/Card.svelte";
import Grid from "./svelte/layout/Grid.svelte";
import Row from "./svelte/layout/Row.svelte";
import Slider from "./svelte/input/Slider.svelte";
import Button from "./svelte/input/Button.svelte";
import Checkbox from "./svelte/input/Checkbox.svelte";
import Switch from "./svelte/input/Switch.svelte";
import Input from "./svelte/input/Input.svelte";
import RadioGroup from "./svelte/input/RadioGroup.svelte";
import Select from "./svelte/input/Select.svelte";
import Submit from "./svelte/input/Submit.svelte";
import Step from "./svelte/input/Step.svelte";
import Tabs from "./svelte/input/Tabs.svelte";
import Accordion from "./svelte/disclosure/Accordion.svelte";
import Collapsible from "./svelte/disclosure/Collapsible.svelte";
import Progress from "./svelte/feedback/Progress.svelte";
import Toast from "./svelte/feedback/Toast.svelte";
import Stat from "./svelte/display/Stat.svelte";
import Text from "./svelte/display/Text.svelte";
import Badge from "./svelte/content/Badge.svelte";
import Callout from "./svelte/content/Callout.svelte";
import CodeBlock from "./svelte/content/CodeBlock.svelte";
import Divider from "./svelte/content/Divider.svelte";
import Formula from "./svelte/content/Formula.svelte";
import Link from "./svelte/content/Link.svelte";
import Table from "./svelte/content/Table.svelte";
import Section from "./svelte/content/Section.svelte";

const runtimeComponents = {
  column: Column,
  card: Card,
  grid: Grid,
  row: Row,
  slider: Slider,
  button: Button,
  checkbox: Checkbox,
  switch: Switch,
  input: Input,
  "radio-group": RadioGroup,
  select: Select,
  submit: Submit,
  step: Step,
  tabs: Tabs,
  accordion: Accordion,
  collapsible: Collapsible,
  progress: Progress,
  toast: Toast,
  stat: Stat,
  text: Text,
  badge: Badge,
  callout: Callout,
  "code-block": CodeBlock,
  divider: Divider,
  formula: Formula,
  link: Link,
  table: Table,
  section: Section,
} satisfies Record<string, SvelteBuiltinComponent>;

const componentStateModes: Record<string, ComponentStateMode> = {
  input: "value",
  slider: "value",
  select: "value",
  tabs: "value",
  "radio-group": "value",
  checkbox: "checked",
  switch: "enabled",
  stat: "readable",
  text: "readable",
  progress: "readable",
  badge: "readable",
  callout: "readable",
  "code-block": "readable",
  divider: "readable",
  formula: "readable",
  link: "readable",
  table: "readable",
  section: "readable",
};

export const ALL_COMPONENT_TYPES = Object.keys(runtimeComponents);

export function registerAll(): void {
  for (const [type, component] of Object.entries(runtimeComponents)) {
    registerSvelteComponent(type, component);
  }
}

export function registerSvelteComponent(
  type: string,
  component: SvelteBuiltinComponent,
  options: ComponentRegistrationOptions = {},
): void {
  register(type, createSvelteRenderer(type, component), { state: options.state ?? componentStateModes[type] ?? "none" });
}

export function registerSubset(types: string[]): void {
  for (const type of types) {
    const component = runtimeComponents[type as keyof typeof runtimeComponents];
    if (component) registerSvelteComponent(type, component);
    else console.warn("[SlexKit] Unknown component type:", type);
  }
}

registerAll();
