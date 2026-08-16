import assert from 'node:assert/strict';
import test from 'node:test';
import { eventToChord, isTypingTarget, normalizeChord } from './chords.js';

/** @param {Partial<KeyboardEvent>} props */
function keyEvent(props) {
  return { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...props };
}

test('eventToChord names the physical key, not the character it produces', () => {
  assert.equal(eventToChord(keyEvent({ code: 'KeyW' })), 'W');
  // Shift would make `event.key` "W" and no modifier is implied by that alone —
  // the chord has to record the modifier explicitly.
  assert.equal(eventToChord(keyEvent({ code: 'KeyW', shiftKey: true })), 'Shift+W');
  assert.equal(eventToChord(keyEvent({ code: 'Digit1' })), '1');
  assert.equal(eventToChord(keyEvent({ code: 'Numpad1' })), 'Num1');
  assert.equal(eventToChord(keyEvent({ code: 'F3' })), 'F3');
});

test('eventToChord orders modifiers so a chord has one spelling', () => {
  const chord = eventToChord(keyEvent({ code: 'KeyP', metaKey: true, shiftKey: true, ctrlKey: true }));
  assert.equal(chord, 'Ctrl+Shift+Meta+P');
});

test('eventToChord refuses what cannot be a binding', () => {
  // A modifier on its own is a chord waiting for its key.
  assert.equal(eventToChord(keyEvent({ code: 'ShiftLeft', shiftKey: true })), null);
  assert.equal(eventToChord(keyEvent({ code: 'ControlRight', ctrlKey: true })), null);
  assert.equal(eventToChord(keyEvent({})), null);

  // Bare keys the app's own UI needs.
  for (const code of ['Escape', 'Tab', 'Enter', 'Space']) {
    assert.equal(eventToChord(keyEvent({ code })), null, `${code} should not bind bare`);
  }
  // Held with a modifier they are nobody else's.
  assert.equal(eventToChord(keyEvent({ code: 'Enter', ctrlKey: true })), 'Ctrl+Enter');
});

test('normalizeChord reads a hand-edited config', () => {
  assert.equal(normalizeChord('ctrl+shift+p'), 'Ctrl+Shift+P');
  assert.equal(normalizeChord(' Control + P '), 'Ctrl+P');
  assert.equal(normalizeChord('cmd+P'), 'Meta+P');
  assert.equal(normalizeChord('Shift+Ctrl+P'), 'Ctrl+Shift+P');
  assert.equal(normalizeChord('F3'), 'F3');
});

test('normalizeChord rejects what could never be matched', () => {
  for (const value of ['', '+', 'Ctrl', 'ctrl+alt', 'A+B', 'Escape', 3, null, undefined, {}]) {
    assert.equal(normalizeChord(value), null, `${JSON.stringify(value)} should not normalize`);
  }
});

test('normalizeChord keeps a token it does not recognise', () => {
  // Layout-specific codes (`IntlRo`, `Lang1`, media keys) are real recordings
  // this list does not enumerate. Keeping an unmatchable binding is a better
  // failure than dropping one the user actually pressed.
  assert.equal(normalizeChord('Ctrl+IntlRo'), 'Ctrl+IntlRo');
  assert.equal(normalizeChord('nonsense'), 'nonsense');
});

test('normalizeChord round-trips what eventToChord produces', () => {
  for (const event of [
    keyEvent({ code: 'KeyW' }),
    keyEvent({ code: 'Numpad1' }),
    keyEvent({ code: 'F3', ctrlKey: true, shiftKey: true }),
    keyEvent({ code: 'ArrowUp', altKey: true }),
  ]) {
    const chord = eventToChord(event);
    assert.equal(normalizeChord(chord), chord);
  }
});

test('isTypingTarget keeps the deck out of the way of typing', () => {
  assert.equal(isTypingTarget({ tagName: 'INPUT' }), true);
  assert.equal(isTypingTarget({ tagName: 'TEXTAREA' }), true);
  assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isTypingTarget({ tagName: 'DIV' }), false);
  assert.equal(isTypingTarget(null), false);
});
