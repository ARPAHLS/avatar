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
    mode: 'select',
  });
  assert.deepEqual(action(resolveStageCommand('animation.play', { id: 'Peace Sign' }, context)), {
    kind: 'animation.play',
    animationId: 'vrma-03',
    mode: 'select',
  });
  assert.deepEqual(
    action(
      resolveStageCommand('animation.play', { id: 'my wave' }, { ...context, animationCatalog: custom }),
    ),
    { kind: 'animation.play', animationId: 'lib-anim-my_wave-aaa', mode: 'select' },
  );
});

test('animation.play defaults to select and takes once explicitly', () => {
  assert.deepEqual(action(resolveStageCommand('animation.play', { id: 'vrma-03', mode: 'once' }, context)), {
    kind: 'animation.play',
    animationId: 'vrma-03',
    mode: 'once',
  });
  // Absent and explicit-select mean the same thing, so a caller written before
  // one-shots existed keeps working.
  assert.equal(action(resolveStageCommand('animation.play', { id: 'vrma-03' }, context)).mode, 'select');
  assert.equal(
    action(resolveStageCommand('animation.play', { id: 'vrma-03', mode: undefined }, context)).mode,
    'select',
  );

  for (const mode of ['loop', '', 'ONCE', 1, {}]) {
    assert.equal(
      resolveStageCommand('animation.play', { id: 'vrma-03', mode }, context).code,
      'bad-payload',
      `mode ${JSON.stringify(mode)} should not be accepted`,
    );
  }
});

test('animation.play refuses a one-shot that cannot end on its own', () => {
  // The Default sequence loops for as long as it is selected, so there is no
  // frame at which the selection underneath could come back.
  const result = resolveStageCommand('animation.play', { id: 'default', mode: 'once' }, context);
  assert.equal(result.code, 'not-playable-once');
  assert.match(result.error, /Default/);

  // Still selectable the ordinary way.
  assert.equal(resolveStageCommand('animation.play', { id: 'default' }, context).ok, true);
});

test('animation.stop takes no payload and cannot fail', () => {
  for (const payload of [undefined, null, {}, { id: 'nonsense' }, 'junk']) {
    assert.deepEqual(action(resolveStageCommand('animation.stop', payload, context)), {
      kind: 'animation.stop',
    });
  }
});

test('animation.play reports a miss instead of playing something else', () => {
  const result = resolveStageCommand('animation.play', { id: 'peace' }, context);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'unknown-animation');
  assert.match(result.error, /peace/);

  // Replace semantics: a bundled id is a real miss against a custom folder.
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
    mode: 'select',
  });
  // No bundled Default sequence in a custom folder — fall back, do not fail.
  assert.deepEqual(
    action(resolveStageCommand('animation.default', {}, { ...context, animationCatalog: custom })),
    { kind: 'animation.play', animationId: 'lib-anim-my_wave-aaa', mode: 'select' },
  );
});

test('avatar.set only accepts ids in the catalog', () => {
  assert.deepEqual(action(resolveStageCommand('avatar.set', { id: 'avatar2' }, context)), {
    kind: 'avatar.set',
    avatarId: 'avatar2',
  });
  assert.equal(resolveStageCommand('avatar.set', { id: 'avatar9' }, context).code, 'unknown-avatar');
  // Labels are deliberately not matched, unlike animations.
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
  assert.equal(resolveStageCommand('environment.set', { type: 'env', id: 'lib-env-desk-4f2' }, context).ok, true);

  const result = resolveStageCommand('environment.set', { type: 'env', id: 'bloom' }, context);
  assert.equal(result.code, 'unknown-environment');
  assert.match(result.error, /bloom/);

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
  const result = resolveStageCommand('animation.pause', {}, context);
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
  // A null entry is not a missing one, so parameter defaults do not cover it.
  for (const broken of [undefined, {}, { avatarIds: null }, { animationCatalog: 'nope' }]) {
    assert.equal(resolveStageCommand('animation.play', { id: 'vrma-03' }, broken).ok, false);
    assert.equal(resolveStageCommand('avatar.set', { id: 'avatar1' }, broken).ok, false);
    assert.equal(resolveStageCommand('environment.set', { type: 'env', id: 'stars' }, broken).ok, false);
    assert.equal(resolveStageCommand('audio.source', { id: 'none' }, broken).ok, false);
  }
});

test('resolveStageCommand mutates nothing', () => {
  const payload = { type: 'env', id: 'code' };
  const catalog = [...bundled];
  resolveStageCommand('environment.set', payload, { ...context, animationCatalog: catalog });

  assert.deepEqual(payload, { type: 'env', id: 'code' });
  assert.deepEqual(catalog, bundled);
});
