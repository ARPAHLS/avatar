import assert from 'node:assert/strict';
import test from 'node:test';
import { STAGE_COMMANDS, resolveStageCommand } from './stageCommands.js';
import { restAnimation } from '../config/animationLookup.js';

const bundled = [
  restAnimation,
  { id: 'default', label: 'Default', source: 'sequence', intro: [], sequence: [], selectable: true },
  { id: 'vrma-03', label: 'Peace Sign', source: 'vrma', vrmaUrl: '/c.vrma', selectable: true },
];

/** What a custom .vrma folder produces: hashed ids, filenames as labels. */
const custom = [
  { id: 'lib-anim-my_wave-aaa', label: 'my wave', source: 'vrma', vrmaUrl: 'blob:1', selectable: true },
];

/** @type {import('./stageCommands.js').StageCommandContext} */
const context = {
  animationCatalog: bundled,
  avatarIds: ['avatar1', 'avatar2'],
  environmentIds: ['stars', 'code', 'lib-env-desk-4f2'],
  audioSourceIds: ['none', 'system', 'microphone'],
};

/** @param {import('./stageCommands.js').StageCommandResult} result */
function action(result) {
  assert.equal(result.ok, true, result.ok ? '' : `unexpected failure: ${result.error}`);
  return result.action;
}

test('animation.play accepts an id or a label', () => {
  assert.deepEqual(action(resolveStageCommand('animation.play', { id: 'vrma-03' }, context)), {
    kind: 'animation.play',
    animationId: 'vrma-03',
  });
  // The point of label matching: an agent knows the clip by name, not by id.
  assert.deepEqual(action(resolveStageCommand('animation.play', { id: 'Peace Sign' }, context)), {
    kind: 'animation.play',
    animationId: 'vrma-03',
  });
  assert.deepEqual(
    action(
      resolveStageCommand('animation.play', { id: 'my wave' }, { ...context, animationCatalog: custom }),
    ),
    { kind: 'animation.play', animationId: 'lib-anim-my_wave-aaa' },
  );
});

test('animation.play reports a miss instead of playing something else', () => {
  const result = resolveStageCommand('animation.play', { id: 'peace' }, context);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'unknown-animation');
  assert.match(result.error, /peace/);

  // Custom folders replace the bundled catalog, so a bundled id is a real miss.
  assert.equal(
    resolveStageCommand('animation.play', { id: 'vrma-03' }, { ...context, animationCatalog: custom })
      .code,
    'unknown-animation',
  );
});

test('animation.play rejects a payload with no usable id', () => {
  for (const payload of [undefined, null, {}, { id: '' }, { id: '  ' }, { id: 3 }, 'vrma-03']) {
    assert.equal(resolveStageCommand('animation.play', payload, context).code, 'bad-payload');
  }
});

test('animation.default resolves against the live catalog', () => {
  assert.deepEqual(action(resolveStageCommand('animation.default', {}, context)), {
    kind: 'animation.play',
    animationId: 'default',
  });
  // No bundled Default sequence in a custom folder — fall back, do not fail.
  assert.deepEqual(
    action(resolveStageCommand('animation.default', {}, { ...context, animationCatalog: custom })),
    { kind: 'animation.play', animationId: 'lib-anim-my_wave-aaa' },
  );
});

test('avatar.set only accepts ids in the catalog', () => {
  assert.deepEqual(action(resolveStageCommand('avatar.set', { id: 'avatar2' }, context)), {
    kind: 'avatar.set',
    avatarId: 'avatar2',
  });
  assert.equal(resolveStageCommand('avatar.set', { id: 'avatar9' }, context).code, 'unknown-avatar');
  // Labels are deliberately not matched.
  assert.equal(resolveStageCommand('avatar.set', { id: 'Avatar 2' }, context).code, 'unknown-avatar');
  assert.equal(resolveStageCommand('avatar.set', {}, context).code, 'bad-payload');
});

test('environment.set takes the selection as its payload', () => {
  assert.deepEqual(action(resolveStageCommand('environment.set', { type: 'env', id: 'code' }, context)), {
    kind: 'environment.set',
    selection: { type: 'env', id: 'code' },
  });
  assert.deepEqual(
    action(resolveStageCommand('environment.set', { type: 'color', value: '#FF0080' }, context)),
    { kind: 'environment.set', selection: { type: 'color', value: '#ff0080' } },
  );
  assert.deepEqual(action(resolveStageCommand('environment.set', { type: 'none' }, context)), {
    kind: 'environment.set',
    selection: { type: 'none' },
  });
});

test('environment.set checks env ids against the catalog', () => {
  // A custom-folder id is as valid as a bundled one once it has been scanned.
  assert.equal(resolveStageCommand('environment.set', { type: 'env', id: 'lib-env-desk-4f2' }, context).ok, true);

  const result = resolveStageCommand('environment.set', { type: 'env', id: 'bloom' }, context);
  assert.equal(result.code, 'unknown-environment');
  assert.match(result.error, /bloom/);

  // Colours have no catalog to check, only a shape.
  assert.equal(resolveStageCommand('environment.set', { type: 'color', value: 'red' }, context).code, 'bad-payload');
  assert.equal(resolveStageCommand('environment.set', { type: 'gif' }, context).code, 'bad-payload');
});

test('audio.source is validated against the current runtime', () => {
  assert.deepEqual(action(resolveStageCommand('audio.source', { id: 'microphone' }, context)), {
    kind: 'audio.source',
    audioSourceId: 'microphone',
  });
  // 'system' is desktop-only; in a browser context it is simply not offered.
  assert.equal(
    resolveStageCommand('audio.source', { id: 'system' }, { ...context, audioSourceIds: ['none', 'microphone'] })
      .code,
    'unknown-audio-source',
  );
});

test('an unknown command names the ones that exist', () => {
  const result = resolveStageCommand('animation.stop', {}, context);
  assert.equal(result.code, 'unknown-command');
  for (const command of STAGE_COMMANDS) {
    assert.match(result.error, new RegExp(command.replace('.', '\\.')));
  }
});

test('resolveStageCommand never throws on hostile input', () => {
  // Everything here arrives from outside the app once the bus lands.
  for (const command of [undefined, null, 42, {}, [], 'proto', '__proto__', 'toString']) {
    const result = resolveStageCommand(command, { id: 'vrma-03' }, context);
    assert.equal(result.ok, false);
  }
  assert.equal(resolveStageCommand('animation.play', { id: 'vrma-03' }, undefined).ok, false);
  assert.equal(resolveStageCommand('animation.play', { id: 'vrma-03' }, {}).ok, false);
});

test('resolveStageCommand mutates nothing', () => {
  const payload = { type: 'env', id: 'code' };
  const catalog = [...bundled];
  resolveStageCommand('environment.set', payload, { ...context, animationCatalog: catalog });

  assert.deepEqual(payload, { type: 'env', id: 'code' });
  assert.deepEqual(catalog, bundled);
});
