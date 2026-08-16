import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_CARDS,
  addCard,
  bindChord,
  clearUnavailable,
  findCardForChord,
  healDeckIds,
  normalizeMotionDeck,
  removeCard,
  resolveDeck,
  unbindChord,
} from './motionDeck.js';

const bundled = [
  { id: 'default', label: 'Default', source: 'sequence', intro: [], sequence: [], selectable: true },
  { id: 'vrma-03', label: 'Peace Sign', source: 'vrma', vrmaUrl: '/c.vrma', selectable: true },
  { id: 'vrma-05', label: 'Spin', source: 'vrma', vrmaUrl: '/s.vrma', selectable: true },
];

/** The same two files after the folder they live in was renamed. */
const folderA = [
  { id: 'lib-anim-wave-aaa', label: 'wave', source: 'vrma', vrmaUrl: 'blob:1', selectable: true },
  { id: 'lib-anim-bow-bbb', label: 'bow', source: 'vrma', vrmaUrl: 'blob:2', selectable: true },
];
const folderAMoved = [
  { id: 'lib-anim-wave-zzz', label: 'wave', source: 'vrma', vrmaUrl: 'blob:3', selectable: true },
  { id: 'lib-anim-bow-yyy', label: 'bow', source: 'vrma', vrmaUrl: 'blob:4', selectable: true },
];

const deckOf = (...cards) => cards.map((card) => ({ label: '', keys: [], ...card }));

test('normalizeMotionDeck keeps cards a catalog cannot explain', () => {
  // The whole point: switching Directories → Animations swaps the catalog, and
  // the deck has to survive being switched back.
  const deck = normalizeMotionDeck([
    { animationId: 'vrma-03', label: 'Peace Sign', keys: ['F3'] },
    { animationId: 'lib-anim-wave-aaa', label: 'wave', keys: ['F4'] },
  ]);
  assert.equal(deck.length, 2);
  assert.deepEqual(deck.map((card) => card.animationId), ['vrma-03', 'lib-anim-wave-aaa']);
});

test('normalizeMotionDeck repairs a hand-edited file', () => {
  const deck = normalizeMotionDeck([
    null,
    'nonsense',
    { keys: ['F1'] },
    { animationId: '   ' },
    { animationId: 'vrma-03', keys: ['ctrl+shift+p', 'Escape', 'A+B', 4, 'F3', 'F3'] },
    { animationId: 'vrma-05', label: 7, keys: 'F5' },
  ]);

  assert.deepEqual(deck, [
    { animationId: 'vrma-03', label: '', keys: ['Ctrl+Shift+P', 'F3'] },
    { animationId: 'vrma-05', label: '', keys: [] },
  ]);
});

test('normalizeMotionDeck lets one card own a chord', () => {
  // Two cards holding the same chord would fire an arbitrary one.
  const deck = normalizeMotionDeck([
    { animationId: 'vrma-03', keys: ['F3'] },
    { animationId: 'vrma-05', keys: ['F3', 'F5'] },
  ]);
  assert.deepEqual(deck[0].keys, ['F3']);
  assert.deepEqual(deck[1].keys, ['F5']);
});

test('normalizeMotionDeck bounds an absurd file without capping a real deck', () => {
  // No product limit: a deck accumulates across animation folders, so a user
  // can legitimately hold far more cards than they have keys for.
  const plenty = Array.from({ length: 40 }, (_, index) => ({ animationId: `id-${index}` }));
  assert.equal(normalizeMotionDeck(plenty).length, 40);

  const absurd = Array.from({ length: MAX_CARDS + 5 }, (_, index) => ({ animationId: `id-${index}` }));
  assert.equal(normalizeMotionDeck(absurd).length, MAX_CARDS);
  assert.deepEqual(normalizeMotionDeck('not a deck'), []);
});

test('resolveDeck reports availability without changing the deck', () => {
  const deck = deckOf(
    { animationId: 'vrma-03', label: 'Peace Sign' },
    { animationId: 'lib-anim-wave-aaa', label: 'wave' },
    { animationId: 'default', label: 'Default' },
  );
  const resolved = resolveDeck(deck, bundled);

  assert.deepEqual(resolved.map((card) => card.available), [true, false, false]);
  // A sequence resolves to an entry but is still not firable as a one-shot.
  assert.equal(resolved[2].entry?.id, 'default');
  assert.equal(deck.length, 3);
});

