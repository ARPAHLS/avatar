import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import viteConfig from '../vite.config.js';

// A clean checkout has an empty custom/, so a build alone can never show that
// the embargo still works — it would pass just as green with the plugin
// deleted. These tests run the real plugin over the real environments.js
// instead, which is what actually decides whether trial media gets bundled.

const here = path.dirname(fileURLToPath(import.meta.url));
const environmentsId = path.join(here, '..', 'src', 'config', 'environments.js');
const environmentsSource = fs.readFileSync(environmentsId, 'utf8');

/** Rollup hands `transform` a plugin context; only `error` matters here. */
const rollupContext = {
  error(message) {
    throw new Error(typeof message === 'string' ? message : message.message);
  },
};

/** @param {{ command: string, mode?: string }} env */
function transformEnvironments(env, code = environmentsSource) {
  const { plugins } = viteConfig({ mode: 'production', ...env });
  const plugin = plugins
    .flat(Infinity)
    .find((entry) => entry && entry.name === 'avatar-strip-custom-envs');
  assert.ok(plugin, 'vite.config.js no longer registers avatar-strip-custom-envs');
  return plugin.transform.call(rollupContext, code, environmentsId);
}

function withoutOptIn(context) {
  const previous = process.env.AVATAR_INCLUDE_CUSTOM;
  delete process.env.AVATAR_INCLUDE_CUSTOM;
  context.after(() => {
    if (previous === undefined) delete process.env.AVATAR_INCLUDE_CUSTOM;
    else process.env.AVATAR_INCLUDE_CUSTOM = previous;
  });
}

test('a production build strips the custom/ glob', (context) => {
  withoutOptIn(context);

  const result = transformEnvironments({ command: 'build' });

  assert.ok(result, 'expected the plugin to rewrite environments.js');
  assert.match(result.code, /const customModules = \{\};/);
  assert.doesNotMatch(result.code, /import\.meta\.glob/);
});

test('the dev server keeps the custom/ glob', (context) => {
  withoutOptIn(context);

  assert.equal(transformEnvironments({ command: 'serve' }), null);
});

test('AVATAR_INCLUDE_CUSTOM=1 opts a build back in', (context) => {
  withoutOptIn(context);
  process.env.AVATAR_INCLUDE_CUSTOM = '1';

  assert.equal(transformEnvironments({ command: 'build' }), null);
});

test('a build fails rather than silently bundling custom/ media', (context) => {
  withoutOptIn(context);
  const renamed = environmentsSource.replace(
    'const customModules = import.meta.glob(',
    'const customEnvModules = import.meta.glob(',
  );
  assert.notEqual(renamed, environmentsSource, 'fixture no longer matches environments.js');

  assert.throws(() => transformEnvironments({ command: 'build' }, renamed), {
    message: /custom\/ media would be bundled/,
  });
});

test('other modules are left alone', (context) => {
  withoutOptIn(context);

  const other = path.join(here, '..', 'src', 'config', 'userSettings.js');
  const { plugins } = viteConfig({ command: 'build', mode: 'production' });
  const plugin = plugins
    .flat(Infinity)
    .find((entry) => entry && entry.name === 'avatar-strip-custom-envs');

  assert.equal(plugin.transform.call(rollupContext, environmentsSource, other), null);
});

// The tests above assert the mechanism — that one glob in environments.js gets
// rewritten. The invariant we actually care about is that no file in custom/
// reaches the bundle, whatever route it might take there. Only a real build
// shows that, so this pair pays ~10s to plant a file and go look for it.

const projectRoot = path.join(here, '..');
const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const customDir = path.join(projectRoot, 'src', 'assets', 'environments', 'custom');

/**
 * Plants a uniquely named file in custom/ (leaving any local trial media
 * alone), builds, and reports the emitted asset names.
 * @param {import('node:test').TestContext} context
 * @param {Record<string, string>} env
 */
function buildWithProbeInCustom(context, env) {
  const stem = `probe-${process.pid}-${Date.now()}`;
  const probe = path.join(customDir, `${stem}.gif`);
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'avatar-custom-envs-'));
  fs.writeFileSync(probe, Buffer.alloc(64 * 1024));
  context.after(() => {
    fs.rmSync(probe, { force: true });
    fs.rmSync(outDir, { force: true, recursive: true });
  });

  execFileSync(process.execPath, [viteBin, 'build', '--outDir', outDir, '--emptyOutDir'], {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    stdio: 'pipe',
  });

  return { stem, assets: fs.readdirSync(path.join(outDir, 'assets')) };
}

test('a real build leaves custom/ media out of the bundle', { timeout: 180_000 }, (context) => {
  withoutOptIn(context);

  const { stem, assets } = buildWithProbeInCustom(context, {});

  assert.deepEqual(
    assets.filter((name) => name.startsWith(stem)),
    [],
  );
});

test('...and the same build does emit it when opted in', { timeout: 180_000 }, (context) => {
  withoutOptIn(context);

  // Without this control the test above passes just as green when the probe is
  // never planted or the assertion looks in the wrong place.
  const { stem, assets } = buildWithProbeInCustom(context, { AVATAR_INCLUDE_CUSTOM: '1' });

  assert.equal(assets.filter((name) => name.startsWith(stem)).length, 1);
});
