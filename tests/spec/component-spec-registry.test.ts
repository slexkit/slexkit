import { describe, expect, it } from "bun:test";
import { ALL_COMPONENT_TYPES } from "../../src/components/index";
import { componentSpecs, publicComponentSpecs, publicComponentTypes } from "../../src/components/spec-registry";
import { getRenderer, parseSlexSource } from "../../src/engine/index";
import { SLEX_PROTOCOL_VERSION } from "../../src/version";

const documentedNonRuntimeSpecs = new Set(["icon", "playground"]);
const internalRuntimeSpecs = new Set(["step", "submit"]);

describe("component SPEC registry", () => {
  it("keeps component SPEC types unique and parseable", () => {
    const types = componentSpecs.map((spec) => spec.type);
    expect(new Set(types).size).toBe(types.length);
    expect(publicComponentTypes).toEqual(publicComponentSpecs.map((spec) => spec.type));
    expect(publicComponentTypes).not.toContain("submit");
    expect(publicComponentTypes).not.toContain("step");
    expect(types).toEqual(expect.arrayContaining(["submit", "step"]));

    for (const spec of componentSpecs) {
      expect(spec.type, `${spec.type} type`).toBeTruthy();
      expect(spec.title, `${spec.type} title`).toBeTruthy();
      expect(spec.summary, `${spec.type} summary`).toBeTruthy();
      expect(spec.description, `${spec.type} description`).toBeTruthy();
      expect(spec.docs.href, `${spec.type} docs href`).toBe(`/docs/components/${spec.type}`);
      expect(spec.examples.length, `${spec.type} examples`).toBeGreaterThan(0);

      for (const example of spec.examples) {
        expect(example.source.slex, `${spec.type}:${example.id} protocol marker`).toBe(SLEX_PROTOCOL_VERSION);
        expect(example.source.namespace, `${spec.type}:${example.id} namespace`).toBeTruthy();
        expect(example.source.layout, `${spec.type}:${example.id} layout`).toBeTruthy();

        const parsed = parseSlexSource(JSON.stringify(example.source, null, 2));
        expect(parsed.ok, `${spec.type}:${example.id} source`).toBe(true);
      }
    }
  });

  it("keeps runtime component registrations aligned with renderable SPEC entries", () => {
    const publicRuntimeTypes = publicComponentTypes
      .filter((type) => !documentedNonRuntimeSpecs.has(type))
      .toSorted();
    const specRuntimeTypes = componentSpecs
      .map((spec) => spec.type)
      .filter((type) => !documentedNonRuntimeSpecs.has(type))
      .toSorted();

    expect(ALL_COMPONENT_TYPES.toSorted()).toEqual(specRuntimeTypes);
    expect(ALL_COMPONENT_TYPES.toSorted()).toEqual([...publicRuntimeTypes, ...internalRuntimeSpecs].toSorted());
    expect(publicComponentTypes).toContain("icon");
    expect(publicComponentTypes).toContain("playground");
    expect(ALL_COMPONENT_TYPES).not.toContain("icon");
    expect(ALL_COMPONENT_TYPES).not.toContain("playground");
    expect(getRenderer("icon")).toBeUndefined();
  });

  it("keeps playground as an explicit tooling entry component", async () => {
    await import("../../src/components/tooling");
    expect(getRenderer("playground")).toBeTruthy();
  });
});
