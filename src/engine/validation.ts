import { componentSpecs } from "../components/spec-registry";
import { parseSlexSource, type SlexKitParseResult, type SlexKitSourceDiagnostic } from "./diagnostics";
import {
  slexkitRuntimeCapabilityNames,
  slexkitStdlibFunctionNames,
} from "./capabilities";

export type SlexKitValidationMode = "trusted" | "secure";

export type SlexKitValidationWarningCode =
  | "unknown_component"
  | "unknown_prop"
  | "unknown_std_member"
  | "unknown_api_member"
  | "native_secure_capability";

export type SlexKitValidationWarning = {
  code: SlexKitValidationWarningCode;
  message: string;
  path?: string;
  value?: string;
};

export type SlexKitValidationOptions = {
  mode?: SlexKitValidationMode;
};

export type SlexKitValidationResult =
  | {
      ok: true;
      value: unknown;
      warnings: SlexKitValidationWarning[];
      componentUsage: string[];
      stdlibUsage: string[];
      apiUsage: string[];
    }
  | {
      ok: false;
      diagnostic: SlexKitSourceDiagnostic;
      warnings: SlexKitValidationWarning[];
      componentUsage: string[];
      stdlibUsage: string[];
      apiUsage: string[];
    };

const componentSpecByType = new Map(componentSpecs.map((spec) => [spec.type, spec]));
const stdlibFunctions = new Set(slexkitStdlibFunctionNames);
const stdlibNamespaces = new Set(slexkitStdlibFunctionNames.map((name) => name.split(".").slice(0, 2).join(".")));
const apiMembers = new Set(slexkitRuntimeCapabilityNames);
const directiveProps = new Set(["$if", "$for", "$key"]);
const nativeSecureCapabilities = [
  { value: "fetch", pattern: /(?<!\.)\bfetch\s*\(/ },
  { value: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { value: "WebSocket", pattern: /\bWebSocket\b/ },
  { value: "setTimeout", pattern: /(?<!\.)\bsetTimeout\s*\(/ },
  { value: "requestAnimationFrame", pattern: /(?<!\.)\brequestAnimationFrame\s*\(/ },
];

function collectMemberUsage(source: string, root: "std" | "api"): string[] {
  const matches = source.matchAll(new RegExp(`\\b${root}\\.([A-Za-z_$][\\w$]*)(?:\\.([A-Za-z_$][\\w$]*))?`, "g"));
  const found = new Set<string>();
  for (const match of matches) {
    found.add([root, match[1], match[2]].filter(Boolean).join("."));
  }
  return [...found].sort();
}

function componentKeyType(key: string): string | null {
  const colon = key.indexOf(":");
  return colon > 0 ? key.slice(0, colon) : null;
}

function isKnownProp(type: string, key: string): boolean {
  if (directiveProps.has(key) || key.startsWith("on")) return true;
  const spec = componentSpecByType.get(type);
  if (!spec) return true;
  const propName = key.startsWith("$") ? key.slice(1) : key;
  return propName in spec.props;
}

function walkComponents(
  value: unknown,
  warnings: SlexKitValidationWarning[],
  usage: Set<string>,
  path = "",
): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = path ? `${path}.${key}` : key;
    const type = componentKeyType(key);
    if (type) {
      usage.add(type);
      const spec = componentSpecByType.get(type);
      if (!spec) {
        warnings.push({
          code: "unknown_component",
          message: `Unknown SlexKit component '${type}'.`,
          path: childPath,
          value: type,
        });
      }
      if (child && typeof child === "object") {
        for (const propName of Object.keys(child as Record<string, unknown>)) {
          if (componentKeyType(propName)) continue;
          if (!isKnownProp(type, propName)) {
            warnings.push({
              code: "unknown_prop",
              message: `Unknown prop '${propName}' on component '${type}'.`,
              path: `${childPath}.${propName}`,
              value: propName,
            });
          }
        }
      }
    }
    walkComponents(child, warnings, usage, childPath);
  }
}

function sourceWarnings(source: string, mode: SlexKitValidationMode): {
  warnings: SlexKitValidationWarning[];
  stdlibUsage: string[];
  apiUsage: string[];
} {
  const warnings: SlexKitValidationWarning[] = [];
  const stdlibUsage = collectMemberUsage(source, "std");
  const apiUsage = collectMemberUsage(source, "api");

  for (const name of stdlibUsage) {
    if (stdlibFunctions.has(name) || stdlibNamespaces.has(name)) continue;
    warnings.push({
      code: "unknown_std_member",
      message: `Unknown SlexKit stdlib member '${name}'.`,
      value: name,
    });
  }
  for (const name of apiUsage) {
    if (apiMembers.has(name)) continue;
    warnings.push({
      code: "unknown_api_member",
      message: `Unknown SlexKit runtime API member '${name}'.`,
      value: name,
    });
  }
  if (mode === "secure") {
    for (const capability of nativeSecureCapabilities) {
      if (capability.pattern.test(source)) {
        warnings.push({
          code: "native_secure_capability",
          message: `Native '${capability.value}' is not supported in secure mode. Use policy-gated api.* instead.`,
          value: capability.value,
        });
      }
    }
  }

  return { warnings, stdlibUsage, apiUsage };
}

export function validateSlexSource(
  source: string,
  options: SlexKitValidationOptions = {},
): SlexKitValidationResult {
  const mode = options.mode ?? "trusted";
  const parsed: SlexKitParseResult = parseSlexSource(source);
  const usage = new Set<string>();
  const { warnings, stdlibUsage, apiUsage } = sourceWarnings(source, mode);

  if (!parsed.ok) {
    return {
      ok: false,
      diagnostic: parsed.diagnostic,
      warnings,
      componentUsage: [],
      stdlibUsage,
      apiUsage,
    };
  }

  walkComponents(parsed.value, warnings, usage);
  return {
    ok: true,
    value: parsed.value,
    warnings,
    componentUsage: [...usage].sort(),
    stdlibUsage,
    apiUsage,
  };
}
