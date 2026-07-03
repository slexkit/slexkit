import {
  mount,
  ingest,
  boot,
  disposeNamespace,
  register,
  getRenderer,
  diagnoseSlexKitSource,
  SlexKitSyntaxError,
  formatSlexKitDiagnostic,
  isLikelyIncompleteSlexSource,
  parseSlexStreamingSource,
  mountSecureArtifact,
  parseSlexSource,
  parseSlexKitDsl,
  runSlexConformance,
  validateSlexSource,
  createSecureRuntime,
  SlexKitRuntimeError,
  getSlexKitRuntimeUrl,
  setSlexKitRuntimeUrl,
  createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost,
  slexkitStd,
} from "./engine/index";
import { registerAll, registerSvelteComponent, registerSubset } from "./components/index";
import { renderToolCall, registerToolTemplate } from "./toolhost/index";
import { startSlexKitSandboxRunner } from "./engine/sandbox-runner";
import {
  clearRegisteredIcons,
  getIcon,
  getRegisteredIcon,
  iconifySvgUrl,
  loadIcon,
  normalizeIconName,
  registerIcon,
  registerIcons,
  resolveIconifyIcon,
  resolveIconWeight,
} from "./icons/manager";
import { attachComponentDisposer, configureComponentScope } from "./engine/component-scope";
import {
  getSlexKitInfo,
  SLEXKIT_COMPONENTS_VERSION,
  SLEXKIT_VERSION,
  SLEX_PROTOCOL_VERSION,
} from "./version";

const mountApi = mount;
const ingestApi = ingest;
const bootApi = boot;
const disposeNamespaceApi = disposeNamespace;
const registerApi = register;
const getRendererApi = getRenderer;
const diagnoseSlexKitSourceApi = diagnoseSlexKitSource;
const SlexKitSyntaxErrorApi = SlexKitSyntaxError;
const formatSlexKitDiagnosticApi = formatSlexKitDiagnostic;
const isLikelyIncompleteSlexSourceApi = isLikelyIncompleteSlexSource;
const parseSlexStreamingSourceApi = parseSlexStreamingSource;
const mountSecureArtifactApi = mountSecureArtifact;
const parseSlexSourceApi = parseSlexSource;
const parseSlexKitDslApi = parseSlexKitDsl;
const runSlexConformanceApi = runSlexConformance;
const validateSlexSourceApi = validateSlexSource;
const createSecureRuntimeApi = createSecureRuntime;
const SlexKitRuntimeErrorApi = SlexKitRuntimeError;
const getSlexKitRuntimeUrlApi = getSlexKitRuntimeUrl;
const setSlexKitRuntimeUrlApi = setSlexKitRuntimeUrl;
const createSlexKitMarkdownRuntimeHostApi = createSlexKitMarkdownRuntimeHost;
const getSlexKitMarkdownRuntimeHostApi = getSlexKitMarkdownRuntimeHost;
const installSlexKitMarkdownRuntimeHostApi = installSlexKitMarkdownRuntimeHost;
const slexkitStdApi = slexkitStd;
const registerAllApi = registerAll;
const registerSvelteComponentApi = registerSvelteComponent;
const registerSubsetApi = registerSubset;
const renderToolCallApi = renderToolCall;
const registerToolTemplateApi = registerToolTemplate;
const startSlexKitSandboxRunnerApi = startSlexKitSandboxRunner;
const clearRegisteredIconsApi = clearRegisteredIcons;
const getIconApi = getIcon;
const getRegisteredIconApi = getRegisteredIcon;
const loadIconApi = loadIcon;
const normalizeIconNameApi = normalizeIconName;
const registerIconApi = registerIcon;
const registerIconsApi = registerIcons;
const resolveIconifyIconApi = resolveIconifyIcon;
const iconifySvgUrlApi = iconifySvgUrl;
const resolveIconWeightApi = resolveIconWeight;
const attachComponentDisposerApi = attachComponentDisposer;
const configureComponentScopeApi = configureComponentScope;
const getSlexKitInfoApi = getSlexKitInfo;

setSlexKitRuntimeUrl(import.meta.url);

