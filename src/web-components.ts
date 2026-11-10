import { flushSync, mount, unmount } from "svelte";
import { parseEngineeringNumber, isEngineeringNumberResult } from "./engine/engineering";
import { slexkitStd } from "./engine/stdlib";
import { observeThemeMode } from "./engine/theme";
import { watchElementTheme } from "./web-components/theme";
import {
  attachShadowStyle,
  createDocumentStyleSheet,
  installDocumentFonts,
} from "./web-components/styles";
import type { RenderContext } from "./engine/types";
import type { PropValues } from "./components/svelte/types";
import {
  booleanProperties,
  describeSlexElements,
  elementDefinitions,
  type SlexElementType,
} from "./web-components/definitions";

// This entry deliberately has no dependency on the DSL parser, expression
// evaluator, component registry, or artifact/namespace stores.
export { createReactiveState, createEffect, createRoot, onCleanup, batch } from "./engine/reactive";
export { describeSlexElements };
export type { SlexElementType };

export type SlexElement = HTMLElement & {
  value: unknown;
  readonly valueAsNumber: number;
  checked: boolean;
  enabled: boolean;
  disabled: boolean;
  label: string;
  rows: unknown[];
  columns: unknown[] | string | number;
  items: unknown[];
  options: unknown[];
  tabs: unknown[];
  open: boolean;
};

export type DefineSlexElementsOptions = {
  /** Register separately in each window/iframe. Defaults to the current window. */
  window?: Window & typeof globalThis;
  components?: readonly SlexElementType[];
  /** Trusted host configuration, never taken from generated attributes. */
  stylesheetUrl?: string;
  /** Useful when the host already bundles CSS; overrides stylesheetUrl. */
  cssText?: string;
};

const elementBrand = Symbol.for("slexkit.web-components.v1");
const nativeChangeTypes = new Set(["input", "slider", "checkbox", "switch"]);
const formTypes = new Set([...nativeChangeTypes, "select", "radio-group"]);
const nativeValueEvents = new Set([...nativeChangeTypes, "radio-group"]);

