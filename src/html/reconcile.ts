export type ReconcileOptions = { reset?: boolean };

type ControlProperty = "value" | "checked" | "enabled" | "open" | "selectedIndex";
type ControlValues = Partial<Record<ControlProperty, unknown>>;
export type ControlSnapshot = Record<string, { tag: string; values: ControlValues }>;

const customState = new Map<string, readonly ControlProperty[]>([
  ["slex-input", ["value"]], ["slex-slider", ["value"]], ["slex-select", ["value"]],
  ["slex-radio-group", ["value"]], ["slex-tabs", ["value"]], ["slex-accordion", ["value"]],
  ["slex-checkbox", ["checked"]], ["slex-switch", ["enabled", "checked"]], ["slex-collapsible", ["open"]],
]);

function keyOf(element: Element): string | undefined {
  const value = element.getAttribute("data-key") ?? element.id;
  return value || undefined;
}
function isElement(node: Node): node is Element { return node.nodeType === 1; }

function compatible(current: Node, next: Node): boolean {
  return current.nodeType === next.nodeType
    && (!isElement(current) || !isElement(next) || current.tagName === next.tagName);
}

function isInput(element: Element): element is HTMLInputElement { return element.localName === "input"; }
function isTextarea(element: Element): element is HTMLTextAreaElement { return element.localName === "textarea"; }
function isSelect(element: Element): element is HTMLSelectElement { return element.localName === "select"; }

function propertiesFor(element: Element): readonly ControlProperty[] {
  if (isInput(element)) return ["value", "checked"];
  if (isTextarea(element)) return ["value"];
  if (isSelect(element)) return ["value", "selectedIndex"];
  return customState.get(element.localName) ?? [];
}

function liveValues(element: Element): ControlValues {
  const values: ControlValues = {};
  const candidate = element as unknown as Record<ControlProperty, unknown>;
  for (const property of propertiesFor(element)) {
    try { values[property] = candidate[property]; } catch { /* A third-party custom element may throw. */ }
  }
  return values;
}

function defaultValues(element: Element): ControlValues {
  if (isInput(element)) return { value: element.defaultValue, checked: element.defaultChecked };
  if (isTextarea(element)) return { value: element.defaultValue };
  if (isSelect(element)) {
    const selectedIndex = Array.from(element.options).findIndex(option => option.defaultSelected);
    const index = selectedIndex >= 0 ? selectedIndex : (element.options.length ? 0 : -1);
    return { selectedIndex: index, value: index >= 0 ? element.options[index]?.value ?? "" : "" };
  }
  if (element.localName.startsWith("slex-")) {
    const defaults: ControlValues = {};
    for (const property of propertiesFor(element)) {
      if (property === "checked" || property === "enabled" || property === "open") {
        defaults[property] = element.hasAttribute(property)
          || (element.localName === "slex-switch" && (element.hasAttribute("checked") || element.hasAttribute("enabled")));
      } else if (property === "value" && element.hasAttribute("value")) {
        const attribute = element.getAttribute("value") ?? "";
        defaults.value = element.localName === "slex-slider" ? Number(attribute) : attribute;
      } else {
        // A live property may already contain a user's edit. Defaults must be
        // derived from source markup, including when value was omitted.
        if (element.localName === "slex-slider") {
          const range = element.ownerDocument.createElement("input"); range.type = "range";
          for (const key of ["min", "max", "step"] as const) if (element.hasAttribute(key)) range[key] = element.getAttribute(key)!;
          range.value = "0"; defaults.value = range.valueAsNumber;
        } else if (element.localName === "slex-select") {
          const option = Array.from(element.children).find(child => child.localName === "option" && !child.hasAttribute("disabled"));
          defaults.value = option?.getAttribute("value") ?? option?.textContent ?? "";
        } else if (element.localName === "slex-tabs") {
          defaults.value = Array.from(element.children).find(child => child.hasAttribute("slot") && !child.hasAttribute("disabled"))?.getAttribute("slot") ?? "";
        } else defaults[property] = "";
      }
    }
    return defaults;
  }
  const defaults: ControlValues = {};
  const candidate = element as unknown as Record<ControlProperty, unknown>;
  for (const property of propertiesFor(element)) {
    try { defaults[property] = candidate[property]; } catch { /* Ignore hostile custom accessors in the sandbox. */ }
  }
  return defaults;
}

function assignValues(element: Element, values: ControlValues): void {
  const candidate = element as unknown as Record<ControlProperty, unknown>;
  // selectedIndex is applied last so native select value and index agree.
  for (const property of propertiesFor(element).filter(item => item !== "selectedIndex")) {
    if (!(property in values)) continue;
    try { candidate[property] = values[property]; } catch { /* Ignore unsupported visible state. */ }
  }
  if ("selectedIndex" in values && !("value" in values)) {
    try { candidate.selectedIndex = values.selectedIndex; } catch { /* Ignore unsupported visible state. */ }
  }
}

