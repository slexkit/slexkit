import type {
  SlexKitArtifactUpdateOptions,
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
  SlexKitUpdatableMarkdownRuntimeHost,
} from "slexkit";

type Phase = SlexKitArtifactUpdateOptions["phase"];
type Owner = object;
type Entry = {
  blocks: SlexKitMarkdownBlock[];
  phase: Phase;
  onError: (error: unknown | null) => void;
};
type ArtifactState = {
  entries: Map<Owner, Entry>;
  revision: number;
  scheduled: boolean;
};

const hosts = new WeakMap<SlexKitMarkdownRuntimeHost, Map<string, ArtifactState>>();

function stateFor(host: SlexKitMarkdownRuntimeHost, artifactId: string) {
  let artifacts = hosts.get(host);
  if (!artifacts) {
    artifacts = new Map();
    hosts.set(host, artifacts);
  }
  let state = artifacts.get(artifactId);
  if (!state) {
    state = { entries: new Map(), revision: 0, scheduled: false };
    artifacts.set(artifactId, state);
  }
  return state;
}

function schedule(
  host: SlexKitMarkdownRuntimeHost,
  artifactId: string,
  state: ArtifactState,
) {
  state.revision += 1;
  if (state.scheduled) return;
  state.scheduled = true;

  queueMicrotask(async () => {
    state.scheduled = false;
    const revision = state.revision;
    const entries = Array.from(state.entries.values());
    const blocks = entries.flatMap((entry) => entry.blocks);
    const phase: Phase = entries.every((entry) => entry.phase === "commit")
      ? "commit"
      : "preview";

    try {
      if (entries.length === 0) {
        host.disposeArtifact(artifactId);
        hosts.get(host)?.delete(artifactId);
      } else if (typeof (host as Partial<SlexKitUpdatableMarkdownRuntimeHost>).updateArtifact === "function") {
        await (host as SlexKitUpdatableMarkdownRuntimeHost).updateArtifact(artifactId, blocks, { phase });
      } else if (phase === "commit") {
        host.disposeArtifact(artifactId);
        for (const block of blocks) host.mountBlock(block);
      }
      if (revision !== state.revision) return;
      for (const entry of entries) entry.onError(null);
    } catch (error) {
      if (revision !== state.revision) return;
      for (const entry of entries) entry.onError(error);
    }
  });
}

export function updateSlexArtifactRegistration(
  host: SlexKitMarkdownRuntimeHost,
  artifactId: string,
  owner: Owner,
  blocks: SlexKitMarkdownBlock[],
  phase: Phase,
  onError: (error: unknown | null) => void,
) {
  const state = stateFor(host, artifactId);
  state.entries.set(owner, { blocks, phase, onError });
  schedule(host, artifactId, state);
}

export function removeSlexArtifactRegistration(
  host: SlexKitMarkdownRuntimeHost,
  artifactId: string,
  owner: Owner,
) {
  const state = stateFor(host, artifactId);
  if (!state.entries.delete(owner)) return;
  schedule(host, artifactId, state);
}
