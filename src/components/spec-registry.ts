import type { ComponentSpec, ComponentSpecLocaleOverlay, LocalizedComponentSpec, LocalizedText } from "./spec-schema";
import { componentSpecs } from "./entries/specs";

export { componentSpecs };

export const publicComponentTypes = componentSpecs.map((spec) => spec.type);

const componentSpecByType = new Map(componentSpecs.map((spec) => [spec.type, spec]));

export function getComponentSpec(type: string): ComponentSpec | undefined {
  return componentSpecByType.get(type);
}

export function hashSpecText(source: string): string {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function componentSpecTextKey(type: string, field: "title" | "summary" | "description"): string {
  return `components.${type}.${field}`;
}

export function componentPropTextKey(type: string, prop: string): string {
  return `components.${type}.props.${prop}.description`;
}

export function componentChildrenTextKey(type: string): string {
  return `components.${type}.children.description`;
}

function localizeText(
  key: string,
  source: string,
  overlay: ComponentSpecLocaleOverlay | undefined,
): LocalizedText {
  const entry = overlay?.entries[key];
  const sourceHash = hashSpecText(source);
  const missing = !entry?.translation;
  const stale = Boolean(entry?.translation && entry.sourceHash && entry.sourceHash !== sourceHash);

  return {
    key,
    source,
    value: missing || stale ? source : entry.translation,
    missing,
    stale,
  };
}

export function localizeComponentSpec(
  spec: ComponentSpec,
  locale = "en-US",
  overlay?: ComponentSpecLocaleOverlay,
): LocalizedComponentSpec {
  const titleMeta = localizeText(componentSpecTextKey(spec.type, "title"), spec.title, overlay);
  const summaryMeta = localizeText(componentSpecTextKey(spec.type, "summary"), spec.summary, overlay);
  const descriptionMeta = localizeText(componentSpecTextKey(spec.type, "description"), spec.description, overlay);
  const childrenDescription = spec.children.description
    ? localizeText(componentChildrenTextKey(spec.type), spec.children.description, overlay)
    : undefined;
  const props = Object.fromEntries(
    Object.entries(spec.props).map(([name, prop]) => {
      const descriptionMeta = localizeText(componentPropTextKey(spec.type, name), prop.description, overlay);
      return [name, {
        ...prop,
        description: descriptionMeta.value,
        descriptionMeta,
      }];
    }),
  );

  return {
    ...spec,
    locale,
    title: titleMeta.value,
    summary: summaryMeta.value,
    description: descriptionMeta.value,
    titleMeta,
    summaryMeta,
    descriptionMeta,
    props,
    children: childrenDescription
      ? {
        ...spec.children,
        description: childrenDescription.value,
        descriptionMeta: childrenDescription,
      }
      : spec.children,
  };
}

export function localizeComponentSpecs(
  locale = "en-US",
  overlay?: ComponentSpecLocaleOverlay,
): LocalizedComponentSpec[] {
  return componentSpecs.map((spec) => localizeComponentSpec(spec, locale, overlay));
}

export function getLocalizedComponentSpec(
  type: string,
  locale = "en-US",
  overlay?: ComponentSpecLocaleOverlay,
): LocalizedComponentSpec | undefined {
  const spec = getComponentSpec(type);
  return spec ? localizeComponentSpec(spec, locale, overlay) : undefined;
}
