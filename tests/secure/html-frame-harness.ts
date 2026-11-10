import { HTML_CHANNEL } from "../../src/html/protocol";

export type PostedMessage = Record<string, unknown>;

export async function nextFrame(container: ParentNode): Promise<HTMLIFrameElement> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const frame = container.querySelector<HTMLIFrameElement>("iframe");
    if (frame?.contentWindow) return frame;
    await Promise.resolve();
  }
  throw new Error("Expected an attached iframe.");
}

export function attachFrame(frame: HTMLIFrameElement) {
  const posted: PostedMessage[] = [];
  const responded = new Set<unknown>();
  Object.defineProperty(frame.contentWindow, "postMessage", {
    configurable: true,
    value: (message: PostedMessage) => posted.push(message),
  });
  // This unit harness emulates one boot. jsdom also emits an asynchronous
  // about:blank load without executing srcdoc; suppress that duplicate rather
  // than pretending it is a second live browsing context. Real reload recovery
  // is exercised in html-frame-relocation-worker with all three browsers.
  let load = new Event("load");
  frame.addEventListener("load", event => { if (event !== load) event.stopImmediatePropagation(); }, true);
  frame.dispatchEvent(load);
  const bootstrap = posted.find(message => message.kind === "slexkit-bootstrap-init")!;
  const token = String(bootstrap.token);
  const send = (data: PostedMessage) => {
    const event = new window.MessageEvent("message", { data: { epoch: posted.findLast(message => message.kind === "slexkit-bootstrap-init")?.epoch, ...data } });
    Object.defineProperty(event, "source", { configurable: true, value: frame.contentWindow });
    window.dispatchEvent(event);
  };
  const ready = async () => {
    send({ channel: HTML_CHANNEL, token, kind: "ready", requestId: "ready", revision: 0, ok: true });
    await Promise.resolve();
  };
  const respondLatest = async (kind = "commit", result?: unknown) => {
    let request: PostedMessage | undefined;
    for (let attempt = 0; attempt < 20; attempt++) {
      request = posted.findLast(message => message.kind === kind && !responded.has(message.requestId));
      if (request) break;
      await Promise.resolve();
    }
    if (!request) throw new Error(`Expected an unacknowledged ${kind} request.`);
    responded.add(request.requestId);
    send({
      channel: HTML_CHANNEL,
      token,
      kind: "result",
      requestId: request.requestId,
      revision: request.revision,
      ok: true,
      ...(result === undefined ? {} : { result }),
    });
    await Promise.resolve();
    return request;
  };
  const reload = () => { load = new Event("load"); frame.dispatchEvent(load); };
  return { posted, bootstrap, token, send, ready, respondLatest, reload };
}
