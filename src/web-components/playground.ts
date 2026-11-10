import { createSlexKitMarkdownRuntimeHost } from "../html/host";
import type { SlexKitMarkdownRuntimeHost, SlexKitMarkdownRuntimeOptions } from "../html/types";

/** Optional authoring UI. Content still uses the same isolated HTML host. */
export function defineSlexPlayground(owner: Window & typeof globalThis = window, options: SlexKitMarkdownRuntimeOptions = {}): void {
  if (owner.customElements.get("slex-playground")) return;
  class SlexPlayground extends owner.HTMLElement {
    static observedAttributes = ["source"];
    private host?: SlexKitMarkdownRuntimeHost;
    private editor?: HTMLTextAreaElement;
    private output?: HTMLElement;
    private error?: HTMLElement;
    private controller?: AbortController;
    private value = "";

    get source(): string { return this.value; }
    get autorun(): boolean { return this.hasAttribute("autorun"); }
    set autorun(value: boolean) { this.toggleAttribute("autorun", !!value); }
    set source(source: string) {
      this.value = String(source ?? "");
      if (this.editor) this.editor.value = this.value;
      void this.render("preview");
    }
    attributeChangedCallback(_name: string, _old: string | null, value: string | null): void { this.source = value ?? ""; }
    connectedCallback(): void {
      if (this.host) return;
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      shadow.innerHTML = '<style>:host{display:block;color:inherit}textarea{box-sizing:border-box;width:100%;min-height:180px;padding:12px;font:13px/1.5 monospace;background:var(--background,#fff);color:var(--foreground,#18181b);border:1px solid var(--border,#ddd)}nav{display:flex;gap:8px;margin:8px 0}[role=alert]{color:var(--destructive,#b91c1c);white-space:pre-wrap}</style><textarea aria-label="HTML source" spellcheck="false"></textarea><nav><button type="button" data-run>Run</button><button type="button" data-reset>Reset</button></nav><div role="alert"></div><div data-preview></div>';
      this.editor = shadow.querySelector("textarea")!;
      this.output = shadow.querySelector<HTMLElement>("[data-preview]")!;
      this.error = shadow.querySelector<HTMLElement>("[role=alert]")!;
      this.editor.value = this.value;
      this.controller = new owner.AbortController();
      const signal = this.controller.signal;
      this.host = createSlexKitMarkdownRuntimeHost(options);
      this.editor.addEventListener("input", () => { this.value = this.editor!.value; void this.render("preview"); }, { signal });
      shadow.querySelector("[data-run]")!.addEventListener("click", () => { void this.render("commit"); }, { signal });
      shadow.querySelector("[data-reset]")!.addEventListener("click", () => { void this.host?.resetArtifact("playground"); }, { signal });
      void this.render(this.hasAttribute("autorun") ? "commit" : "preview");
    }
    disconnectedCallback(): void {
      queueMicrotask(() => {
        if (this.isConnected) return;
        this.controller?.abort();
        this.host?.disposeAll();
        this.host = undefined;
      });
    }
    private async render(phase: "preview" | "commit"): Promise<void> {
      if (!this.host || !this.output || !this.error) return;
      try {
        await this.host.updateArtifact("playground", [{ blockId: "source", source: this.value, container: this.output }], { phase });
        this.error.textContent = "";
      } catch (error) { this.error.textContent = error instanceof Error ? error.message : String(error); }
    }
  }
  owner.customElements.define("slex-playground", SlexPlayground);
}
