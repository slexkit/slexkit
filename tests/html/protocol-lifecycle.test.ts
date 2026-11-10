import { describe, expect, test } from "bun:test";
import {
  HTML_CHANNEL,
  isFrameCommand,
  isJsonValue,
  isRunnerMessage,
  serializedError,
} from "../../src/html/protocol";
import {
  createBootstrapDocument,
  createLockedRuntimePolicy,
  getSlexKitRuntimeUrl,
  setSlexKitRuntimeUrl,
} from "../../src/html/host";

describe("HTML runtime pure lifecycle contracts", () => {
  test("rejects prototype-mutating shared-state keys at the host boundary", () => {
    const token = "a".repeat(48);
    for (const key of ["__proto__", "prototype", "constructor"]) {
      expect(isRunnerMessage({ channel: HTML_CHANNEL, token, epoch: 1, kind: "shared-set", requestId: "shared:1", revision: 1, key, value: {} }, token, 1)).toBe(false);
    }
  });
  test("accepts plain message records from a different window realm without accepting classes", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const other = frame.contentWindow as Window & typeof globalThis;
    const value = new other.Object() as Record<string, unknown>;
    value.nested = { count: 1 };
    expect(isJsonValue(value)).toBe(true);
    expect(
      isJsonValue(
        new (class RecordLike {
          value = 1;
        })(),
      ),
    ).toBe(false);
    frame.remove();
  });
  test("shared and snapshot state accepts JSON only", () => {
    expect(isJsonValue({ count: 1, items: [true, null, "x"] })).toBe(true);
    expect(isJsonValue({ invalid: undefined })).toBe(false);
    expect(isJsonValue({ invalid: Number.NaN })).toBe(false);
    const cycle: unknown[] = [];
    cycle.push(cycle);
    expect(isJsonValue(cycle)).toBe(false);
    const shared = { answer: 42 };
    expect(isJsonValue({ left: shared, right: shared })).toBe(true);
    let getterRuns = 0;
    const accessor = Object.defineProperty({}, "secret", {
      enumerable: true,
      get() {
        getterRuns++;
        return 1;
      },
    });
    expect(isJsonValue(accessor)).toBe(false);
    expect(getterRuns).toBe(0);
    expect(isJsonValue(Object.assign(Object.create({ inherited: true }), { own: true }))).toBe(
      false,
    );
  });

  test("runtime URL configuration fails closed for empty values", () => {
    const previous = getSlexKitRuntimeUrl();
    expect(() => setSlexKitRuntimeUrl(" ")).toThrow();
    setSlexKitRuntimeUrl("https://cdn.example.test/slexkit.js");
    expect(getSlexKitRuntimeUrl()).toBe("https://cdn.example.test/slexkit.js");
    setSlexKitRuntimeUrl(previous);
  });

  test("errors cross the protocol as data", () => {
    expect(serializedError(new TypeError("bad"))).toEqual({ name: "TypeError", message: "bad" });
  });

  test("validates every command and result variant instead of accepting arbitrary kinds", () => {
    const token = "a".repeat(48);
    const common = { channel: HTML_CHANNEL, token, epoch: 2, requestId: "request:1", revision: 1 };
    expect(
      isFrameCommand(
        { ...common, kind: "commit", source: "<p>ok</p>", sourceId: "source:1", reset: false },
        token,
        2,
      ),
    ).toBe(true);
    expect(isFrameCommand({ ...common, kind: "commit", source: 1 }, token)).toBe(false);
    expect(isFrameCommand({ ...common, kind: "reset", untypedData: true }, token)).toBe(false);
    expect(isFrameCommand({ ...common, kind: "unknown" }, token)).toBe(false);
    expect(
      isFrameCommand(
        {
          ...common,
          kind: "theme",
          theme: { mode: "dark", tokens: { "--background": "0 0% 0%" } },
        },
        token,
      ),
    ).toBe(true);
    expect(
      isFrameCommand(
        {
          ...common,
          kind: "api-result",
          result: {
            ok: true,
            status: 200,
            statusText: "OK",
            url: "https://api.example.test",
            headers: {},
            text: "ok",
            elapsedMs: 2,
          },
        },
        token,
      ),
    ).toBe(true);
    expect(
      isFrameCommand(
        { ...common, kind: "api-result", result: { ok: true, status: Infinity } },
        token,
      ),
    ).toBe(false);
    expect(
      isRunnerMessage({ ...common, kind: "height", requestId: "height", height: 120 }, token),
    ).toBe(true);
    expect(
      isRunnerMessage(
        {
          ...common,
          kind: "state",
          requestId: "state",
          sourceId: "source:1",
          state: { controls: {} },
        },
        token,
        2,
      ),
    ).toBe(true);
    expect(
      isRunnerMessage({ ...common, kind: "height", requestId: "height", height: 120 }, token, 3),
    ).toBe(false);
    expect(
      isRunnerMessage({ ...common, kind: "height", requestId: "height", height: Infinity }, token),
    ).toBe(false);
    expect(
      isRunnerMessage(
        {
          ...common,
          kind: "api-fetch",
          url: "https://api.example.test",
          options: {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: { ok: true },
            timeoutMs: 1000,
            credentials: "omit",
          },
        },
        token,
      ),
    ).toBe(true);
    expect(
      isRunnerMessage(
        { ...common, kind: "api-fetch", url: "x", options: { method: "DELETE" } },
        token,
      ),
    ).toBe(false);
  });

  test("limits the bootstrap nonce to a first policy and locks payload execution to blob modules", () => {
    const document = createBootstrapDocument({
      runtimeUrl: "https://cdn.example.test/v1/slexkit.js",
      styleUrl: "https://cdn.example.test/v1/slexkit.css",
      fontUrls: ["https://cdn.example.test/v1/font.woff2"],
      imageUrls: ["https://assets.example.test/card.png"],
      nonce: "nonce-token-123456789",
    });
    expect(document).toContain(
      "script-src 'nonce-nonce-token-123456789' blob: https://cdn.example.test/v1/slexkit.js",
    );
    expect(document).toContain("style-src-elem 'nonce-nonce-token-123456789' blob: data:");
    expect(document).toContain("style-src-attr 'unsafe-inline'");
    expect(document).toContain("connect-src 'none'");
    expect(document).toContain("frame-src 'none'");
    expect(document).not.toContain("script-src 'unsafe-inline'");
    expect(document).not.toContain("script-src https:");
    expect(document).not.toContain("img-src data:");
    expect(document).not.toContain("<slex-");

    const locked = createLockedRuntimePolicy({
      styleUrl: "https://cdn.example.test/v1/slexkit.css",
      fontUrls: ["https://cdn.example.test/v1/font.woff2"],
      imageUrls: ["https://assets.example.test/card.png"],
    });
    expect(locked).toContain("script-src blob:");
    expect(locked).toContain(
      "style-src-elem blob: data: 'sha256-PVFxfZerdoNVipkc5dcv3WJjvxhrR9SYt0Bh3ejQ3Gg='",
    );
    expect(locked).not.toContain("nonce-");
    expect(locked).not.toContain("script-src https:");
    expect(locked).not.toContain("script-src data:");
  });

  test("admits host-owned data bootstrap assets without carrying data scripts into the locked policy", () => {
    const document = createBootstrapDocument({
      runtimeUrl: "data:text/javascript,export%20default%201",
      styleUrl: "data:text/css,body%7Bcolor%3Ared%7D",
      nonce: "nonce-token-123456789",
    });
    expect(document).toContain("script-src 'nonce-nonce-token-123456789' blob: data:");
    expect(document).toContain("style-src-elem 'nonce-nonce-token-123456789' blob: data:");
    expect(
      createLockedRuntimePolicy({ styleUrl: "data:text/css,body%7Bcolor%3Ared%7D" }),
    ).toContain("script-src blob:");
  });
});
