import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeCustomElementsManifest(root: string, dist: string): Promise<void> {
  await mkdir(join(dist, "ai"), { recursive: true });
  await writeFile(
    join(dist, "ai", "web-components.md"),
    await readFile(join(root, "docs", "web-components.md"), "utf8"),
  );
  // Read the built module: no Svelte source loader or browser globals required.
  const { describeSlexElements } = await import(join(dist, "web-components.js"));
  const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const declarations = describeSlexElements().map(
    (element: {
      tagName: string;
      properties: Array<{ name: string; attribute?: string; type: string }>;
      slots: string[];
      events: string[];
    }) => ({
      kind: "class",
      name: element.tagName
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(""),
      customElement: true,
      tagName: element.tagName,
      members: [
        ...element.properties.map((property) => ({
          kind: "field",
          name: property.name,
          type: { text: property.type === "array" ? "unknown[]" : property.type },
          attribute: property.attribute,
        })),
        ...(["slex-input", "slex-slider"].includes(element.tagName)
          ? [
              {
                kind: "field",
                name: "valueAsNumber",
                readonly: true,
                type: { text: "number" },
                description:
                  "Parsed numeric value; NaN for empty or invalid input. Engineering input supports SI prefixes.",
              },
            ]
          : []),
      ],
      attributes: element.properties
        .filter((property) => property.attribute)
        .map((property) => ({
          name: property.attribute,
          fieldName: property.name,
          type: { text: property.type },
        })),
      slots: element.slots.map((name) => ({ name })),
      events: element.events.map((name) => ({ name, type: { text: "Event" } })),
    }),
  );
  await writeFile(
    join(dist, "custom-elements.json"),
    JSON.stringify(
      {
        schemaVersion: "1.0.0",
        packageVersion: version,
        readme:
          "Standard HTML/JS entry. Import defineSlexElements and explicitly register components in each window. Shadow DOM is not a security sandbox.",
        modules: [{ kind: "javascript-module", path: "dist/web-components.js", declarations }],
      },
      null,
      2,
    ) + "\n",
  );
}
