import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { eventToChord, isTypingTarget } from './chords';
import {
  addCard,
  bindChord,
  clearUnavailable,
  findCardForChord,
  healDeckIds,
  removeCard,
  resolveDeck,
  unbindChord,
} from './motionDeck';

/**
 * Owns every key press the deck cares about — firing a card and recording a
 * binding are the same listener, so a key can never do both at once.
 *
 * The deck itself lives in `AvatarStage`, because it is persisted with the rest
 * of the settings; everything else about it is in this folder.
 *
 * @param {Object} args
 * @param {import('./motionDeck').MotionCard[]} args.deck
 * @param {(next: import('./motionDeck').MotionCard[]) => void} args.onDeckChange
 * @param {import('../config/animationLookup').AnimationEntry[]} args.animationCatalog
 * @param {(command: string, payload?: unknown) => { ok: boolean, error?: string }} args.runCommand
 */
export function useMotionDeck({ deck, onDeckChange, animationCatalog, runCommand }) {
  const [recordingIndex, setRecordingIndex] = useState(null);
  const [notice, setNotice] = useState(null);

  // Read by the listener below, which is bound once — everything it reads
  // changes far more often than it does.
  const deckRef = useRef(deck);
  const catalogRef = useRef(animationCatalog);
  const runCommandRef = useRef(runCommand);
  const onDeckChangeRef = useRef(onDeckChange);
  const recordingRef = useRef(null);

  deckRef.current = deck;
  catalogRef.current = animationCatalog;
  runCommandRef.current = runCommand;
  onDeckChangeRef.current = onDeckChange;
  recordingRef.current = recordingIndex;

  const cards = useMemo(() => resolveDeck(deck, animationCatalog), [deck, animationCatalog]);

  // A moved folder mints new ids for the same files. `healDeckIds` returns the
  // same array when there is nothing to do, so this cannot loop.
  useEffect(() => {
    const healed = healDeckIds(deck, animationCatalog);
    if (healed !== deck) onDeckChange(healed);
  }, [deck, animationCatalog, onDeckChange]);

  const fire = useCallback((card) => {
    if (!card) return;
    const result = runCommandRef.current('animation.play', {
      id: card.animationId,
      mode: 'once',
    });
    if (!result?.ok) setNotice(result?.error ?? 'That motion is not available right now.');
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      const recording = recordingRef.current;

      if (recording !== null) {
        // Swallow everything while recording: the next key is the binding, not
        // a shortcut, and not text for whatever had focus.
        event.preventDefault();
        event.stopPropagation();

        if (event.key === 'Escape') {
          setRecordingIndex(null);
          return;
        }

        const chord = eventToChord(event);
        if (!chord) return;

        const result = bindChord(deckRef.current, recording, chord);
        setRecordingIndex(null);
        if (!result.chord) {
          setNotice('That key cannot be used on its own.');
          return;
        }
        onDeckChangeRef.current(result.deck);
        setNotice(
          result.stolenFrom ? `${result.chord} moved here from ${result.stolenFrom}.` : null,
        );
        return;
      }

      // Held keys would machine-gun the mixer; one press is one gesture.
      if (event.repeat || isTypingTarget(event.target)) return;

      const chord = eventToChord(event);
      if (!chord) return;

      const card = findCardForChord(deckRef.current, chord);
      if (!card) return;

      event.preventDefault();
      fire(card);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fire]);

  // Recording waits for a key that may never come — losing focus must not leave
  // the deck swallowing every keystroke.
  useEffect(() => {
    if (recordingIndex === null) return undefined;
    const stop = () => setRecordingIndex(null);
    window.addEventListener('blur', stop);
    return () => window.removeEventListener('blur', stop);
  }, [recordingIndex]);

  const actions = useMemo(
    () => ({
      add(entry) {
        const next = addCard(deckRef.current, entry);
        if (next === deckRef.current) return;
        setNotice(null);
        onDeckChangeRef.current(next);
      },
      remove(index) {
        setNotice(null);
        // Indexes shift: a pending binding must follow its card, or be dropped
        // with it, rather than land on whichever card slid into that slot.
        setRecordingIndex((current) => {
          if (current === null || current === index) return null;
          return current > index ? current - 1 : current;
        });
        onDeckChangeRef.current(removeCard(deckRef.current, index));
      },
      record(index) {
        setNotice(null);
        setRecordingIndex((current) => (current === index ? null : index));
      },
      // The panel owns the only indication that recording is on, so it has to
      // end when the panel does — otherwise the listener below silently
      // swallows every key press in the app.
      cancelRecording() {
        setRecordingIndex(null);
      },
      unbind(index, chord) {
        setNotice(null);
        onDeckChangeRef.current(unbindChord(deckRef.current, index, chord));
      },
      clearMissing() {
        setNotice(null);
        onDeckChangeRef.current(clearUnavailable(deckRef.current, catalogRef.current));
      },
      play(index) {
        fire(deckRef.current[index]);
      },
      dismissNotice() {
        setNotice(null);
      },
    }),
    [fire],
  );

  return { cards, recordingIndex, notice, actions };
}