function syncAttributes(current: Element, next: Element): void {
  for (const attribute of Array.from(current.attributes)) {
    if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
  }
  for (const attribute of Array.from(next.attributes)) {
    if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
  }
}

function morph(current: Node, next: Node, options: ReconcileOptions): Node {
  if (!compatible(current, next)) return next.cloneNode(true);
  if (current.nodeType === 3 || current.nodeType === 8) {
    if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
    return current;
  }
  const currentElement = current as Element;
  const nextElement = next as Element;
  const live = liveValues(currentElement);
  const previousDefaults = defaultValues(currentElement);
  const nextDefaults = defaultValues(nextElement);
  const dirty: ControlValues = {};
  for (const property of propertiesFor(currentElement)) dirty[property] = !Object.is(live[property], previousDefaults[property]);
  syncAttributes(currentElement, nextElement);
  reconcileChildren(currentElement, nextElement, options);
  if (propertiesFor(currentElement).length) {
    if (options.reset) assignValues(currentElement, nextDefaults);
    else {
      const values: ControlValues = {};
      for (const property of propertiesFor(currentElement)) values[property] = dirty[property] ? live[property] : nextDefaults[property];
      assignValues(currentElement, values);
    }
  }
  return current;
}

export function reconcileChildren(current: ParentNode, next: ParentNode, options: ReconcileOptions = {}): void {
  const existing = Array.from(current.childNodes);
  const keyed = new Map<string, Element>();
  for (const node of existing) if (isElement(node) && keyOf(node)) keyed.set(keyOf(node)!, node);
  const used = new Set<Node>();
  let cursor: ChildNode | null = current.firstChild;
  for (const desired of Array.from(next.childNodes)) {
    const desiredKey = isElement(desired) ? keyOf(desired) : undefined;
    let candidate: Node | undefined;
    if (desiredKey) {
      const keyedCandidate = keyed.get(desiredKey);
      if (keyedCandidate && compatible(keyedCandidate, desired)) candidate = keyedCandidate;
    }
    if (!candidate && cursor && !used.has(cursor) && !desiredKey && compatible(cursor, desired)
      && (!isElement(cursor) || !keyOf(cursor))) candidate = cursor;
    const node = candidate ? morph(candidate, desired, options) : desired.cloneNode(true);
    used.add(node);
    if (node !== cursor) current.insertBefore(node, cursor);
    cursor = node.nextSibling;
  }
  for (const node of Array.from(current.childNodes)) if (!used.has(node)) node.remove();
}

function keyedControls(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll("[data-key], [id]")).filter(element => propertiesFor(element).length > 0);
}

export function captureControlSnapshot(root: ParentNode): ControlSnapshot {
  const result: ControlSnapshot = {};
  for (const element of keyedControls(root)) {
    const key = keyOf(element);
    if (key) result[key] = { tag: element.localName, values: liveValues(element) };
  }
  return result;
}

export function restoreControlSnapshot(root: ParentNode, snapshot: unknown): void {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return;
  const records = snapshot as Record<string, unknown>;
  for (const element of keyedControls(root)) {
    const key = keyOf(element);
    const record = key ? records[key] : undefined;
    if (!record || typeof record !== "object" || Array.isArray(record)) continue;
    const item = record as { tag?: unknown; values?: unknown };
    if (item.tag !== element.localName || !item.values || typeof item.values !== "object" || Array.isArray(item.values)) continue;
    const safe: ControlValues = {};
    for (const property of propertiesFor(element)) if (Object.hasOwn(item.values, property)) {
      safe[property] = (item.values as Record<string, unknown>)[property];
    }
    assignValues(element, safe);
  }
}

function deepestActive(document: Document): HTMLElement | undefined {
  let active = document.activeElement;
  while (active && active.nodeType === 1 && (active as HTMLElement).shadowRoot?.activeElement) {
    active = (active as HTMLElement).shadowRoot!.activeElement;
  }
  return active && active.nodeType === 1 ? active as HTMLElement : undefined;
}

export function reconcileHtml(root: HTMLElement, html: string, options: ReconcileOptions = {}): void {
  const focused = deepestActive(root.ownerDocument);
  const focusHost = focused ? (root.contains(focused) ? focused : root.querySelector<HTMLElement>(":focus")) : undefined;
  const textControl = focused && (focused.localName === "input" || focused.localName === "textarea")
    ? focused as HTMLInputElement | HTMLTextAreaElement : undefined;
  const selection = textControl
    ? { start: textControl.selectionStart, end: textControl.selectionEnd, direction: textControl.selectionDirection }
    : undefined;
  const template = root.ownerDocument.createElement("template");
  template.innerHTML = html;
  reconcileChildren(root, template.content, options);
  if (focused?.isConnected && (root.contains(focused) || focusHost?.isConnected)) {
    focused.focus({ preventScroll: true });
    if (selection && textControl
      && selection.start !== null && selection.end !== null) {
      textControl.setSelectionRange(selection.start, selection.end, selection.direction ?? undefined);
    }
  }
}
