import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const explicit = process.env.SLEXKIT_ACCEPTANCE_URL || process.env.BASE_URL;
const port = Number(process.env.SLEXKIT_ACCEPTANCE_PORT || 4011);
const baseUrl = (explicit || `http://127.0.0.1:${port}`).replace(/\/$/, '');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const output = resolve(root, 'test-results/html-migration/site');
await mkdir(output, { recursive: true });
let server;
const logs = [];
const report = { baseUrl, version: pkg.version, profile: 'html-1', routes: [], status: 'failed' };
function killTree(child) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch {}
  } else child.kill('SIGKILL');
}
try {
  if (!explicit && process.env.SLEXKIT_ACCEPTANCE_START_SERVER !== '0') {
    server = spawn('bun', ['site/server.ts'], { cwd: root, env: { ...process.env, PORT: String(port), SLEXKIT_LIVE_RELOAD: '0' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', data => logs.push(String(data)));
    server.stderr.on('data', data => logs.push(String(data)));
  }
  const deadline = Date.now() + 60000;
  while (true) {
    try { if ((await fetch(baseUrl + '/healthz', { signal: AbortSignal.timeout(1500) })).ok) break; } catch {}
    if (Date.now() > deadline || (server && server.exitCode !== null)) throw new Error('Site startup failed: ' + logs.join(''));
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  for (const route of ['/', '/docs/guides/quick-start', '/docs/reference/packages', '/docs/reference/toolhost', '/docs/reference/standard', '/docs/components/radio-group', '/examples', '/examples/assistant-ui-host', '/playground.html', '/healthz', '/slexkit-ai-manifest.json', '/standard/slex-standard-manifest.json', '/standard/slex-html-profile.json', '/standard/slex-custom-elements.catalog.json', '/standard/slex-sandbox-sdk.json', '/standard/slex-static-policy.json', '/standard/slex-html-conformance.json', '/llms.txt', '/llms-full.txt', '/llms-authoring.txt', '/api/wiki-docs', '/api/examples-docs']) {
    const response = await fetch(baseUrl + route);
    const body = await response.text();
    assert.equal(response.status, 200, `${route}: ${response.status}`);
    assert.ok(body.length > 0, `${route}: empty`);
    if (route === '/healthz') {
      const health = JSON.parse(body);
      assert.equal(health.version, pkg.version);
      assert.equal(health.protocolVersion, 'html-1');
    }
    report.routes.push({ route, status: response.status, bytes: Buffer.byteLength(body) });
  }
  for (const [script, timeout] of [
    ['tests/conformance/html-site-worker.mjs', 90000],
    ['tests/conformance/site-examples-worker.mjs', 240000],
    ['tests/conformance/stat-animation-worker.mjs', 90000],
  ]) {
    const worker = spawn(process.execPath, [script, baseUrl], { cwd: root, stdio: 'inherit', windowsHide: true });
    const timer = setTimeout(() => killTree(worker), timeout);
    const code = await new Promise(resolveExit => worker.once('exit', resolveExit));
    clearTimeout(timer);
    assert.equal(code, 0, `${script} browser interactions failed`);
  }
  report.status = 'passed';
} catch (error) { report.error = error.stack; process.exitCode = 1; console.error(error); }
finally {
  killTree(server);
  await writeFile(resolve(output, 'availability.json'), JSON.stringify(report, null, 2));
  await writeFile(resolve(output, 'server.log'), logs.join(''));
}
console.log(`HTML site acceptance: ${report.status}`);