test('healDeckIds re-points a card at the same clip in a moved folder', () => {
  const deck = deckOf({ animationId: 'lib-anim-wave-aaa', label: 'wave', keys: ['F4'] });
  const healed = healDeckIds(deck, folderAMoved);

  assert.equal(healed[0].animationId, 'lib-anim-wave-zzz');
  assert.deepEqual(healed[0].keys, ['F4']);
  // Untouched when the id still resolves, and the same array so the autosave
  // has nothing to write.
  assert.equal(healDeckIds(deck, folderA), deck);
  assert.equal(healDeckIds(deck, bundled), deck);
});

test('healDeckIds will not guess between two clips with one name', () => {
  const twoWaves = [
    ...folderAMoved,
    { id: 'lib-anim-wave-www', label: 'wave', source: 'vrma', vrmaUrl: 'blob:5', selectable: true },
  ];
  const deck = deckOf({ animationId: 'lib-anim-wave-aaa', label: 'wave' });
  assert.equal(healDeckIds(deck, twoWaves), deck);
});

test('addCard remembers the label', () => {
  const deck = addCard([], bundled[1]);
  assert.deepEqual(deck, [{ animationId: 'vrma-03', label: 'Peace Sign', keys: [] }]);

  const absurd = Array.from({ length: MAX_CARDS }, (_, index) => ({
    animationId: `id-${index}`,
    label: '',
    keys: [],
  }));
  assert.equal(addCard(absurd, bundled[2]), absurd);
});

test('bindChord takes the chord off whatever card had it', () => {
  const deck = deckOf(
    { animationId: 'vrma-03', label: 'Peace Sign', keys: ['F3'] },
    { animationId: 'vrma-05', label: 'Spin' },
  );

  const result = bindChord(deck, 1, 'f3');
  assert.equal(result.chord, 'F3');
  assert.equal(result.stolenFrom, 'Peace Sign');
  assert.deepEqual(result.deck[0].keys, []);
  assert.deepEqual(result.deck[1].keys, ['F3']);

  // Nothing to steal, nothing to report.
  assert.equal(bindChord(deck, 1, 'F5').stolenFrom, null);
  // A card can hold more than one chord, and cannot hold one twice.
  assert.deepEqual(bindChord(deck, 0, 'F3').deck[0].keys, ['F3']);
});

test('bindChord refuses what could never be matched', () => {
  const deck = deckOf({ animationId: 'vrma-03', keys: ['F3'] });
  for (const [index, chord] of [[0, 'Escape'], [0, ''], [9, 'F5'], [-1, 'F5']]) {
    const result = bindChord(deck, index, chord);
    assert.equal(result.deck, deck);
    assert.equal(result.chord, null);
  }
});

test('unbindChord and removeCard touch one card', () => {
  const deck = deckOf(
    { animationId: 'vrma-03', keys: ['F3', 'F4'] },
    { animationId: 'vrma-05', keys: ['F5'] },
  );
  assert.deepEqual(unbindChord(deck, 0, 'F3')[0].keys, ['F4']);
  assert.deepEqual(unbindChord(deck, 0, 'F3')[1].keys, ['F5']);
  assert.deepEqual(removeCard(deck, 0).map((card) => card.animationId), ['vrma-05']);
  assert.equal(removeCard(deck, 4), deck);
});

test('clearUnavailable is the only sweep, and only for what cannot resolve', () => {
  const deck = deckOf(
    { animationId: 'vrma-03' },
    { animationId: 'lib-anim-wave-aaa' },
    { animationId: 'default' },
  );
  assert.deepEqual(
    clearUnavailable(deck, bundled).map((card) => card.animationId),
    ['vrma-03'],
  );
  assert.equal(clearUnavailable(deckOf({ animationId: 'vrma-03' }), bundled).length, 1);

  // A custom folder is scanned asynchronously, so on launch the catalog is
  // briefly empty and every card is unresolvable. Sweeping then would take the
  // whole deck, and the autosave would make that permanent.
  assert.equal(clearUnavailable(deck, []), deck);
  assert.equal(clearUnavailable(deck, null), deck);
});

test('findCardForChord is how a key press reaches a clip', () => {
  const deck = deckOf(
    { animationId: 'vrma-03', keys: ['F3'] },
    { animationId: 'vrma-05', keys: ['Ctrl+Shift+P'] },
  );
  assert.equal(findCardForChord(deck, 'Ctrl+Shift+P')?.animationId, 'vrma-05');
  assert.equal(findCardForChord(deck, 'F9'), null);
  assert.equal(findCardForChord(deck, ''), null);
});