/** Explicit registration keeps module import usable in server-side tooling. */
export function defineSlexElements(options: DefineSlexElementsOptions = {}): void {
  const candidateWindow = options.window ?? (typeof window !== "undefined" ? window : undefined);
  if (!candidateWindow) throw new Error("defineSlexElements requires a browser window");
  const owner = candidateWindow;
  const descriptors = describeSlexElements();
  const requested = options.components ?? (Object.keys(elementDefinitions) as SlexElementType[]);
  const trustedCssSheet =
    options.cssText === undefined
      ? undefined
      : createDocumentStyleSheet(owner.document, options.cssText, true);
  if (trustedCssSheet)
    installDocumentFonts(
      owner.document,
      trustedCssSheet,
      options.stylesheetUrl ?? owner.document.baseURI,
    );
  // Validate the complete request before registering anything.
  for (const type of requested) {
    if (!Object.hasOwn(elementDefinitions, type)) throw new Error(`Unknown Slex element: ${type}`);
    const existing = owner.customElements.get(`slex-${type}`);
    if (existing && !(elementBrand in existing))
      throw new Error(`Custom element already registered: slex-${type}`);
  }
  for (const type of requested) {
    const tag = `slex-${type}`;
    if (owner.customElements.get(tag)) continue;
    const definition = elementDefinitions[type];
    const properties = descriptors.find((item) => item.tagName === tag)!.properties;
    const attributes = new Map(
      properties.filter((item) => item.attribute).map((item) => [item.attribute!, item.name]),
    );
    let nextId = 0;

    class SlexCustomElement extends owner.HTMLElement {
      static [elementBrand] = true;
      static formAssociated = formTypes.has(type);
      static observedAttributes = [...attributes.keys()];
      private values: PropValues = {
        haptic: false,
        haptics: false,
        ...(type === "input" ? { value: "" } : type === "slider" ? { value: 0 } : {}),
        ...(type === "checkbox"
          ? { checked: false }
          : type === "switch"
            ? { enabled: false, checked: false }
            : {}),
      };
      private subscribers = new Set<(value: PropValues) => void>();
      private instance?: ReturnType<typeof mount>;
      private revision = 0;
      private target?: HTMLDivElement;
      private stopTheme?: () => void;
      private childrenObserver?: MutationObserver;
      private derivedValues: PropValues = {};
      private internals =
        SlexCustomElement.formAssociated && this.attachInternals
          ? this.attachInternals()
          : undefined;
      private fieldsetDisabled = false;
      private handlingNativeChange = false;
      private onChangeCapture = (event: Event) => {
        if ((event.composedPath()[0] as Node | undefined)?.getRootNode() === this.shadowRoot)
          this.handlingNativeChange = true;
      };
      private onInput = (event: Event) => {
        const input = event.composedPath()[0] as HTMLInputElement;
        if (
          input?.getRootNode() !== this.shadowRoot ||
          !["INPUT", "SELECT"].includes(input.tagName)
        )
          return;
        this.values[type === "checkbox" ? "checked" : type === "switch" ? "enabled" : "value"] =
          type === "checkbox" || type === "switch"
            ? input.checked
            : type === "slider"
              ? Number(input.value)
              : input.value;
        if (type === "switch") this.values.checked = input.checked;
        this.syncForm();
      };
      private onChange = (event: Event) => {
        // A slotted child's events already have the correct target and owner.
        if ((event.composedPath()[0] as Node | undefined)?.getRootNode() !== this.shadowRoot)
          return;
        this.handlingNativeChange = false;
        event.stopPropagation();
        this.dispatchEvent(new owner.Event("change", { bubbles: true, composed: true }));
      };

      connectedCallback(): void {
        this.revision++;
        if (this.instance) {
          this.startTheme();
          return;
        }
        // Upgrade properties assigned before customElements.define().
        for (const { name } of properties) {
          if (!Object.hasOwn(this, name)) continue;
          const value = (this as unknown as Record<string, unknown>)[name];
          delete (this as unknown as Record<string, unknown>)[name];
          (this as unknown as Record<string, unknown>)[name] = value;
        }
        this.refreshChildren();
        this.childrenObserver = new owner.MutationObserver(() => this.refreshChildren());
        this.childrenObserver.observe(this, {
          childList: true,
          characterData: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["slot", "aria-label", "label", "value", "disabled", "selected"],
        });
        const shadow =
          this.shadowRoot ??
          this.attachShadow({ mode: "open", delegatesFocus: SlexCustomElement.formAssociated });
        shadow.replaceChildren();
        const baseStyle = this.ownerDocument.createElement("style");
        baseStyle.textContent =
          ":host{display:block;min-width:0}:host([hidden]){display:none}slot{display:contents}::slotted(*){min-width:0}" +
          ":host([data-slex-balanced-tile])>.slexkit-root{height:100%}" +
          ":host([data-slex-balanced-tile]) .slex-stat,:host([data-slex-balanced-tile]) .slex-card{height:100%}" +
          ":host([data-slex-balanced-tile]) .slex-stat-value{margin-top:auto}";
        shadow.append(baseStyle);
        if (options.cssText !== undefined) {
          attachShadowStyle(shadow, options.cssText, trustedCssSheet);
        } else {
          const link = this.ownerDocument.createElement("link");
          link.rel = "stylesheet";
          link.crossOrigin = "anonymous";
          link.href = options.stylesheetUrl ?? new URL("./slexkit.css", import.meta.url).href;
          link.addEventListener(
            "load",
            () => {
              if (link.sheet)
                installDocumentFonts(this.ownerDocument, link.sheet as CSSStyleSheet, link.href);
            },
            { once: true },
          );
          shadow.append(link);
        }
        const target = this.ownerDocument.createElement("div");
        target.className = "slexkit-root";
        shadow.append(target);
        this.target = target;
        this.startTheme();
        const ctx: RenderContext = {
          std: slexkitStd,
          dir:
            this.ownerDocument.defaultView?.getComputedStyle(this).direction === "rtl"
              ? "rtl"
              : "ltr",
          labels: {},
          document: this.ownerDocument,
          id: `wc-${type}-${++nextId}`,
          registerChildTarget: (container) =>
            container.append(this.ownerDocument.createElement("slot")),
          renderSlot: (name, container) => {
            if (!Array.from(this.children).some((child) => child.getAttribute("slot") === name))
              return false;
            container.replaceChildren();
            const slot = this.ownerDocument.createElement("slot");
            slot.name = name;
            container.append(slot);
            return true;
          },
          emit: (event, data) => {
            if (event === "change" && "state" in definition) {
              const value = isEngineeringNumberResult(data) ? data.raw : data;
              this.values[definition.state] = value;
              if (type === "switch") this.values.checked = !!value;
              this.syncForm();
              if (!nativeValueEvents.has(type) && !this.handlingNativeChange) {
                this.dispatchEvent(new owner.Event("input", { bubbles: true, composed: true }));
                this.dispatchEvent(
                  new owner.CustomEvent("change", {
                    detail: { value },
                    bubbles: true,
                    composed: true,
                  }),
                );
              }
            }
            if (event === "submit") {
              const form = this.closest("form");
              if (form) form.requestSubmit();
              else
                this.dispatchEvent(
                  new owner.Event("submit", { bubbles: true, composed: true, cancelable: true }),
                );
            } else if (event !== "change" && event !== "click") {
              this.dispatchEvent(
                new owner.CustomEvent(event, { detail: data, bubbles: true, composed: true }),
              );
            }
            // Native click/input events cross the shadow boundary themselves.
          },
        };
        target.dir = ctx.dir;
        try {
          this.instance = mount(definition.component, {
            target,
            props: {
              componentName: "",
              instanceId: ctx.id!,
              ctx,
              props: {
                subscribe: (run: (value: PropValues) => void) => {
                  this.subscribers.add(run);
                  run(this.currentProps());
                  return () => this.subscribers.delete(run);
                },
              },
            },
          });
          flushSync();
          // Capture native input before it reaches consumers (checkbox change
          // handlers run later). Svelte's delegated handlers remain on target.
          target.addEventListener("input", this.onInput, true);
          target.addEventListener("change", this.onChangeCapture, true);
          target.addEventListener("change", this.onChange);
          this.syncForm();
        } catch (error) {
          this.dispose();
          throw error;
        }
      }

      disconnectedCallback(): void {
        const revision = ++this.revision;
        // Reordering in the same turn must not destroy input/focus state.
        queueMicrotask(() => {
          if (!this.isConnected && revision === this.revision) this.dispose();
        });
      }

      adoptedCallback(): void {
        // A different document owns a different theme observer and RenderContext.
        this.dispose();
      }

      private startTheme(): void {
        this.stopTheme?.();
        const target = this.target;
        if (!target) return;
        const stopMode = observeThemeMode(target, this);
        const stopDark = watchElementTheme(this, (dark) => target.classList.toggle("dark", dark));
        this.stopTheme = () => {
          stopMode();
          stopDark();
        };
      }

      private refreshChildren(): void {
        const next: PropValues = {};
        const contentProperty: Record<string, string> = {
          button: "label",
          text: "content",
          badge: "label",
          link: "text",
          "code-block": "code",
          formula: "tex",
        };
        if (contentProperty[type]) next[contentProperty[type]] = this.textContent?.trim() || "";
        if (type === "select" || type === "radio-group") {
          const options = Array.from(this.children)
            .filter((child) => child.localName === "option")
            .map((child) => ({
              value: child.getAttribute("value") ?? child.textContent ?? "",
              label: child.getAttribute("label") ?? child.textContent ?? "",
              disabled: child.hasAttribute("disabled"),
            }));
          if (options.length) {
            next.options = options;
            if (type === "select") next.value = options.find((item) => !item.disabled)?.value ?? "";
          }
        }
        if (type === "tabs" || type === "accordion") {
          const items = Array.from(this.children)
            .filter((child) => child.hasAttribute("slot"))
            .map((child) => ({
              value: child.getAttribute("slot")!,
              label:
                child.getAttribute("aria-label") ??
                child.getAttribute("label") ??
                child.getAttribute("slot")!,
              disabled: child.hasAttribute("disabled"),
              content: " ",
            }));
          if (items.length) {
            next[type === "tabs" ? "tabs" : "items"] = items;
            if (type === "tabs") next.value = items.find((item) => !item.disabled)?.value;
          }
        }
        if (JSON.stringify(next) !== JSON.stringify(this.derivedValues)) {
          this.derivedValues = next;
          this.update();
        }
      }

      attributeChangedCallback(attribute: string, _old: string | null, value: string | null): void {
        const property = attributes.get(attribute)!;
        if (booleanProperties.has(property)) this.values[property] = value !== null;
        else if (value === null && property === "value")
          this.values.value = type === "slider" ? 0 : "";
        else if (value === null) delete this.values[property];
        else this.values[property] = value;
        if (type === "switch" && (property === "checked" || property === "enabled"))
          this.values.checked = this.values.enabled = value !== null;
        this.update();
      }

      private currentProps(): PropValues {
        return {
          ...this.derivedValues,
          ...this.values,
          ...(this.fieldsetDisabled ? { disabled: true } : {}),
        };
      }

      private update(): void {
        if (type === "slider") {
          // Let the browser apply range clamping and step alignment instead of
          // maintaining another numeric constraint algorithm.
          const range = this.ownerDocument.createElement("input");
          range.type = "range";
          for (const key of ["min", "max", "step"] as const) {
            if (this.values[key] !== undefined) range[key] = String(this.values[key]);
          }
          range.value = String(this.values.value ?? 0);
          this.values.value = range.valueAsNumber;
        }
        for (const run of this.subscribers) run(this.currentProps());
        if (this.instance) flushSync();
        this.syncForm();
      }

      private syncForm(): void {
        if (!this.internals?.setFormValue) return;
        const checked = type === "checkbox" ? this.values.checked : this.values.enabled;
        const isToggle = type === "checkbox" || type === "switch";
        const input =
          type === "radio-group"
            ? this.target?.querySelector<HTMLInputElement>("input:checked, input")
            : this.target?.querySelector<HTMLInputElement | HTMLSelectElement>("input, select");
        const value = this.values.value ?? this.derivedValues.value;
        this.internals.setFormValue(
          (isToggle && !checked) || (type === "radio-group" && !value)
            ? null
            : String(value ?? (isToggle ? "on" : "")),
        );
        if (this.values.required && !value && !this.values.disabled && !this.fieldsetDisabled) {
          this.internals.setValidity(
            { valueMissing: true },
            "Please choose a value",
            input ?? undefined,
          );
          return;
        }
        if (!input) {
          this.internals.setValidity({});
          return;
        }
        const invalidEngineering =
          type === "input" &&
          this.values.type === "engineering" &&
          String(this.values.value ?? "").trim() !== "" &&
          !Number.isFinite(this.valueAsNumber);
        if (invalidEngineering)
          this.internals.setValidity({ customError: true }, "Invalid engineering value", input);
        else this.internals.setValidity(input.validity, input.validationMessage, input);
      }

      formDisabledCallback(disabled: boolean): void {
        this.fieldsetDisabled = disabled;
        this.update();
      }

      formResetCallback(): void {
        if (
          (type === "checkbox" ||
            type === "switch" ||
            type === "select" ||
            type === "radio-group") &&
          !this.hasAttribute("value")
        )
          delete this.values.value;
        else this.values.value = this.getAttribute("value") ?? (type === "slider" ? 0 : "");
        if (type === "checkbox") this.values.checked = this.hasAttribute("checked");
        if (type === "switch")
          this.values.checked = this.values.enabled =
            this.hasAttribute("checked") || this.hasAttribute("enabled");
        this.update();
      }

      get form(): HTMLFormElement | null {
        return this.internals?.form ?? null;
      }
      get validity(): ValidityState | undefined {
        return this.internals?.validity;
      }
      get validationMessage(): string {
        return this.internals?.validationMessage ?? "";
      }
      checkValidity(): boolean {
        return this.internals?.checkValidity() ?? true;
      }
      reportValidity(): boolean {
        return this.internals?.reportValidity() ?? true;
      }

      private dispose(): void {
        this.childrenObserver?.disconnect();
        this.childrenObserver = undefined;
        this.stopTheme?.();
        this.stopTheme = undefined;
        this.target?.removeEventListener("change", this.onChange);
        this.target?.removeEventListener("input", this.onInput, true);
        this.target?.removeEventListener("change", this.onChangeCapture, true);
        const instance = this.instance;
        this.instance = undefined;
        // No outro: Svelte destroys effects synchronously in this mode.
        if (instance) void unmount(instance, { outro: false });
        this.subscribers.clear();
        this.target?.remove();
        this.target = undefined;
      }

      get valueAsNumber(): number {
        const value = this.values.value;
        if (this.values.type === "engineering") return parseEngineeringNumber(value).number ?? NaN;
        return value === "" || value === undefined || value === null ? NaN : Number(value);
      }
    }

    for (const { name } of properties) {
      // Preserve native HTMLElement reflection, such as .title.
      if (name in owner.HTMLElement.prototype) continue;
      Object.defineProperty(SlexCustomElement.prototype, name, {
        configurable: true,
        get(this: SlexCustomElement) {
          const values = (this as unknown as { values: PropValues }).values;
          const derived = (this as unknown as { derivedValues: PropValues }).derivedValues;
          return values[name] ?? derived[name] ?? (booleanProperties.has(name) ? false : "");
        },
        set(this: SlexCustomElement, value: unknown) {
          if (name === "disabled" || name === "required" || name === "readOnly") {
            this.toggleAttribute(name === "readOnly" ? "readonly" : name, !!value);
            return;
          }
          if (name === "name") {
            this.setAttribute("name", String(value ?? ""));
            return;
          }
          const internal = this as unknown as { values: PropValues; update(): void };
          internal.values[name] = booleanProperties.has(name)
            ? !!value
            : type === "input" && name === "value"
              ? String(value ?? "")
              : value;
          if (type === "switch" && (name === "checked" || name === "enabled"))
            internal.values.checked = internal.values.enabled = !!value;
          internal.update();
        },
      });
    }
    owner.customElements.define(tag, SlexCustomElement);
  }
}
