import { createSlexKitMarkdownRuntimeHost } from "../html/host";
import type {
  SlexKitMarkdownRuntimeOptions,
  SlexKitUpdatableMarkdownRuntimeHost,
} from "../html/types";

export { createSlexKitMarkdownRuntimeHost } from "../html/host";
export type {
  SlexKitArtifactUpdateOptions,
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
  SlexKitMarkdownRuntimeMode,
  SlexKitMarkdownRuntimeOptions,
  SlexKitUpdatableMarkdownRuntimeHost,
} from "../html/types";

let globalMarkdownRuntimeHost: SlexKitUpdatableMarkdownRuntimeHost | undefined;

export function installSlexKitMarkdownRuntimeHost(
  options: SlexKitMarkdownRuntimeOptions = {},
): SlexKitUpdatableMarkdownRuntimeHost {
  globalMarkdownRuntimeHost?.disposeAll();
  globalMarkdownRuntimeHost = createSlexKitMarkdownRuntimeHost(options);
  return globalMarkdownRuntimeHost;
}

export function getSlexKitMarkdownRuntimeHost(): SlexKitUpdatableMarkdownRuntimeHost {
  return globalMarkdownRuntimeHost ??= createSlexKitMarkdownRuntimeHost();
}
