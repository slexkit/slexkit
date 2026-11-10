import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { createStandardArtifacts } from "../../src/standard/artifacts";
import { describeSlexElements } from "../../src/web-components/definitions";

type ManifestDeclaration = {
  tagName: string;
  members: Array<{ name: string; attribute?: string; type?: { text: string } }>;
  attributes: Array<{ name: string; fieldName: string; type?: { text: string } }>;
  events: Array<{ name: string }>;
  slots: Array<{ name: string }>;
};

describe("custom-element specification contract", () => {
  it("keeps the 28 default definitions unique and metadata-complete", () => {
    const elements = describeSlexElements();
    expect(elements).toHaveLength(28);
    expect(new Set(elements.map((item) => item.tagName)).size).toBe(elements.length);

    for (const element of elements) {
      expect(element.tagName).toMatch(/^slex-[a-z][a-z0-9-]*$/);
      expect(Array.isArray(element.properties), `${element.tagName} properties`).toBe(true);
      expect(Array.isArray(element.events), `${element.tagName} events`).toBe(true);
      expect(Array.isArray(element.slots), `${element.tagName} slots`).toBe(true);
      expect(new Set(element.properties.map((prop) => prop.name)).size).toBe(element.properties.length);
      for (const property of element.properties) {
        expect(property.name, element.tagName).toBeTruthy();
        expect(["boolean", "array", "string | number"]).toContain(property.type);
        if (property.type === "array") expect(property.attribute, `${element.tagName}.${property.name}`).toBeUndefined();
        else expect(property.attribute, `${element.tagName}.${property.name}`).toBeTruthy();
      }
    }
  });

  it("keeps the built custom-elements manifest aligned with properties, slots, and events", async () => {
    const manifest = JSON.parse(await readFile("dist/custom-elements.json", "utf8")) as {
      schemaVersion: string;
      declarations?: ManifestDeclaration[];
      modules: Array<{ declarations: ManifestDeclaration[] }>;
    };
    const declarations = manifest.modules.flatMap((module) => module.declarations ?? []);
    const definitions = describeSlexElements();
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(declarations).toHaveLength(28);
    expect(declarations.map((item) => item.tagName)).toEqual(definitions.map((item) => item.tagName));

    for (const definition of definitions) {
      const declaration = declarations.find((item) => item.tagName === definition.tagName)!;
      expect(declaration, definition.tagName).toBeTruthy();
      const expectedMembers = definition.properties.map((property) => property.name);
      const actualContractMembers = declaration.members
        .filter((member) => member.name !== "valueAsNumber")
        .map((member) => member.name);
      expect(actualContractMembers, `${definition.tagName} members`).toEqual(expectedMembers);
      expect(declaration.attributes.map((attribute) => attribute.name), `${definition.tagName} attributes`)
        .toEqual(definition.properties.flatMap((property) => property.attribute ? [property.attribute] : []));
      expect(declaration.events.map((event) => event.name), `${definition.tagName} events`).toEqual(definition.events);
      expect(declaration.slots.map((slot) => slot.name), `${definition.tagName} slots`).toEqual(definition.slots);
    }
  });

  it("adds only the optional slex-playground to the standard catalog", () => {
    const build = createStandardArtifacts("0.5.0", "2026-01-01T00:00:00.000Z");
    const catalog = build.artifacts["slex-custom-elements.catalog.json"] as {
      defaultComponentCount: number;
      optionalComponentCount: number;
      componentCount: number;
      elements: Array<{ tagName: string; availability: string; entrypoint: string }>;
    };
    expect(catalog).toMatchObject({ defaultComponentCount: 28, optionalComponentCount: 1, componentCount: 29 });
    expect(catalog.elements.filter((item) => item.availability === "default").map((item) => item.tagName))
      .toEqual(describeSlexElements().map((item) => item.tagName));
    expect(catalog.elements.filter((item) => item.availability === "optional")).toEqual([
      expect.objectContaining({ tagName: "slex-playground", entrypoint: "slexkit/tooling" }),
    ]);
  });
});
