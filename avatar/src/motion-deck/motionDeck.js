/**
 * The Motion Deck: a user-built list of clips that can be fired without changing
 * what the Animations menu is set to. See README.md for why it works this way.
 *
 * The deck is authored, so nothing here drops a card because the catalog
 * changed — cards resolve against the live catalog when drawn and when fired.
 *
 * Free of React and asset imports so `node --test` can load it.
 */

import { normalizeChord } from './chords.js';

/** @typedef {import('../config/animationLookup.js').AnimationEntry} AnimationEntry */

/**
 * @typedef {Object} MotionCard
 * @property {string} animationId
 * @property {string} label Remembered from when the card was added, so an
 * unavailable card can say what it was — and can heal itself, see `healDeckIds`.
 * @property {string[]} keys
 */

/**
 * Not a product limit: a card costs nothing and the deck accumulates across
 * folders on purpose. This only stops a mangled file reaching the panel.
 */
export const MAX_CARDS = 200;

/** @returns {MotionCard[]} */
export function createEmptyDeck() {
  return [];
}

/**
 * Shape only — never filtered against a catalog. See the note at the top.
 * @param {unknown} raw
 * @returns {MotionCard[]}
 */
export function normalizeMotionDeck(raw) {
  if (!Array.isArray(raw)) return [];

  /** @type {MotionCard[]} */
  const deck = [];
  // A chord that matched two cards would fire an arbitrary one, so the first
  // card to claim it keeps it — including across a hand-edited file.
  const claimed = new Set();

  for (const entry of raw) {
    if (deck.length >= MAX_CARDS) break;
    if (!entry || typeof entry !== 'object') continue;

    const source = /** @type {Record<string, unknown>} */ (entry);
    const animationId = typeof source.animationId === 'string' ? source.animationId.trim() : '';
    if (!animationId) continue;

    const keys = [];
    if (Array.isArray(source.keys)) {
      for (const value of source.keys) {
        const chord = normalizeChord(value);
        if (!chord || claimed.has(chord)) continue;
        claimed.add(chord);
        keys.push(chord);
      }
    }

    deck.push({
      animationId,
      label: typeof source.label === 'string' ? source.label : '',
      keys,
    });
  }

  return deck;
}

/**
 * @param {MotionCard[]} deck
 * @param {AnimationEntry[]} catalog
 * @returns {Array<MotionCard & { entry: AnimationEntry | null, available: boolean }>}
 */
export function resolveDeck(deck, catalog) {
  const list = Array.isArray(catalog) ? catalog : [];
  return deck.map((card) => {
    // Id-exact, never by label: a card pointing at a different clip that happens
    // to share a label is worse than one that says it is missing.
    const entry = list.find((item) => item.id === card.animationId) ?? null;
    return {
      ...card,
      entry,
      available: Boolean(entry && entry.source === 'vrma' && entry.vrmaUrl),
    };
  });
}

/**
 * Re-point cards whose id no longer resolves at a clip with the same label: a
 * custom folder's ids hash the absolute path, so moving or renaming the folder
 * invalidates all of them while the file names stay put.
 *
 * A unique match only — two folders can each hold `wave.vrma`. Returns the same
 * array when nothing changed, so it cannot churn the autosave.
 *
 * @param {MotionCard[]} deck
 * @param {AnimationEntry[]} catalog
 * @returns {MotionCard[]}
 */
export function healDeckIds(deck, catalog) {
  const list = Array.isArray(catalog) ? catalog : [];
  if (deck.length === 0 || list.length === 0) return deck;

  let changed = false;
  const healed = deck.map((card) => {
    if (list.some((item) => item.id === card.animationId)) return card;

    const label = card.label.trim().toLowerCase();
    if (!label) return card;

    const matches = list.filter(
      (item) => typeof item.label === 'string' && item.label.trim().toLowerCase() === label,
    );
    if (matches.length !== 1) return card;

    changed = true;
    return { ...card, animationId: matches[0].id };
  });

  return changed ? healed : deck;
}

/**
 * @param {MotionCard[]} deck
 * @param {AnimationEntry} entry
 * @returns {MotionCard[]} the same array when there is nothing to add
 */
export function addCard(deck, entry) {
  if (deck.length >= MAX_CARDS || !entry?.id) return deck;
  return [...deck, { animationId: entry.id, label: entry.label ?? '', keys: [] }];
}

/**
 * @param {MotionCard[]} deck
 * @param {number} index
 */
export function removeCard(deck, index) {
  if (index < 0 || index >= deck.length) return deck;
  return deck.filter((_, position) => position !== index);
}

/**
 * Bind a chord, taking it off whatever card had it. Stealing rather than
 * warning or blocking: two cards holding one chord has no defined behaviour,
 * and refusing throws away what the user just pressed. The card that lost it
 * comes back in `stolenFrom` so the panel can name it.
 *
 * @param {MotionCard[]} deck
 * @param {number} index
 * @param {string} chord already normalized, or raw from a recording
 * @returns {{ deck: MotionCard[], chord: string | null, stolenFrom: string | null }}
 */
export function bindChord(deck, index, chord) {
  const normalized = normalizeChord(chord);
  if (!normalized || index < 0 || index >= deck.length) {
    return { deck, chord: null, stolenFrom: null };
  }

  let stolenFrom = null;
  const next = deck.map((card, position) => {
    if (position === index) return card;
    if (!card.keys.includes(normalized)) return card;
    stolenFrom = card.label || card.animationId;
    return { ...card, keys: card.keys.filter((key) => key !== normalized) };
  });

  const target = next[index];
  if (!target.keys.includes(normalized)) {
    next[index] = { ...target, keys: [...target.keys, normalized] };
  }

  return { deck: next, chord: normalized, stolenFrom };
}

/**
 * @param {MotionCard[]} deck
 * @param {number} index
 * @param {string} chord
 */
export function unbindChord(deck, index, chord) {
  if (index < 0 || index >= deck.length) return deck;
  return deck.map((card, position) =>
    position === index ? { ...card, keys: card.keys.filter((key) => key !== chord) } : card,
  );
}

/**
 * The one sweep that removes cards, and only when the user asks for it.
 *
 * An empty catalog is not an answer: a custom folder is scanned asynchronously,
 * so on launch every card is briefly unresolvable. Sweeping then would delete
 * the whole deck and the autosave would make it permanent.
 *
 * @param {MotionCard[]} deck
 * @param {AnimationEntry[]} catalog
 */
export function clearUnavailable(deck, catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) return deck;

  const resolved = resolveDeck(deck, catalog);
  const kept = deck.filter((_, index) => resolved[index].available);
  return kept.length === deck.length ? deck : kept;
}

/**
 * @param {MotionCard[]} deck
 * @param {string} chord
 * @returns {MotionCard | null}
 */
export function findCardForChord(deck, chord) {
  if (!chord) return null;
  return deck.find((card) => card.keys.includes(chord)) ?? null;
}
