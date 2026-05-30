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
  mountSecureArtifact,
  parseSlexSource,
  parseSlexKitDsl,
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
import {
  attachComponentDisposer,
  configureComponentScope,
} from "./engine/component-scope";
import { startSlexKitSandboxRunner } from "./engine/sandbox-runner";
import {
  getSlexKitInfo,
  SLEXKIT_COMPONENTS_VERSION,
  SLEXKIT_VERSION,
  SLEX_PROTOCOL_VERSION,
} from "./version";
export type { BootOptions } from "./engine/index";
export type { SlexKitParseResult, SlexKitSourceDiagnostic } from "./engine/index";
export type {
  SlexKitValidationMode,
  SlexKitValidationOptions,
  SlexKitValidationResult,
  SlexKitValidationWarning,
  SlexKitValidationWarningCode,
} from "./engine/index";
export type {
  ComponentRenderer,
  ComponentRegistrationOptions,
  ComponentStateMode,
  RenderContext,
  SlexExpression,
  DSL,
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

setSlexKitRuntimeUrl(import.meta.url);

const mountApi = mount;
const ingestApi = ingest;
const bootApi = boot;
const disposeNamespaceApi = disposeNamespace;
const registerApi = register;
const getRendererApi = getRenderer;
const diagnoseSlexKitSourceApi = diagnoseSlexKitSource;
const SlexKitSyntaxErrorApi = SlexKitSyntaxError;
const formatSlexKitDiagnosticApi = formatSlexKitDiagnostic;
const mountSecureArtifactApi = mountSecureArtifact;
const parseSlexSourceApi = parseSlexSource;
const parseSlexKitDslApi = parseSlexKitDsl;
const validateSlexSourceApi = validateSlexSource;
const createSecureRuntimeApi = createSecureRuntime;
const SlexKitRuntimeErrorApi = SlexKitRuntimeError;
const getSlexKitRuntimeUrlApi = getSlexKitRuntimeUrl;
const setSlexKitRuntimeUrlApi = setSlexKitRuntimeUrl;
const createSlexKitMarkdownRuntimeHostApi = createSlexKitMarkdownRuntimeHost;
const getSlexKitMarkdownRuntimeHostApi = getSlexKitMarkdownRuntimeHost;
const installSlexKitMarkdownRuntimeHostApi = installSlexKitMarkdownRuntimeHost;
const slexkitStdApi = slexkitStd;
const attachComponentDisposerApi = attachComponentDisposer;
const configureComponentScopeApi = configureComponentScope;
const startSlexKitSandboxRunnerApi = startSlexKitSandboxRunner;
const getSlexKitInfoApi = getSlexKitInfo;

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
  mountSecureArtifactApi as mountSecureArtifact,
  parseSlexSourceApi as parseSlexSource,
  parseSlexKitDslApi as parseSlexKitDsl,
  validateSlexSourceApi as validateSlexSource,
  createSecureRuntimeApi as createSecureRuntime,
  SlexKitRuntimeErrorApi as SlexKitRuntimeError,
  getSlexKitRuntimeUrlApi as getSlexKitRuntimeUrl,
  setSlexKitRuntimeUrlApi as setSlexKitRuntimeUrl,
  createSlexKitMarkdownRuntimeHostApi as createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHostApi as getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHostApi as installSlexKitMarkdownRuntimeHost,
  slexkitStdApi as slexkitStd,
  attachComponentDisposerApi as attachComponentDisposer,
  configureComponentScopeApi as configureComponentScope,
  startSlexKitSandboxRunnerApi as startSlexKitSandboxRunner,
};
