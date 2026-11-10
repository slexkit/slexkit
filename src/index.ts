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
} from "./html/index";
export {
  getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost,
} from "./engine/markdown-runtime";
export type {
  HtmlDiagnosticSeverity,
  HtmlInspectionResult,
  HtmlMountHandle,
  HtmlMountOptions,
  HtmlSecureFrameOptions,
  HtmlSourceDiagnostic,
  HtmlSourcePosition,
  HtmlTheme,
  HtmlUpdatePhase,
  HtmlValidationResult,
  SandboxRunnerOptions,
  SlexDocumentSdk,
  SlexSharedState,
  SecureFrameOptions,
  SlexKitArtifactUpdateOptions,
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
  SlexKitMarkdownRuntimeMode,
  SlexKitMarkdownRuntimeOptions,
  SlexKitUpdatableMarkdownRuntimeHost,
} from "./html/index";
export { createSecureRuntime } from "./engine/secure-runtime";
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
} from "./engine/secure-runtime";
export {
  batch,
  createEffect,
  createReactiveState,
  createRoot,
  defineSlexElements,
  describeSlexElements,
  onCleanup,
} from "./web-components";
export type { DefineSlexElementsOptions, SlexElement, SlexElementType } from "./web-components";
export { renderToolCall, registerToolTemplate } from "./toolhost";
export type { ToolCall, ToolResult, ToolRenderHandle, ToolTemplateFactory, ToolRuntime } from "./toolhost";
export {
  registerIcon, registerIcons, clearRegisteredIcons, getIcon, getRegisteredIcon,
  loadIcon, normalizeIconName, resolveIconWeight, resolveIconifyIcon, iconifySvgUrl,
} from "./icons/manager";
export {
  getSlexKitInfo,
  SLEXKIT_COMPONENTS_VERSION,
  SLEXKIT_VERSION,
  SLEX_PROTOCOL_VERSION,
} from "./version";

import { setSlexKitRuntimeUrl } from "./html/host";
if (import.meta.url) setSlexKitRuntimeUrl(import.meta.url);
