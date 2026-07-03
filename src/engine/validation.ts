import { componentSpecs } from "../components/spec-registry";
import { parseSlexSource, type SlexKitParseResult, type SlexKitSourceDiagnostic } from "./diagnostics";
import {
  slexkitRuntimeCapabilityNames,
  slexkitStdlibFunctionNames,
} from "./capabilities";
import { SLEX_PROTOCOL_VERSION } from "../version";
import {
  SLEX_LOGIC_PROFILE_VERSION,
  SLEX_SCHEMA_VERSION,
  slexNativeSecureCapabilities,
  slexReservedContextNames,
} from "../standard/artifacts";

export type SlexKitValidationMode = "trusted" | "secure";

export type SlexKitValidationWarningCode =
  | "unsupported_protocol"
  | "invalid_component_key"
  | "invalid_directive_type"
  | "unknown_component"
  | "unknown_prop"
  | "unknown_std_member"
  | "unknown_api_member"
  | "native_secure_capability"
  | "reserved_context_shadowing";

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
      schemaVersion: string;
      protocolVersion: string;
      logicProfileVersion: string;
      value: unknown;
      warnings: SlexKitValidationWarning[];
      componentUsage: string[];
      stdlibUsage: string[];
      apiUsage: string[];
    }
  | {
      ok: false;
      schemaVersion: string;
      protocolVersion: string;
      logicProfileVersion: string;
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
const reservedContextNames = new Set<string>(slexReservedContextNames);
const componentKeyPattern = /^[a-z][a-z0-9-]*:[A-Za-z0-9_$-]*$/;
const nativeSecureCapabilities = [
  { value: "fetch", pattern: /(?<!\.)\bfetch\s*\(/ },
  { value: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { value: "WebSocket", pattern: /\bWebSocket\b/ },
  { value: "setTimeout", pattern: /(?<!\.)\bsetTimeout\s*\(/ },
  { value: "setInterval", pattern: /(?<!\.)\bsetInterval\s*\(/ },
  { value: "requestAnimationFrame", pattern: /(?<!\.)\brequestAnimationFrame\s*\(/ },
] satisfies Array<{ value: (typeof slexNativeSecureCapabilities)[number]; pattern: RegExp }>;

function collectMemberUsage(source: string, root: "std" | "api"): string[] {
  const matches = source.matchAll(new RegExp(`\\b${root}\\.([A-Za-z_$][\\w$]*)(?:\\.([A-Za-z_$][\\w$]*))?`, "g"));
  const found = new Set<string>();
  for (const match of matches) {
    found.add([root, match[1], match[2]].filter(Boolean).join("."));
  }
  return [...found].sort();
}

type LogicSource = {
  path: string;
  source: string;
};

function componentKeyType(key: string): string | null {
  const colon = key.indexOf(":");
  return colon > 0 ? key.slice(0, colon) : null;
}

function componentKeyIdentifier(key: string): string {
  const colon = key.indexOf(":");
  return colon >= 0 ? key.slice(colon + 1) : "";
}

function isKnownProp(type: string, key: string): boolean {
  if (directiveProps.has(key) || key.startsWith("on")) return true;
  const spec = componentSpecByType.get(type);
  if (!spec) return true;
  const propName = key.startsWith("$") ? key.slice(1) : key;
  return propName in spec.props;
}

function isLogicProp(key: string): boolean {
  return directiveProps.has(key) || key.startsWith("$") || key.startsWith("on");
}

function collectLogicSources(value: unknown, path = ""): LogicSource[] {
  const sources: LogicSource[] = [];
  if (!value || typeof value !== "object") return sources;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = path ? `${path}.${key}` : key;
    if (typeof child === "function") {
      sources.push({ path: childPath, source: child.toString() });
      continue;
    }
    if (typeof child === "string" && isLogicProp(key)) {
      sources.push({ path: childPath, source: child });
      continue;
    }
    sources.push(...collectLogicSources(child, childPath));
  }

  return sources;
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
    const isInvalidComponentKey = key.includes(":") && !componentKeyPattern.test(key);
    if (isInvalidComponentKey) {
      warnings.push({
        code: "invalid_component_key",
        message: `Invalid component key '${key}'. Use 'type:identifier' with a kebab-case type.`,
        path: childPath,
        value: key,
      });
    }
    const type = componentKeyType(key);
    if (type) {
      usage.add(type);
      const identifier = componentKeyIdentifier(key);
      if (reservedContextNames.has(identifier)) {
        warnings.push({
          code: "reserved_context_shadowing",
          message: `Component identifier '${identifier}' shadows a reserved expression context name.`,
          path: childPath,
          value: identifier,
        });
      }
      const spec = componentSpecByType.get(type);
      if (!spec && !isInvalidComponentKey) {
        warnings.push({
          code: "unknown_component",
          message: `Unknown SlexKit component '${type}'.`,
          path: childPath,
          value: type,
        });
      }
      if (child && typeof child === "object") {
        for (const [propName, propValue] of Object.entries(child as Record<string, unknown>)) {
          if (componentKeyType(propName)) continue;
          if (directiveProps.has(propName) && typeof propValue !== "string") {
            warnings.push({
              code: "invalid_directive_type",
              message: `Directive '${propName}' on component '${type}' must be a JavaScript expression string.`,
              path: `${childPath}.${propName}`,
              value: propName,
            });
          }
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

function logicSourceWarnings(sources: LogicSource[], mode: SlexKitValidationMode): {
  warnings: SlexKitValidationWarning[];
  stdlibUsage: string[];
  apiUsage: string[];
} {
  const warnings: SlexKitValidationWarning[] = [];
  const stdlibUsage = new Set<string>();
  const apiUsage = new Set<string>();

  for (const logic of sources) {
    for (const name of collectMemberUsage(logic.source, "std")) {
      stdlibUsage.add(name);
      if (stdlibFunctions.has(name) || stdlibNamespaces.has(name)) continue;
      warnings.push({
        code: "unknown_std_member",
        message: `Unknown SlexKit stdlib member '${name}'.`,
        path: logic.path,
        value: name,
      });
    }
    for (const name of collectMemberUsage(logic.source, "api")) {
      apiUsage.add(name);
      if (apiMembers.has(name)) continue;
      warnings.push({
        code: "unknown_api_member",
        message: `Unknown SlexKit runtime API member '${name}'.`,
        path: logic.path,
        value: name,
      });
    }
    if (mode === "secure") {
      for (const capability of nativeSecureCapabilities) {
        if (!capability.pattern.test(logic.source)) continue;
        warnings.push({
          code: "native_secure_capability",
          message: `Native '${capability.value}' is not supported in secure mode. Use policy-gated api.* instead.`,
          path: logic.path,
          value: capability.value,
        });
      }
    }
  }

  return {
    warnings,
    stdlibUsage: [...stdlibUsage].sort(),
    apiUsage: [...apiUsage].sort(),
  };
}

function envelopeWarnings(value: unknown, warnings: SlexKitValidationWarning[]): void {
  if (!value || typeof value !== "object") return;
  const expression = value as Record<string, unknown>;
  if (expression.slex !== undefined && expression.slex !== SLEX_PROTOCOL_VERSION) {
    warnings.push({
      code: "unsupported_protocol",
      message: `Slex protocol marker '${String(expression.slex)}' does not match supported protocol '${SLEX_PROTOCOL_VERSION}'.`,
      path: "slex",
      value: String(expression.slex),
    });
  }
  if (expression.g && typeof expression.g === "object") {
    for (const key of Object.keys(expression.g as Record<string, unknown>)) {
      if (!reservedContextNames.has(key)) continue;
      warnings.push({
        code: "reserved_context_shadowing",
        message: `State key '${key}' shadows a reserved expression context name.`,
        path: `g.${key}`,
        value: key,
      });
    }
  }
}

export function validateSlexSource(
  source: string,
  options: SlexKitValidationOptions = {},
): SlexKitValidationResult {
  const mode = options.mode ?? "trusted";
  const parsed: SlexKitParseResult = parseSlexSource(source);
  const usage = new Set<string>();

  if (!parsed.ok) {
    const { warnings, stdlibUsage, apiUsage } = sourceWarnings(source, mode);
    return {
      ok: false,
      schemaVersion: SLEX_SCHEMA_VERSION,
      protocolVersion: SLEX_PROTOCOL_VERSION,
      logicProfileVersion: SLEX_LOGIC_PROFILE_VERSION,
      diagnostic: parsed.diagnostic,
      warnings,
      componentUsage: [],
      stdlibUsage,
      apiUsage,
    };
  }

  const { warnings, stdlibUsage, apiUsage } = logicSourceWarnings(collectLogicSources(parsed.value), mode);
  envelopeWarnings(parsed.value, warnings);
  walkComponents(parsed.value, warnings, usage);
  return {
    ok: true,
    schemaVersion: SLEX_SCHEMA_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    logicProfileVersion: SLEX_LOGIC_PROFILE_VERSION,
    value: parsed.value,
    warnings,
    componentUsage: [...usage].sort(),
    stdlibUsage,
    apiUsage,
  };
}
