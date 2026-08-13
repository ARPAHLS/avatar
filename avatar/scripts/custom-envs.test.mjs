import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after, before, describe } from 'node:test';
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
  // What must not survive is any glob that can reach into custom/. Asserting
  // on the path rather than on `import.meta.glob` in general: environments.js
  // also globs the committed thumbs/ posters, which are build assets that are
  // meant to ship, and that glob has to stay.
  assert.doesNotMatch(result.code, /assets\/environments\/custom/);
  assert.match(result.code, /import\.meta\.glob\('\.\.\/assets\/environments\/thumbs/);
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
// rewritten. What we actually promise is stronger and only a real build can
// show it: what sits in custom/ makes no difference to the bundle at all.
// Three builds, shared by the assertions below, are enough to pin that down.

const projectRoot = path.join(here, '..');
const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const customDir = path.join(projectRoot, 'src', 'assets', 'environments', 'custom');

/** Deliberately different in count, extension and size from `probeSetB`. */
const probeSetA = [
  ['a1.gif', 64 * 1024],
  ['a2.png', 512 * 1024],
];
const probeSetB = [
  ['b1.gif', 1024],
  ['b2.jpg', 3 * 1024 * 1024],
  ['b3.jpeg', 128 * 1024],
];

/** Every emitted file as `relative/path md5`, sorted — not just asset names. */
function manifestOf(dir) {
  /** @type {string[]} */
  const entries = [];
  const walk = (current) => {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else {
        const hash = createHash('md5').update(fs.readFileSync(full)).digest('hex');
        entries.push(`${path.relative(dir, full).replace(/\\/g, '/')} ${hash}`);
      }
    }
  };
  walk(dir);
  return entries.sort();
}

/**
 * Plants a named set of files in custom/ (leaving any local trial media
 * alone), builds, removes them again, and returns the manifest. The stem
 * depends only on `label`, so two builds of the same set differ by nothing but
 * their env — otherwise a comparison between them would also be reading
 * unrelated filename noise.
 * @param {string} label
 * @param {[string, number][]} probeSet
 * @param {Record<string, string>} env
 */
function buildWithProbesInCustom(label, probeSet, env) {
  const stem = `probe-${process.pid}-${label}`;
  const planted = probeSet.map(([suffix, size]) => {
    const file = path.join(customDir, `${stem}-${suffix}`);
    fs.writeFileSync(file, Buffer.alloc(size));
    return file;
  });
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'avatar-custom-envs-'));

  try {
    execFileSync(process.execPath, [viteBin, 'build', '--outDir', outDir, '--emptyOutDir'], {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      stdio: 'pipe',
    });
  } catch (cause) {
    // stdio: 'pipe' keeps the build quiet when it works; when it does not, the
    // reason has to reach the CI log or this failure is undiagnosable.
    throw new Error(`vite build failed for probe set ${label}:\n${cause.stderr}`, { cause });
  } finally {
    for (const file of planted) fs.rmSync(file, { force: true });
  }

  return { stem, outDir, manifest: manifestOf(outDir) };
}

describe('a real build', { timeout: 600_000 }, () => {
  /** @type {ReturnType<typeof buildWithProbesInCustom>} */
  let plainA;
  /** @type {ReturnType<typeof buildWithProbesInCustom>} */
  let plainB;
  /** @type {ReturnType<typeof buildWithProbesInCustom>} */
  let optedInA;

  before(() => {
    const previous = process.env.AVATAR_INCLUDE_CUSTOM;
    delete process.env.AVATAR_INCLUDE_CUSTOM;
    try {
      plainA = buildWithProbesInCustom('a', probeSetA, {});
      plainB = buildWithProbesInCustom('b', probeSetB, {});
      optedInA = buildWithProbesInCustom('a', probeSetA, { AVATAR_INCLUDE_CUSTOM: '1' });
    } finally {
      if (previous === undefined) delete process.env.AVATAR_INCLUDE_CUSTOM;
      else process.env.AVATAR_INCLUDE_CUSTOM = previous;
    }
  });

  after(() => {
    for (const built of [plainA, plainB, optedInA]) {
      if (built) fs.rmSync(built.outDir, { force: true, recursive: true });
    }
  });

  test('leaves custom/ media out of the bundle', () => {
    assert.deepEqual(
      plainA.manifest.filter((entry) => entry.includes(plainA.stem)),
      [],
    );
  });

  test('emits that same media when opted in', () => {
    // Without this control the test above passes just as green when the probes
    // are never planted or the assertion looks in the wrong place.
    assert.equal(
      optedInA.manifest.filter((entry) => entry.includes(optedInA.stem)).length,
      probeSetA.length,
    );
  });

  test('is byte-identical whatever custom/ holds', () => {
    // Stronger than "our probes are absent": two different populations of
    // custom/ must produce the same files with the same contents, so nothing
    // in there can influence chunking or content hashes either.
    assert.deepEqual(plainA.manifest, plainB.manifest);
  });

  test('and that comparison would notice if it were not', () => {
    // Same probe set, same filenames, same manifest function — the only thing
    // that differs is the opt-in, so a difference here can only mean custom/
    // reached the bundle. Proves the comparison above can actually see one.
    assert.notDeepEqual(optedInA.manifest, plainA.manifest);
  });
});
