/**
 * Transitional internal entry for repository consumers that have not moved to
 * the public root yet. This entry is HTML-only and intentionally exposes no
 * object DSL renderer, evaluator, registry, store, or namespace APIs.
 */
export {
  createSlexKitMarkdownRuntimeHost,
  formatSlexKitDiagnostic,
  getSlexKitRuntimeUrl,
  inspectSlexSource,
  mount,
  parseSlexSource,
  setSlexKitRuntimeUrl,
  SlexKitRuntimeError,
  SlexKitSyntaxError,
  startSlexKitSandboxRunner,
  validateSlexSource,
} from "../html/index";
export type {
  HtmlInspectionResult,
  HtmlMountHandle,
  HtmlMountOptions,
  HtmlValidationResult,
  SandboxRunnerOptions,
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
  SlexKitMarkdownRuntimeOptions,
} from "../html/index";
export { createSecureRuntime } from "./secure-runtime";
export type {
  HostFetchRequest,
  HostRuntimeAdapter,
  HostRuntimePolicy,
  NetworkMethod,
  NetworkOptions,
  NetworkResult,
  RuntimeCredentials,
  SecureRuntimeHandle,
  SlexKitRuntimeApi,
} from "./secure-runtime";
export { batch, createEffect, createReactiveState, createRoot, onCleanup } from "./reactive";
export { isEngineeringNumberResult, parseEngineeringNumber } from "./engineering";
