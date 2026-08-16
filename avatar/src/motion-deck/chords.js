/**
 * Keyboard chords, as text.
 *
 * Keyed off `event.code`, not `event.key`: `key` changes with the modifier held
 * (`w` vs `W`), so one physical key would record and fire under two names.
 * Tokens are derived the same way when recording and when matching, so a chord
 * never has to be parsed back into a code.
 *
 * Free of React so `node --test` can load it.
 */

/** Canonical order, so one chord has exactly one spelling. */
const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'];

const MODIFIER_ALIASES = new Map([
  ['ctrl', 'Ctrl'],
  ['control', 'Ctrl'],
  ['alt', 'Alt'],
  ['option', 'Alt'],
  ['shift', 'Shift'],
  ['meta', 'Meta'],
  ['cmd', 'Meta'],
  ['command', 'Meta'],
  ['super', 'Meta'],
  ['win', 'Meta'],
]);

/** Codes that are only ever a modifier — never a chord's key on their own. */
const MODIFIER_CODE = /^(Control|Alt|Shift|Meta)(Left|Right)$/;

/** Bare keys the app's own UI needs. Held with a modifier they are fine. */
const RESERVED_BARE = new Set(['Escape', 'Tab', 'Enter', 'Space']);

/**
 * @param {string} code a `KeyboardEvent.code`
 * @returns {string} the token used in a chord
 */
function tokenFromCode(code) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num${code.slice(6)}`;
  return code;
}

/**
 * Every token `tokenFromCode` can produce that a person might also type into
 * config.yaml, so `ctrl+shift+p` and a recorded `Ctrl+Shift+P` are the same
 * binding. A token outside this list keeps the spelling it arrived with —
 * guessing at its casing would be a worse answer than leaving it alone.
 */
const CANONICAL_TOKENS = new Map(
  [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    ...'0123456789',
    ...Array.from({ length: 24 }, (_, index) => `F${index + 1}`),
    ...Array.from({ length: 10 }, (_, index) => `Num${index}`),
    'NumAdd', 'NumSubtract', 'NumMultiply', 'NumDivide', 'NumDecimal', 'NumEnter',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete', 'Backspace',
    'Backquote', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash',
    'Semicolon', 'Quote', 'Comma', 'Period', 'Slash', 'CapsLock',
    'Escape', 'Tab', 'Enter', 'Space',
  ].map((token) => [token.toLowerCase(), token]),
);

/**
 * @param {KeyboardEvent} event
 * @returns {string | null} null when the event cannot stand as a chord
 */
export function eventToChord(event) {
  const code = typeof event?.code === 'string' ? event.code : '';
  if (!code || MODIFIER_CODE.test(code)) return null;

  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Meta');

  const token = tokenFromCode(code);
  if (modifiers.length === 0 && RESERVED_BARE.has(token)) return null;

  return [...modifiers, token].join('+');
}

/**
 * Read a chord back from config.yaml, where it may have been hand-edited.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeChord(value) {
  if (typeof value !== 'string') return null;

  const parts = value.split('+').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const modifiers = new Set();
  let key = null;

  for (const part of parts) {
    const modifier = MODIFIER_ALIASES.get(part.toLowerCase());
    if (modifier) {
      modifiers.add(modifier);
      continue;
    }
    // Two keys in one chord is not a chord we can ever match.
    if (key) return null;
    key = CANONICAL_TOKENS.get(part.toLowerCase()) ?? part;
  }

  if (!key) return null;
  if (modifiers.size === 0 && RESERVED_BARE.has(key)) return null;

  return [...MODIFIER_ORDER.filter((name) => modifiers.has(name)), key].join('+');
}

/**
 * Whether a key event belongs to whoever is typing rather than to the deck.
 * @param {EventTarget | null} target
 */
export function isTypingTarget(target) {
  const element = /** @type {HTMLElement | null} */ (target);
  if (!element || typeof element.tagName !== 'string') return false;
  if (element.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
}