export {
  SLEXKIT_VERSION,
  SLEX_PROTOCOL_VERSION,
  SLEXKIT_COMPONENTS_VERSION,
  getSlexKitInfoApi as getSlexKitInfo,
  mountApi as mount,
  ingestApi as ingest,
  bootApi as boot,
  disposeNamespaceApi as disposeNamespace,
  registerApi as register,
  getRendererApi as getRenderer,
  diagnoseSlexKitSourceApi as diagnoseSlexKitSource,
  SlexKitSyntaxErrorApi as SlexKitSyntaxError,
  formatSlexKitDiagnosticApi as formatSlexKitDiagnostic,
  isLikelyIncompleteSlexSourceApi as isLikelyIncompleteSlexSource,
  parseSlexStreamingSourceApi as parseSlexStreamingSource,
  mountSecureArtifactApi as mountSecureArtifact,
  parseSlexSourceApi as parseSlexSource,
  parseSlexKitDslApi as parseSlexKitDsl,
  runSlexConformanceApi as runSlexConformance,
  validateSlexSourceApi as validateSlexSource,
  createSecureRuntimeApi as createSecureRuntime,
  SlexKitRuntimeErrorApi as SlexKitRuntimeError,
  getSlexKitRuntimeUrlApi as getSlexKitRuntimeUrl,
  setSlexKitRuntimeUrlApi as setSlexKitRuntimeUrl,
  createSlexKitMarkdownRuntimeHostApi as createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHostApi as getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHostApi as installSlexKitMarkdownRuntimeHost,
  slexkitStdApi as slexkitStd,
};
export type { BootOptions } from "./engine/index";
export type {
  SlexKitParseResult,
  SlexKitSourceDiagnostic,
  SlexStreamingMode,
  SlexStreamingParseOptions,
  SlexStreamingParseResult,
  SlexStreamingRepair,
} from "./engine/index";
export type {
  SlexConformanceCaseResult,
  SlexConformanceExpectedWarning,
  SlexConformanceFixture,
  SlexConformanceOptions,
  SlexConformanceReport,
  SlexKitValidationMode,
  SlexKitValidationOptions,
  SlexKitValidationResult,
  SlexKitValidationWarning,
  SlexKitValidationWarningCode,
} from "./engine/index";
export type {
  SlexKitRuntimeApi,
  HostFetchRequest,
  HostRuntimeAdapter,
  HostRuntimePolicy,
  NetworkOptions,
  NetworkResult,
  RafId,
  RuntimeCanvasContext,
  RuntimeCanvasContextId,
  RuntimeErrorEvent,
  RuntimeErrorKind,
  RuntimeNetworkLogEvent,
  SandboxSlotSizeMessage,
  SandboxSlotsMessage,
  SandboxFetchRequestMessage,
  SandboxFetchResponseMessage,
  SandboxHostMessage,
  SandboxMountMessage,
  SandboxRunnerMessage,
  SandboxStatusMessage,
  SecureFrameOptions,
  SecureArtifactSlot,
  SecureMountOptions,
  SecureRuntimeHandle,
  SerializedRuntimeError,
  TimerId,
  SlexKitStdlib,
} from "./engine/index";
export type {
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
  SlexKitMarkdownRuntimeMode,
  SlexKitMarkdownRuntimeOptions,
} from "./engine/index";
export type { ComponentRenderer, RenderContext, SlexExpression, ThemeMode, DSL } from "./engine/types";
export {
  registerAllApi as registerAll,
  registerSvelteComponentApi as registerSvelteComponent,
  registerSubsetApi as registerSubset,
};
export {
  renderToolCallApi as renderToolCall,
  registerToolTemplateApi as registerToolTemplate,
};
export { startSlexKitSandboxRunnerApi as startSlexKitSandboxRunner };
export {
  clearRegisteredIconsApi as clearRegisteredIcons,
  getIconApi as getIcon,
  getRegisteredIconApi as getRegisteredIcon,
  iconifySvgUrlApi as iconifySvgUrl,
  loadIconApi as loadIcon,
  normalizeIconNameApi as normalizeIconName,
  registerIconApi as registerIcon,
  registerIconsApi as registerIcons,
  resolveIconifyIconApi as resolveIconifyIcon,
  resolveIconWeightApi as resolveIconWeight,
};
export {
  attachComponentDisposerApi as attachComponentDisposer,
  configureComponentScopeApi as configureComponentScope,
};
export type { IconState, IconWeight, RegisterIconOptions } from "./icons/manager";
export {
  componentSpecs,
  getComponentSpec,
  getLocalizedComponentSpec,
  hashSpecText,
  localizeComponentSpec,
  localizeComponentSpecs,
  publicComponentSpecs,
  publicComponentTypes,
} from "./components/spec-registry";
export type {
  ChildrenSpec,
  ComponentDocsSpec,
  ComponentExampleSpec,
  ComponentSpec,
  ComponentSpecCategory,
  ComponentSpecLocaleEntry,
  ComponentSpecLocaleOverlay,
  ComponentSpecStatus,
  LocalizedComponentSpec,
  LocalizedChildrenSpec,
  LocalizedPropSpec,
  LocalizedText,
  PropSpec,
} from "./components/spec-schema";
export type {
  ChooseOptionsArguments,
  ConfirmActionArguments,
  FillFormArguments,
  FormField,
  FormFieldType,
  ToolCall,
  ToolRenderHandle,
  ToolResult,
  ToolResultStatus,
  ToolRuntime,
  ToolTemplateCompiler,
  OptionListArguments,
  OptionListItem,
} from "./toolhost/index";
import "./components/index";
