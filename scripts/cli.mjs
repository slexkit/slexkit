#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function help() {
  console.log(`SlexKit CLI

Usage:
  slex copy-runtime [target]
  slex validate [file] [--mode trusted|secure] [--strict] [--json]
  slex validate --standard [--fixture id] [--json]

Commands:
  copy-runtime  Copy dist/runtime.js to a public static path.
  validate      Validate Slex source or run standard conformance fixtures.

Example:
  slex copy-runtime public/slexkit.runtime.js
  slex validate examples/status.slex
  slex validate --standard --json
`);
}

function copyRuntime(target = "public/slexkit.runtime.js") {
  const source = resolve(packageRoot, "dist", "runtime.js");
  const destination = resolve(process.cwd(), target);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  console.log(`Copied SlexKit runtime to ${destination}`);
  console.log("Serve this file with:");
  console.log("  Access-Control-Allow-Origin: *");
  console.log("  Content-Type: text/javascript");
}

async function runtimeApi() {
  return import(pathToFileURL(resolve(packageRoot, "dist", "runtime.js")).href);
}

function parseValidateArgs(args) {
  const options = {
    file: "",
    fixtureId: "",
    json: false,
    mode: "secure",
    standard: false,
    strict: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--standard") {
      options.standard = true;
      continue;
    }
    if (arg === "--strict") {
      options.strict = true;
      continue;
    }
    if (arg === "--mode") {
      const mode = args[++index];
      if (mode !== "trusted" && mode !== "secure") throw new Error("--mode must be 'trusted' or 'secure'.");
      options.mode = mode;
      continue;
    }
    if (arg === "--fixture") {
      const fixtureId = args[++index];
      if (!fixtureId) throw new Error("--fixture requires a fixture id.");
      options.fixtureId = fixtureId;
      continue;
    }
    if (arg.startsWith("--")) throw new Error(`Unknown validate option: ${arg}`);
    if (options.file) throw new Error(`Unexpected validate argument: ${arg}`);
    options.file = arg;
  }

  if (options.standard && options.file) throw new Error("Use either --standard or a source file, not both.");
  if (!options.standard && options.fixtureId) throw new Error("--fixture can only be used with --standard.");
  if (!options.standard && !options.file) throw new Error("validate requires a source file or --standard.");
  return options;
}

function validationOutput(result) {
  if (!result.ok) return result;
  const { value: _value, ...output } = result;
  return output;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printConformance(report) {
  const status = report.ok ? "pass" : "fail";
  const fixture = report.fixtureId ? ` fixture=${report.fixtureId}` : "";
  console.log(`Slex conformance: ${status} (${report.passed}/${report.total})${fixture}`);
  if (report.error) console.log(report.error);
  for (const item of report.cases.filter((entry) => !entry.ok)) {
    console.log(`- ${item.id}: fail`);
    for (const error of item.errors) console.log(`  ${error}`);
  }
}

function printValidation(result, options) {
  const status = result.ok ? "pass" : "fail";
  console.log(`Slex validation: ${status}`);
  if (!result.ok) {
    console.log(`${result.diagnostic.message} at line ${result.diagnostic.line}, column ${result.diagnostic.column}`);
    if (result.diagnostic.detail) console.log(result.diagnostic.detail);
    console.log(result.diagnostic.excerpt);
  }
  if (result.warnings.length) {
    console.log(`Warnings: ${result.warnings.length}`);
    for (const warning of result.warnings) {
      const path = warning.path ? ` at ${warning.path}` : "";
      const value = warning.value ? ` (${warning.value})` : "";
      console.log(`- ${warning.code}${path}${value}: ${warning.message}`);
    }
  }
  if (options.strict && result.warnings.length) {
    console.log("Strict mode treats warnings as failures.");
  }
}

async function validateCommand(args) {
  const options = parseValidateArgs(args);
  const runtime = await runtimeApi();

  if (options.standard) {
    const report = runtime.runSlexConformance({ fixtureId: options.fixtureId || undefined });
    if (options.json) printJson(report);
    else printConformance(report);
    process.exit(report.ok ? 0 : 1);
  }

  const source = readFileSync(resolve(process.cwd(), options.file), "utf-8");
  const result = runtime.validateSlexSource(source, { mode: options.mode });
  const output = validationOutput(result);
  const ok = result.ok && (!options.strict || result.warnings.length === 0);
  if (options.json) printJson(output);
  else printValidation(result, options);
  process.exit(ok ? 0 : 1);
}

const command = process.argv[2];

if (!command || command === "--help" || command === "-h") {
  help();
  process.exit(0);
}

if (command === "copy-runtime") {
  copyRuntime(process.argv[3]);
  process.exit(0);
}

if (command === "validate") {
  try {
    await validateCommand(process.argv.slice(3));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

console.error(`Unknown SlexKit command: ${command}`);
help();
process.exit(1);
