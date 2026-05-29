import {
  mount, ingest, boot, disposeNamespace,
  register, getRenderer, diagnoseSlexKitSource, SlexKitSyntaxError,
  formatSlexKitDiagnostic, mountSecureArtifact, parseSlexSource,
  parseSlexKitDsl, createSecureRuntime, SlexKitRuntimeError,
  getSlexKitRuntimeUrl, setSlexKitRuntimeUrl,
  createSlexKitMarkdownRuntimeHost, getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost,
} from "./engine/index";
import { registerAll, registerSvelteComponent, registerSubset } from "./components/index";
import { registerTooling } from "./components/tooling";
import { renderToolCall, registerToolTemplate } from "./toolhost/index";
import { startSlexKitSandboxRunner } from "./engine/sandbox-runner";
import {
  clearRegisteredIcons, getIcon, getRegisteredIcon, iconifySvgUrl,
  loadIcon, normalizeIconName, registerIcon, registerIcons,
  resolveIconifyIcon, resolveIconWeight,
} from "./icons/manager";
import { attachComponentDisposer } from "./engine/component-scope";
import "./components/index";
import "./components/tooling";

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
const createSecureRuntimeApi = createSecureRuntime;
const SlexKitRuntimeErrorApi = SlexKitRuntimeError;
const getSlexKitRuntimeUrlApi = getSlexKitRuntimeUrl;
const setSlexKitRuntimeUrlApi = setSlexKitRuntimeUrl;
const createSlexKitMarkdownRuntimeHostApi = createSlexKitMarkdownRuntimeHost;
const getSlexKitMarkdownRuntimeHostApi = getSlexKitMarkdownRuntimeHost;
const installSlexKitMarkdownRuntimeHostApi = installSlexKitMarkdownRuntimeHost;
const registerAllApi = registerAll;
const registerSvelteComponentApi = registerSvelteComponent;
const registerSubsetApi = registerSubset;
const registerToolingApi = registerTooling;
const renderToolCallApi = renderToolCall;
const registerToolTemplateApi = registerToolTemplate;
const startSlexKitSandboxRunnerApi = startSlexKitSandboxRunner;
const clearRegisteredIconsApi = clearRegisteredIcons;
const getIconApi = getIcon;
const getRegisteredIconApi = getRegisteredIcon;
const iconifySvgUrlApi = iconifySvgUrl;
const loadIconApi = loadIcon;
const normalizeIconNameApi = normalizeIconName;
const registerIconApi = registerIcon;
const registerIconsApi = registerIcons;
const resolveIconifyIconApi = resolveIconifyIcon;
const resolveIconWeightApi = resolveIconWeight;
const attachComponentDisposerApi = attachComponentDisposer;

setSlexKitRuntimeUrl(import.meta.url);

export {
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
  createSecureRuntimeApi as createSecureRuntime,
  SlexKitRuntimeErrorApi as SlexKitRuntimeError,
  getSlexKitRuntimeUrlApi as getSlexKitRuntimeUrl,
  setSlexKitRuntimeUrlApi as setSlexKitRuntimeUrl,
  createSlexKitMarkdownRuntimeHostApi as createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHostApi as getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHostApi as installSlexKitMarkdownRuntimeHost,
  registerAllApi as registerAll,
  registerSvelteComponentApi as registerSvelteComponent,
  registerSubsetApi as registerSubset,
  registerToolingApi as registerTooling,
  renderToolCallApi as renderToolCall,
  registerToolTemplateApi as registerToolTemplate,
  startSlexKitSandboxRunnerApi as startSlexKitSandboxRunner,
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
  attachComponentDisposerApi as attachComponentDisposer,
};
