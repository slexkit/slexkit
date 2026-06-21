---
title: Slex Standard Artifacts
category: Reference
status: ready
order: 65
summary: "Generated JSON artifacts for the Slex envelope, component catalog, logic profile, capabilities, conformance fixtures, and standard manifest."
slexkitRenderMode: component
---

# Slex Standard Artifacts

SlexKit publishes machine-readable standard artifacts for AI agents, host runtimes, MCP servers, and package consumers. These artifacts describe Slex as a Markdown-native logic-bearing UI artifact, not as a pure JSON card catalog.

The TypeScript runtime registry remains the source of truth. The generated JSON files are derived from component specs, runtime version constants, expression capability metadata, and conformance fixtures.

## Files

- [`/standard/slex-standard-manifest.json`](/standard/slex-standard-manifest.json): version, protocol, logic profile, artifact paths, and hashes.
- [`/standard/slex-expression.schema.json`](/standard/slex-expression.schema.json): JSON Schema for the Slex envelope, `namespace`, `g`, `layout`, component keys, and directive fields.
- [`/standard/slex-component-catalog.json`](/standard/slex-component-catalog.json): public component props, dynamic flags, generated prop JSON Schema, state modes, children, examples, docs, and per-component hashes.
- [`/standard/slex-logic-profile.json`](/standard/slex-logic-profile.json): `$` read-pipes, `on*` write-pipes, `$if`, `$for`, `$key`, context variables, reserved names, component state, and secure-mode native capability policy.
- [`/standard/slex-capabilities.catalog.json`](/standard/slex-capabilities.catalog.json): deterministic `std.*` functions and policy-gated `api.*` secure runtime capabilities.
- [`/standard/slex-conformance.json`](/standard/slex-conformance.json): valid, warning, and invalid fixtures with stable expected diagnostic codes, paths, and values.

## Validation Model

Validation is parse-first:

1. Parse the JavaScript object literal source.
2. Validate the Slex envelope and component-key shape.
3. Compare component names and props against the generated component catalog.
4. Scan logic strings and source text against the logic profile.
5. Return stable diagnostic and warning codes.

`validateSlexSource()` keeps its previous structured output and adds `schemaVersion`, `protocolVersion`, and `logicProfileVersion`. Secure-mode diagnostics should guide authors toward policy-gated `api.*` capabilities instead of treating all logic as forbidden.

Warnings are path-aware after parsing. For example, an unknown `std.*` call in `layout.text:value.$text` and a native `fetch()` call in `g.load` produce different stable paths, so an agent can repair the exact expression instead of rewriting the whole artifact.

## Run Conformance

Use the bundled conformance runner to verify that SlexKit's validator still matches the published standard fixtures:

```sh
slex validate --standard
slex validate --standard --json
slex validate --standard --fixture valid-full-envelope
```

Use file validation for a single Slex source:

```sh
slex validate ./artifact.slex --mode secure
slex validate ./artifact.slex --mode trusted --strict
```

Conformance validates source shape, logic profile diagnostics, capability boundaries, and warning stability. It is not a visual renderer screenshot test.

## Diagnostic Codes

Clients use `code`, `path`, and `value` for program logic. `message` is for display.

| Code | Severity | Meaning |
|---|---|---|
| `syntax` | error | JavaScript object literal parsing failed. Returned as `diagnostic.code`, not a warning. |
| `unsupported_protocol` | warning | The optional `slex` marker does not match the supported protocol version. |
| `invalid_component_key` | warning | A component key does not match the `type:identifier` shape. |
| `invalid_directive_type` | warning | A structural directive such as `$if`, `$for`, or `$key` has an invalid value type. |
| `unknown_component` | warning | The component type is not present in the generated component catalog. |
| `unknown_prop` | warning | A component prop is not declared by that component's public spec. |
| `unknown_std_member` | warning | A logic expression references a `std.*` helper outside the published capability catalog. |
| `unknown_api_member` | warning | A logic expression references an `api.*` member outside the secure runtime capability catalog. |
| `native_secure_capability` | warning | Secure mode source uses native browser capability names such as `fetch`, timers, or `WebSocket`; use policy-gated `api.*` instead. |
| `reserved_context_shadowing` | warning | `g` keys or component identifiers shadow reserved expression context names. |

Paths refer to the parsed source tree, for example `g.load` or `layout.text:value.$text`. If parsing fails, validation can still return source-level usage warnings, but not parsed-tree paths.

## Conformance Fixture Contract

`slex-conformance.json` contains `valid`, `warning`, and `invalid` fixtures. Each fixture has an `id`, `mode`, source text, and an `expected` object.

- `expected.ok` is the validator success state.
- `expected.warnings` is an exact warning set for the fixture. The runner fails if an expected warning is missing or if an extra warning appears.
- Warning matching uses `code`, and when present also `path` and `value`.
- `expected.diagnostic` is the expected parse diagnostic code for invalid fixtures.
- Fixture IDs stay stable. If behavior changes, add a new fixture ID.

The conformance suite checks source validation semantics only. It does not assert component screenshots, browser layout, CSS output, or host adapter lifecycle behavior.

## Versioning Policy

SlexKit exposes separate version fields:

- `packageVersion`: npm package version, from `package.json`.
- `protocolVersion`: accepted Slex source protocol marker, currently `0.1`.
- `schemaVersion`: generated artifact schema generation, currently date-style.
- `logicProfileVersion`: expression, context, stdlib, and secure capability profile version.

Compatible package releases may update catalog hashes, add components or props, add examples, or improve messages without changing `protocolVersion`.

Changes that alter source interpretation, remove or rename diagnostic codes, change expression semantics, or change secure capability behavior require a protocol or logic profile review. Artifact hashes are for cache invalidation, not semantic versioning.

## Positioning

A2UI standardizes cross-platform declarative UI description. SlexKit standardizes Markdown-embedded, stateful, executable UI artifacts with a host-selected trusted or secure runtime boundary.

JSON Schema describes the envelope and catalog. The JavaScript expression profile is part of the standard because local logic and state are part of the artifact.
