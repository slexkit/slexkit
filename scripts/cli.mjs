#!/usr/bin/env node
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function help() {
  console.log(`SlexKit CLI

Usage:
  slex copy-runtime [target]

Commands:
  copy-runtime  Copy dist/runtime.js to a public static path.

Example:
  slex copy-runtime public/slexkit.runtime.js
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

const command = process.argv[2];

if (!command || command === "--help" || command === "-h") {
  help();
  process.exit(0);
}

if (command === "copy-runtime") {
  copyRuntime(process.argv[3]);
  process.exit(0);
}

console.error(`Unknown SlexKit command: ${command}`);
help();
process.exit(1);
