import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { inspectSlexSource } from "../../src/html/inspect";

type Fixture = {
  id: string;
  kind: "valid" | "invalid";
  source: string;
  expected: { ok: boolean; diagnostic?: string };
};

async function distributedFixtures(): Promise<Fixture[]> {
  const artifact = JSON.parse(await readFile("dist/standard/slex-html-conformance.json", "utf8")) as {
    name: string;
    fixtures: Fixture[];
  };
  expect(artifact.name).toBe("slex-html-conformance");
  return artifact.fixtures;
}

function inspectFixture(fixture: Fixture) {
  const actual = inspectSlexSource(fixture.source);
  return {
    id: fixture.id,
    ok: actual.ok === fixture.expected.ok
      && (!fixture.expected.diagnostic || actual.diagnostic?.code === fixture.expected.diagnostic),
    expected: fixture.expected,
    actual: {
      ok: actual.ok,
      diagnostic: actual.diagnostic?.code,
      warnings: actual.warnings.map((warning) => warning.code),
    },
  };
}

describe("distributed static HTML conformance", () => {
  it("passes every case in the generated artifact without a public runner API", async () => {
    const fixtures = await distributedFixtures();
    expect(fixtures.length).toBeGreaterThanOrEqual(16);
    const cases = fixtures.map(inspectFixture);
    expect(cases.filter((item) => !item.ok)).toEqual([]);
    expect(cases.some((item) => item.actual.ok)).toBe(true);
    expect(cases.some((item) => !item.actual.ok)).toBe(true);
  });

  it("supports deterministic fixture selection by id", async () => {
    const fixtures = await distributedFixtures();
    const selected = fixtures.find((fixture) => fixture.id === "invalid-event-attribute");
    expect(selected).toBeTruthy();
    expect(inspectFixture(selected!)).toMatchObject({
      id: "invalid-event-attribute",
      ok: true,
      actual: { ok: false, diagnostic: "inline-event-handler" },
    });
    expect(fixtures.find((fixture) => fixture.id === "missing-fixture")).toBeUndefined();
  });

  it("does not execute fixture scripts during inspection", async () => {
    const marker = "__slexkit_conformance_nonexecution__";
    delete (globalThis as Record<string, unknown>)[marker];
    const fixture: Fixture = {
      id: "malicious-nonexecution",
      kind: "valid",
      source: `<script>globalThis.${marker} = true;</script>`,
      expected: { ok: true },
    };
    expect(inspectFixture(fixture).ok).toBe(true);
    expect((globalThis as Record<string, unknown>)[marker]).toBeUndefined();
  });
});
