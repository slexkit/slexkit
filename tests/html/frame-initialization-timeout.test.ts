import { expect, test } from "bun:test";
import { createSlexKitMarkdownRuntimeHost } from "../../src/html/host";

const expectInitializationTimeout = async (commit: Promise<void>): Promise<void> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const bounded = Promise.race([
    commit,
    new Promise<void>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Commit hung past the test timeout.")), 250);
    }),
  ]);
  try {
    await expect(bounded).rejects.toThrow("SlexKit sandbox runtime did not become ready.");
  } finally {
    clearTimeout(timer);
  }
};

test("rejects detached-frame initialization and unblocks queued artifact updates", async () => {
  const host = createSlexKitMarkdownRuntimeHost({
    secureFrame: {
      runtimeUrl: "https://example.invalid/runtime.js",
      styleUrl: false,
      loadTimeoutMs: 10,
      teardownTimeoutMs: 1,
    },
  });
  const container = document.createElement("div");
  const blocks = [{ blockId: "one", source: "<p>safe</p>", container }];

  expect(container.isConnected).toBe(false);
  try {
    await expectInitializationTimeout(host.updateArtifact("boot", blocks, { phase: "commit" }));
    await expectInitializationTimeout(host.updateArtifact("boot", blocks, { phase: "commit" }));
  } finally {
    host.disposeAll();
  }
});
