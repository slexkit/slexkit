import type { ComponentRegistrationOptions, ComponentRenderer, ComponentStateMode } from "./types";

type ComponentRegistration = {
  renderFn: ComponentRenderer;
  options: Required<ComponentRegistrationOptions>;
};

const _registry = new Map<string, ComponentRegistration>();

export function register(
  type: string,
  renderFn: ComponentRenderer,
  options: ComponentRegistrationOptions = {},
): void {
  _registry.set(type, {
    renderFn,
    options: {
      state: options.state ?? "none",
    },
  });
}

export function getRenderer(type: string): ComponentRenderer | undefined {
  return _registry.get(type)?.renderFn;
}

export function getComponentStateMode(type: string): ComponentStateMode {
  return _registry.get(type)?.options.state ?? "none";
}
