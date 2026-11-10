import { expect, test } from "bun:test";
import { createSlexKitMarkdownRuntimeHost } from "../../src/html/host";
import { attachFrame, nextFrame } from "../secure/html-frame-harness";

test("prioritizes documented theme tokens in a host with hundreds of unrelated variables", async () => {
  const container = document.createElement("div");
  for (let index = 0; index < 600; index++) container.style.setProperty(`--unrelated-${index}`, "1");
  container.style.setProperty("--background", "rgb(12, 23, 34)");
  container.style.setProperty("--foreground", "rgb(240, 240, 240)");
  container.style.setProperty("--slex-control-height", "44px");
  document.body.append(container);
  const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js" });
  host.mountBlock({ source: "<p>Theme</p>", container, executionMode: "preview" });
  const bridge = attachFrame(await nextFrame(container));
  await bridge.ready();
  const options = bridge.bootstrap.options as { theme: { tokens: Record<string, string> } };
  expect(options.theme.tokens["--background"]).toBe("rgb(12, 23, 34)");
  expect(options.theme.tokens["--foreground"]).toBe("rgb(240, 240, 240)");
  expect(options.theme.tokens["--slex-control-height"]).toBe("44px");
  expect(Object.keys(options.theme.tokens).length).toBeLessThanOrEqual(512);
  host.disposeAll();
  container.remove();
});
