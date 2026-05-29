import type { ComponentSpec } from "./spec-schema";
import type { SlexExpression } from "../engine/types";
import { SLEX_PROTOCOL_VERSION } from "../version";

const SINCE = "0.1.0";

export function docs(type: string) {
  return {
    href: `/docs/components/${type}`,
    anchors: {
      api: `${type}-api-reference`,
      examples: `${type}-canonical-example`,
    },
  };
}

function isSlexExpression(value: Record<string, unknown> | SlexExpression): value is SlexExpression {
  return typeof value.namespace === "string" && typeof value.layout === "object" && value.layout !== null;
}

export function example(type: string, propsOrSource: Record<string, unknown> | SlexExpression, title = "Basic usage"): ComponentSpec["examples"][number] {
  return {
    id: "basic",
    title,
    source: isSlexExpression(propsOrSource)
      ? {
          slex: propsOrSource.slex ?? SLEX_PROTOCOL_VERSION,
          ...propsOrSource,
        }
      : {
          slex: SLEX_PROTOCOL_VERSION,
          namespace: `spec_${type.replaceAll("-", "_")}_basic`,
          layout: {
            [`${type}:demo`]: propsOrSource,
          },
        },
  };
}

export const semanticTones = ["info", "success", "warning", "danger", "muted"] as const;
const inputState = ["input", "slider", "select", "tabs", "radio-group"] as const;
const checkedState = ["checkbox"] as const;
const enabledState = ["switch"] as const;
const readableState = ["stat", "text", "progress", "badge", "callout", "code-block", "divider", "link", "table", "section"] as const;

export function stateFor(type: string): ComponentSpec["state"] {
  if ((inputState as readonly string[]).includes(type)) return "value";
  if ((checkedState as readonly string[]).includes(type)) return "checked";
  if ((enabledState as readonly string[]).includes(type)) return "enabled";
  if ((readableState as readonly string[]).includes(type)) return "readable";
  return "none";
}

export function component(spec: Omit<ComponentSpec, "status" | "since" | "docs" | "state"> & { state?: ComponentSpec["state"] }): ComponentSpec {
  return {
    status: "ready",
    since: SINCE,
    docs: docs(spec.type),
    state: spec.state ?? stateFor(spec.type),
    ...spec,
  };
}

export const childContent = {
  allowed: true,
  description: "Nested component fields are rendered as child content in field order.",
};

export const noChildren = {
  allowed: false,
  description: "This component does not render nested child components.",
};
