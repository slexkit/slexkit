import { createStandardArtifacts, SLEX_LOGIC_PROFILE_VERSION, SLEX_SCHEMA_VERSION } from "../standard/artifacts";
import { SLEXKIT_VERSION, SLEX_PROTOCOL_VERSION } from "../version";
import type { SlexKitSourceDiagnostic } from "./diagnostics";
import { validateSlexSource, type SlexKitValidationMode, type SlexKitValidationWarning } from "./validation";

export type SlexConformanceExpectedWarning = {
  code: string;
  path?: string;
  value?: string;
};

export type SlexConformanceFixture = {
  id: string;
  kind: "valid" | "warning" | "invalid";
  mode: SlexKitValidationMode;
  source: string;
  expected: {
    ok: boolean;
    warnings?: Array<string | SlexConformanceExpectedWarning>;
    diagnostic?: string;
  };
};

export type SlexConformanceCaseResult = {
  id: string;
  kind: SlexConformanceFixture["kind"];
  mode: SlexKitValidationMode;
  ok: boolean;
  expected: SlexConformanceFixture["expected"];
  actual: {
    ok: boolean;
    warnings: SlexKitValidationWarning[];
    diagnostic?: SlexKitSourceDiagnostic;
  };
  errors: string[];
};

export type SlexConformanceReport = {
  ok: boolean;
  packageVersion: string;
  schemaVersion: string;
  protocolVersion: string;
  logicProfileVersion: string;
  total: number;
  passed: number;
  failed: number;
  fixtureId?: string;
  cases: SlexConformanceCaseResult[];
  error?: string;
};

export type SlexConformanceOptions = {
  fixtureId?: string;
  packageVersion?: string;
};

function normalizeExpectedWarning(warning: string | SlexConformanceExpectedWarning): SlexConformanceExpectedWarning {
  return typeof warning === "string" ? { code: warning } : warning;
}

function warningMatches(actual: SlexKitValidationWarning, expected: SlexConformanceExpectedWarning): boolean {
  if (actual.code !== expected.code) return false;
  if (expected.path !== undefined && actual.path !== expected.path) return false;
  if (expected.value !== undefined && actual.value !== expected.value) return false;
  return true;
}

function warningLabel(warning: Pick<SlexKitValidationWarning, "code" | "path" | "value">): string {
  return [warning.code, warning.path, warning.value].filter((item) => item !== undefined).join(" ");
}

function caseResult(fixture: SlexConformanceFixture): SlexConformanceCaseResult {
  const result = validateSlexSource(fixture.source, { mode: fixture.mode });
  const errors: string[] = [];

  if (result.ok !== fixture.expected.ok) {
    errors.push(`Expected ok=${String(fixture.expected.ok)} but got ok=${String(result.ok)}.`);
  }

  const expectedWarnings = fixture.expected.warnings?.map(normalizeExpectedWarning);
  if (expectedWarnings) {
    for (const expected of expectedWarnings) {
      if (!result.warnings.some((warning) => warningMatches(warning, expected))) {
        errors.push(`Missing warning ${JSON.stringify(expected)}.`);
      }
    }
    for (const actual of result.warnings) {
      if (!expectedWarnings.some((expected) => warningMatches(actual, expected))) {
        errors.push(`Unexpected warning ${warningLabel(actual)}.`);
      }
    }
  }

  if (fixture.expected.diagnostic) {
    if (result.ok) {
      errors.push(`Expected diagnostic '${fixture.expected.diagnostic}' but validation succeeded.`);
    } else if (result.diagnostic.code !== fixture.expected.diagnostic) {
      errors.push(`Expected diagnostic '${fixture.expected.diagnostic}' but got '${result.diagnostic.code}'.`);
    }
  }

  return {
    id: fixture.id,
    kind: fixture.kind,
    mode: fixture.mode,
    ok: errors.length === 0,
    expected: fixture.expected,
    actual: {
      ok: result.ok,
      warnings: result.warnings,
      diagnostic: result.ok ? undefined : result.diagnostic,
    },
    errors,
  };
}

function conformanceFixtures(packageVersion: string): SlexConformanceFixture[] {
  const artifact = createStandardArtifacts(packageVersion).artifacts["slex-conformance.json"] as { fixtures: SlexConformanceFixture[] };
  return artifact.fixtures;
}

export function runSlexConformance(options: SlexConformanceOptions = {}): SlexConformanceReport {
  const packageVersion = options.packageVersion ?? SLEXKIT_VERSION;
  const fixtures = conformanceFixtures(packageVersion);
  const selectedFixtures = options.fixtureId ? fixtures.filter((fixture) => fixture.id === options.fixtureId) : fixtures;

  if (options.fixtureId && selectedFixtures.length === 0) {
    return {
      ok: false,
      packageVersion,
      schemaVersion: SLEX_SCHEMA_VERSION,
      protocolVersion: SLEX_PROTOCOL_VERSION,
      logicProfileVersion: SLEX_LOGIC_PROFILE_VERSION,
      total: 0,
      passed: 0,
      failed: 0,
      fixtureId: options.fixtureId,
      cases: [],
      error: `Unknown conformance fixture '${options.fixtureId}'.`,
    };
  }

  const cases = selectedFixtures.map(caseResult);
  const failed = cases.filter((item) => !item.ok).length;
  return {
    ok: failed === 0,
    packageVersion,
    schemaVersion: SLEX_SCHEMA_VERSION,
    protocolVersion: SLEX_PROTOCOL_VERSION,
    logicProfileVersion: SLEX_LOGIC_PROFILE_VERSION,
    total: cases.length,
    passed: cases.length - failed,
    failed,
    fixtureId: options.fixtureId,
    cases,
  };
}
