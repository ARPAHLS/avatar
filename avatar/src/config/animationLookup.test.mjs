import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createVrmaResolver,
  defaultAnimationId,
  findAnimation,
  getAnimationById,
  getSelectableAnimations,
  resolveAnimationId,
  resolveVrmaUrl,
  restAnimation,
} from './animationLookup.js';

/** Shape of the bundled catalog, without the Vite-resolved asset urls. */
const bundled = [
  restAnimation,
  {
    id: 'default',
    label: 'Default',
    source: 'sequence',
    intro: ['vrma-02'],
    sequence: ['vrma-06', 'vrma-01'],
    selectable: true,
  },
  { id: 'vrma-01', label: 'Show Full Body', source: 'vrma', vrmaUrl: '/a.vrma', selectable: true },
  { id: 'vrma-02', label: 'Greeting', source: 'vrma', vrmaUrl: '/b.vrma', selectable: true },
  { id: 'vrma-06', label: 'Model Pose', source: 'vrma', vrmaUrl: '/c.vrma', selectable: true },
];

/** Shape `loadLibraryAnimations` builds for a custom folder. */
const custom = [
  { id: 'lib-anim-my_wave-aaa', label: 'my wave', source: 'vrma', vrmaUrl: 'blob:1', playback: 'loop', selectable: true },
  { id: 'lib-anim-victory-bbb', label: 'victory', source: 'vrma', vrmaUrl: 'blob:2', playback: 'loop', selectable: true },
];

test('getAnimationById reads the catalog it is handed', () => {
  assert.equal(getAnimationById('vrma-02', bundled).label, 'Greeting');
  assert.equal(getAnimationById('lib-anim-victory-bbb', custom).label, 'victory');
  // Replace semantics: a bundled id must not resolve against a custom folder.
  assert.notEqual(getAnimationById('vrma-02', custom).id, 'vrma-02');
});

test('getAnimationById never returns undefined', () => {
  // Callers dereference `.source` unconditionally, so an unknown id has to fall
  // back to a real entry — the catalog's first, or rest for an empty catalog.
  assert.equal(getAnimationById('nope', bundled).id, 'rest');
  assert.equal(getAnimationById('nope', custom).id, 'lib-anim-my_wave-aaa');
  assert.equal(getAnimationById('nope', []).id, 'rest');
  assert.equal(getAnimationById('rest', []), restAnimation);
});

test('findAnimation matches ids and labels', () => {
  assert.equal(findAnimation(bundled, 'vrma-02')?.label, 'Greeting');
  assert.equal(findAnimation(bundled, 'Greeting')?.id, 'vrma-02');
  assert.equal(findAnimation(bundled, '  greeting  ')?.id, 'vrma-02');
  assert.equal(findAnimation(custom, 'MY WAVE')?.id, 'lib-anim-my_wave-aaa');
  // Not selectable, but still a legitimate thing to ask the avatar to do.
  assert.equal(findAnimation(bundled, 'rest')?.id, 'rest');
});

// The whole reason this exists next to getAnimationById, which answers with the
// catalog's first entry rather than admitting it found nothing.
test('findAnimation returns null on a miss', () => {
  assert.equal(findAnimation(bundled, 'Greetings'), null);
  assert.equal(findAnimation(custom, 'vrma-02'), null);
  assert.equal(findAnimation([], 'rest'), null);
  assert.equal(findAnimation(bundled, ''), null);
  assert.equal(findAnimation(bundled, '   '), null);
  assert.equal(findAnimation(bundled, undefined), null);
  assert.equal(findAnimation(bundled, 42), null);
  assert.equal(findAnimation(undefined, 'rest'), null);
});

// A folder holding `Greeting.vrma` must not steal an exact id from the catalog.
test('findAnimation prefers an id over a label', () => {
  const shadowed = [
    { id: 'lib-anim-greeting-aaa', label: 'vrma-02', source: 'vrma', vrmaUrl: 'blob:1' },
    { id: 'vrma-02', label: 'Greeting', source: 'vrma', vrmaUrl: 'blob:2' },
  ];

  assert.equal(findAnimation(shadowed, 'vrma-02')?.vrmaUrl, 'blob:2');
});

test('resolveVrmaUrl only answers for vrma entries', () => {
  assert.equal(resolveVrmaUrl('vrma-01', bundled), '/a.vrma');
  assert.equal(resolveVrmaUrl('lib-anim-victory-bbb', custom), 'blob:2');
  // The sequence entry and rest carry no clip of their own.
  assert.equal(resolveVrmaUrl('default', bundled), null);
  assert.equal(resolveVrmaUrl('rest', bundled), null);
  assert.equal(resolveVrmaUrl('anything', []), null);
});

// `playSequence` does `ids.map(resolver)`, which passes (value, index, array).
// A bare two-arity `resolveVrmaUrl` would take the index as its catalog and
// resolve nothing — the whole reason this factory exists.
test('createVrmaResolver survives being mapped over an array', () => {
  const resolve = createVrmaResolver(bundled);

  assert.deepEqual(['vrma-02', 'vrma-06', 'vrma-01'].map(resolve), ['/b.vrma', '/c.vrma', '/a.vrma']);
  assert.equal(resolve('vrma-01', 99, ['ignored']), '/a.vrma');
});

test('getSelectableAnimations hides only explicit opt-outs', () => {
  assert.deepEqual(
    getSelectableAnimations(bundled).map((entry) => entry.id),
    ['default', 'vrma-01', 'vrma-02', 'vrma-06'],
  );
  assert.equal(getSelectableAnimations(custom).length, 2);
  assert.deepEqual(getSelectableAnimations([]), []);
  // Absent `selectable` means shown; only `false` hides.
  assert.equal(getSelectableAnimations([{ id: 'x', source: 'vrma' }]).length, 1);
});

test('resolveAnimationId keeps a still-present selection', () => {
  assert.equal(resolveAnimationId(custom, 'lib-anim-victory-bbb'), 'lib-anim-victory-bbb');
  assert.equal(resolveAnimationId(bundled, 'default'), 'default');
});

test('resolveAnimationId falls back to the first selectable clip', () => {
  // Saved a bundled id, then switched the folder to Custom.
  assert.equal(resolveAnimationId(custom, 'vrma-06'), 'lib-anim-my_wave-aaa');
  // Saved clip deleted from the folder since last launch.
  assert.equal(resolveAnimationId([custom[1]], 'lib-anim-my_wave-aaa'), 'lib-anim-victory-bbb');
  // rest is not selectable, so it is never handed back as a selection.
  assert.equal(resolveAnimationId([restAnimation], 'gone'), defaultAnimationId);
  assert.equal(resolveAnimationId([], 'gone'), defaultAnimationId);
});
