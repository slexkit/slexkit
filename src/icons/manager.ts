import {
  getPhosphorIcon,
  iconCacheKey,
  iconifySvgUrl,
  loadPhosphorIcon,
  resolveIconifyIcon,
  resolvePhosphorIconWeight,
} from "./phosphor";
import type { PhosphorIconState, PhosphorIconWeight } from "./phosphor";

export type IconWeight = PhosphorIconWeight;
export type IconState = PhosphorIconState;

export interface RegisterIconOptions {
  aliases?: string[];
  weight?: IconWeight;
}

const registeredIcons = new Map<string, string>();

function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function normalizeIconSet(value: string): string {
  const iconSet = toKebabCase(value);
  if (iconSet === "phosphor" || iconSet === "phosphor-icons") return "ph";
  return iconSet;
}

export function normalizeIconName(name: string): string {
  const raw = name.trim();
  const separator = raw.indexOf(":");
  if (separator < 0) return toKebabCase(raw);
  return `${normalizeIconSet(raw.slice(0, separator))}:${toKebabCase(raw.slice(separator + 1))}`;
}

function registeredIconKey(name: string, state: IconWeight | IconState = "regular"): string {
  return `${normalizeIconName(name)}|${resolveIconWeight(state)}`;
}

function registerIconName(
  name: string,
  svg: string,
  state: IconWeight | IconState = "regular",
): void {
  const key = registeredIconKey(name, state);
  if (key && svg) registeredIcons.set(key, svg);
}

export function registerIcon(name: string, svg: string, options: RegisterIconOptions = {}): void {
  const weight = options.weight ?? "regular";
  registerIconName(name, svg, weight);
  for (const alias of options.aliases ?? []) registerIconName(alias, svg, weight);
}

export function registerIcons(
  icons: Record<string, string>,
  options: RegisterIconOptions = {},
): void {
  for (const [name, svg] of Object.entries(icons)) registerIcon(name, svg, options);
}

export function clearRegisteredIcons(): void {
  registeredIcons.clear();
}

export function getRegisteredIcon(name: string, state: IconWeight | IconState = "regular"): string {
  return (
    registeredIcons.get(registeredIconKey(name, state)) ??
    registeredIcons.get(registeredIconKey(name, "regular")) ??
    ""
  );
}

export function getIcon(name: string, state: IconWeight | IconState = "regular"): string {
  return getRegisteredIcon(name, state) || getPhosphorIcon(name, state);
}

export async function loadIcon(
  name: string,
  state: IconWeight | IconState = "regular",
): Promise<string> {
  return getIcon(name, state) || loadPhosphorIcon(name, state);
}

export { iconCacheKey, iconifySvgUrl, resolveIconifyIcon };

export function resolveIconWeight(state: IconWeight | IconState = "regular"): IconWeight {
  return resolvePhosphorIconWeight(state);
}
