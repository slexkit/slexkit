type ConstructableWindow = Window &
  typeof globalThis & {
    CSSStyleSheet?: typeof CSSStyleSheet;
  };

const reusableSheets = new WeakMap<Document, Map<string, CSSStyleSheet>>();
const registeredFonts = new WeakMap<Document, Set<string>>();

/** Font faces in shadow stylesheets do not populate the document font set.
 * Register only the font rules from the trusted component stylesheet; keep
 * all ordinary component selectors confined to their shadow roots. */
export function installDocumentFonts(
  document: Document,
  sheet: CSSStyleSheet,
  baseUrl: string,
): void {
  const owner = document.defaultView as (Window & typeof globalThis) | null;
  if (!owner?.FontFace || !document.fonts) return;
  let known = registeredFonts.get(document);
  if (!known) registeredFonts.set(document, (known = new Set()));
  for (const rule of Array.from(sheet.cssRules)) {
    if (rule.type !== 5) continue;
    const style = (rule as CSSFontFaceRule).style;
    const family = style
      .getPropertyValue("font-family")
      .trim()
      .replace(/^['"]|['"]$/g, "");
    let invalid = false;
    const source = style
      .getPropertyValue("src")
      .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (_match, _quote, path: string) => {
        try {
          return `url(${JSON.stringify(new URL(path, baseUrl).href)})`;
        } catch {
          invalid = true;
          return "";
        }
      });
    if (!family || !source || invalid) continue;
    const descriptors: FontFaceDescriptors = {};
    for (const [property, cssName] of [
      ["weight", "font-weight"],
      ["style", "font-style"],
      ["stretch", "font-stretch"],
      ["display", "font-display"],
      ["unicodeRange", "unicode-range"],
    ] as const) {
      const value = style.getPropertyValue(cssName).trim();
      if (value) (descriptors as Record<string, string>)[property] = value;
    }
    const key = JSON.stringify([family, source, descriptors]);
    if (known.has(key)) continue;
    document.fonts.add(new owner.FontFace(family, source, descriptors));
    known.add(key);
  }
}

function sheetConstructor(ownerDocument: Document): typeof CSSStyleSheet | undefined {
  const owner = ownerDocument.defaultView as ConstructableWindow | null;
  const constructor = owner?.CSSStyleSheet;
  return constructor?.prototype?.replaceSync ? constructor : undefined;
}

/** Creates a stylesheet in the target document's realm. Constructed sheets cannot cross documents. */
export function createDocumentStyleSheet(
  ownerDocument: Document,
  cssText: string,
  reusable = false,
): CSSStyleSheet | undefined {
  const Constructor = sheetConstructor(ownerDocument);
  if (!Constructor) return undefined;
  if (reusable) {
    let documentSheets = reusableSheets.get(ownerDocument);
    if (!documentSheets) reusableSheets.set(ownerDocument, (documentSheets = new Map()));
    const existing = documentSheets.get(cssText);
    if (existing) return existing;
    const sheet = new Constructor();
    sheet.replaceSync(cssText);
    documentSheets.set(cssText, sheet);
    return sheet;
  }
  const sheet = new Constructor();
  sheet.replaceSync(cssText);
  return sheet;
}

/** Adds a trusted sheet to a shadow root, with an inline fallback for older DOM implementations. */
export function attachShadowStyle(
  shadow: ShadowRoot,
  cssText: string,
  sheet: CSSStyleSheet | undefined,
): void {
  if (sheet && "adoptedStyleSheets" in shadow) {
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
    return;
  }
  const style = shadow.ownerDocument.createElement("style");
  style.textContent = cssText;
  shadow.append(style);
}

/** Replaces only runner-owned sheets and leaves browser/consumer adopted sheets untouched. */
export function replaceDocumentStyles(
  ownerDocument: Document,
  previous: readonly CSSStyleSheet[],
  next: readonly CSSStyleSheet[],
): void {
  const ownedSet = new Set([...previous, ...next]);
  ownerDocument.adoptedStyleSheets = [
    ...ownerDocument.adoptedStyleSheets.filter((sheet) => !ownedSet.has(sheet)),
    ...next,
  ];
}

/** Decodes a host-approved UTF-8 CSS data URL without performing a CSP-governed fetch. */
export function decodeCssDataUrl(url: string): string {
  const comma = url.indexOf(",");
  if (comma < 0 || !url.slice(0, comma).toLowerCase().startsWith("data:text/css"))
    throw new TypeError("The approved stylesheet data URL must use the text/css media type.");
  const metadata = url.slice(5, comma).split(";");
  if (metadata.shift()?.trim().toLowerCase() !== "text/css")
    throw new TypeError("The approved stylesheet data URL must use the text/css media type.");
  const parameters = metadata.map((value) => value.trim().toLowerCase());
  const unsupported = parameters.filter(
    (value) => value && value !== "base64" && value !== "charset=utf-8" && value !== "charset=utf8",
  );
  if (unsupported.length)
    throw new TypeError("The approved stylesheet data URL must contain UTF-8 CSS.");
  const payload = url.slice(comma + 1);
  try {
    if (!parameters.includes("base64")) return decodeURIComponent(payload);
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new TypeError("The approved stylesheet data URL is not valid UTF-8 CSS.", {
      cause: error,
    });
  }
}
