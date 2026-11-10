# HTML-first SlexKit

SlexKit focuses on reusable components, theme styles, and document runtime services. New authoring should use standard HTML and JavaScript. Authors do not need the Slex object-tree syntax, `$` expression strings, or event statement strings.

## Current implementation

The `slexkit/web-components` entry is the component contract used by the HTML document runtime. It has no automatic registration side effect when used standalone; document hosts register the approved set before running payload scripts.

```js
import { defineSlexElements } from "slexkit/web-components";
defineSlexElements();
```

For a no-build page, import the published `dist/web-components.js` URL. It loads `slexkit.css` relative to that module into each element's shadow root. Keep CSS adjacent, or supply a host-owned `stylesheetUrl`. A host that bundles styles can supply `cssText` instead. Limit registration with `components: ["input", "stat", "card"]`. Register separately in each window or iframe. Repeated registration is idempotent; the first registration's style configuration wins. A name conflict with another library throws.

```html
<slex-input id="voltage" type="engineering" label="Voltage" value="12"></slex-input>
<slex-stat id="power" label="Power" unit="W"></slex-stat>
```

```js
const voltage = document.querySelector("#voltage");
const power = document.querySelector("#power");
const update = () => {
  const watts = voltage.valueAsNumber * 2;
  power.value = Number.isFinite(watts) ? watts : "Invalid input";
};
voltage.addEventListener("input", update);
update();
```

`examples/web-components` includes two independent calculators, engineering units, invalid input, reset, theme switching, and a table populated with ordinary arrays. Run `bun examples/dev-server.mjs web-components` after `bun run build:core`.

## Component contract

Implemented tags: `slex-column`, `slex-card`, `slex-grid`, `slex-row`, `slex-input`, `slex-slider`, `slex-checkbox`, `slex-switch`, `slex-button`, `slex-stat`, `slex-text`, `slex-progress`, `slex-badge`, `slex-code-block`, `slex-divider`, `slex-link`, `slex-table`, `slex-select`, `slex-radio-group`, `slex-tabs`, `slex-accordion`, `slex-collapsible`, `slex-formula`, `slex-callout`, `slex-section`, `slex-step`, `slex-toast`, and `slex-submit`.

These 28 elements are the default `defineSlexElements()` set. The optional 29th catalog item, `slex-playground`, is authoring UI and must be registered separately:

```js
import { defineSlexPlayground } from "slexkit/tooling";

defineSlexPlayground(window, {
  secureFrame: {
    runtimeUrl: "/assets/slexkit.runtime.js",
    styleUrl: "/assets/slexkit.css",
  },
});
```

The root entry provides standalone components through `defineSlexElements`; it does not expose raw Svelte component source entries.

- Scalar initial values use attributes. Boolean attributes use presence: `disabled="false"` is still disabled. Remove the attribute or set the JavaScript property to `false` to enable the control.
- Properties update live values without remounting. Input `.value` keeps the raw string; `.valueAsNumber` parses engineering prefixes when `type="engineering"`, returning `NaN` for invalid/empty input. Slider changes produce a numeric value. Checkbox uses `.checked`; switch supports `.checked` and `.enabled`. Properties written before registration are upgraded when the element connects.
- Use `input` for continuous updates, `change` for committed control changes, and `click` for buttons. Read values from the component's properties. Internal non-composed `change` events are forwarded once. Slotted descendants keep their event targets. Programmatic writes do not emit user events.
- `table.columns`, `table.rows`, and `table.items` take arrays through properties, not JSON attributes. Example: `table.columns = [{key: "name", label: "Name"}]` and `table.rows = [{name: "Ada"}]`. Text cells are not parsed as HTML.
- Containers use a native default slot. Ordinary HTML, SVG and custom elements can be children. Row automatically balances two or more direct `slex-stat` children or direct `slex-card` children: responsive columns, a filled last row and equal height within each row. Metric labels stay at the top and values align along the bottom. Mixed content uses normal flex layout. Explicit `align` or `justify` disables balancing; `slex-grid` keeps its declared column counts. Use host CSS on the custom element for sizing/margins.
- Native `hidden` hides an element without discarding its values. Long metric labels, Card titles and Input labels wrap within their container. Numeric Stat values keep left-to-right digit order in RTL layouts; text values use automatic direction and native text shaping. Layout and numeric fitting use CSS pixel measurements, including under CSS zoom.
- Each element has an open shadow root and reuses the theme tokens with fallbacks. Host selectors do not reach shadow internals. Theme through CSS custom properties. Registration does not fetch scripts; the configured stylesheet is an explicit host asset request.
- Input, slider, checkbox and switch use `ElementInternals` for form values, reset, validity and disabled fieldsets in supporting browsers. Toggle controls submit only when checked. `readonly` is the attribute; `readOnly` is the JavaScript property. Form state restoration and a complete native-input API are not yet implemented. Internal labels work; external-label behavior must be independently verified before promising it.
- Unrelated updates retain current values and DOM identity. Same-turn moves reuse the instance; persistent removal unmounts Svelte and releases subscriptions. Reattaching the same element restores its recorded control value, not arbitrary private widget state.

`describeSlexElements()` and the generated `slexkit/custom-elements.json` are authoritative. Tabs and accordion derive their item metadata from named slotted children; arrays such as select options can also be assigned through live properties. Live inherited-direction changes are not yet supported.

## Runtime and trust boundaries

The entry also exports `createReactiveState`, `createEffect`, `createRoot`, `onCleanup`, and `batch` for optional JavaScript reactive logic. Simple components need only ordinary JavaScript. The isolated document additionally provides the small global `slex` SDK documented in the runtime contract.

Hosts own listeners created by their setup code. Prefer an `AbortController` per document instance and abort it on disposal. Dispose reactive effects or group them with `createRoot`; `onCleanup` registers cleanup with that root. Arbitrary timers, closures and external side effects are not automatically discoverable or serializable.

The host owns registration, asset locations and approved capabilities. Shadow DOM encapsulates DOM/styles; it does not isolate JavaScript. The HTML document runtime supplies the isolated frame and permission bridge. Passing generated markup to host-page `innerHTML` is not an isolation strategy.

Ordinary Markdown stays ordinary Markdown. A `slex` fence contains the HTML document source described above; HTML outside the fence remains ordinary Markdown HTML according to the Markdown host's own policy.

Component browser conformance remains separate from document-host conformance. This document does not claim model-generation success or token-cost savings.
