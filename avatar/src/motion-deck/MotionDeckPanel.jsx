import { useEffect, useMemo, useState } from 'react';
import { Play, Plus, X } from 'lucide-react';
import { getSelectableAnimations } from '../config/animations';
import './motionDeck.css';

/**
 * Settings → Motion. The deck is a shortlist the user builds, not a view of the
 * catalog, so this panel never grows with the animation folder.
 *
 * @param {Object} props
 * @param {ReturnType<typeof import('./useMotionDeck').useMotionDeck>['cards']} props.cards
 * @param {number | null} props.recordingIndex
 * @param {string | null} props.notice
 * @param {ReturnType<typeof import('./useMotionDeck').useMotionDeck>['actions']} props.actions
 * @param {import('../config/animationLookup').AnimationEntry[]} props.animationCatalog
 */
export function MotionDeckPanel({
  cards,
  recordingIndex,
  notice,
  actions,
  animationCatalog,
}) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');

  // Closing the drawer unmounts this while recording may still be armed, and
  // the pill saying so goes with it.
  useEffect(() => actions.cancelRecording, [actions]);

  // Only single clips: the Default sequence loops for as long as it is
  // selected, so it has no last frame at which the selection could come back.
  const options = useMemo(() => {
    const playable = getSelectableAnimations(animationCatalog).filter(
      (entry) => entry.source === 'vrma' && entry.vrmaUrl,
    );
    const inDeck = new Set(cards.map((card) => card.animationId));
    const folded = query.trim().toLowerCase();
    return playable.filter(
      (entry) =>
        !inDeck.has(entry.id) && (folded === '' || entry.label.toLowerCase().includes(folded)),
    );
  }, [animationCatalog, cards, query]);

  // Not while the catalog is empty: a custom folder is still being scanned, so
  // every card reads as unavailable and the sweep would take the lot.
  const hasMissing = animationCatalog.length > 0 && cards.some((card) => !card.available);

  function closePicker() {
    setAdding(false);
    setQuery('');
  }

  return (
    <div className="motion-deck">
      <p className="panel-note panel-note--compact">
        Motions you can fire without changing what Gear → Animations is set to. Each one plays
        once, then the selection comes back. Keys work while the AVATAR window has focus.
      </p>

      {notice && (
        <div className="motion-deck__notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="motion-deck__notice-close"
            aria-label="Dismiss"
            onClick={actions.dismissNotice}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {cards.length === 0 && !adding && (
        <p className="panel-note panel-note--compact">No motions on the deck yet.</p>
      )}

      <div className="motion-deck__cards">
        {cards.map((card, index) => (
          <div
            key={`${card.animationId}-${index}`}
            className={`motion-deck__card ${card.available ? '' : 'motion-deck__card--missing'}`}
          >
            <div className="motion-deck__card-head">
              <button
                type="button"
                className="motion-deck__play"
                disabled={!card.available}
                title={card.available ? 'Play once' : undefined}
                onClick={() => actions.play(index)}
              >
                <Play size={12} strokeWidth={2.5} />
                <span className="motion-deck__label">{card.entry?.label || card.label || card.animationId}</span>
              </button>
              <button
                type="button"
                className="motion-deck__remove"
                aria-label={`Remove ${card.label || card.animationId}`}
                onClick={() => actions.remove(index)}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>

            {!card.available && (
              <span className="motion-deck__missing">
                Unavailable — not in the current animations folder. Its keys stay reserved.
              </span>
            )}

            <div className="motion-deck__keys">
              {card.keys.map((chord) => (
                <button
                  key={chord}
                  type="button"
                  className="motion-deck__key"
                  title="Click to clear"
                  onClick={() => actions.unbind(index, chord)}
                >
                  {chord}
                </button>
              ))}
              <button
                type="button"
                className={`motion-deck__bind ${
                  recordingIndex === index ? 'motion-deck__bind--recording' : ''
                }`}
                onClick={() => actions.record(index)}
              >
                {recordingIndex === index ? 'Press a key…' : '+ Key'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="motion-deck__picker">
          <input
            type="text"
            className="motion-deck__search"
            placeholder="Search animations…"
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="motion-deck__options">
            {options.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="motion-deck__option"
                onClick={() => {
                  actions.add(entry);
                  closePicker();
                }}
              >
                {entry.label}
              </button>
            ))}
            {options.length === 0 && (
              <p className="panel-note panel-note--compact">Nothing left to add.</p>
            )}
          </div>
          <button type="button" className="panel-button" onClick={closePicker}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="panel-actions">
          <button type="button" className="panel-button" onClick={() => setAdding(true)}>
            <Plus size={14} strokeWidth={2.5} />
            Add motion
          </button>
        </div>
      )}

      {hasMissing && (
        <button type="button" className="panel-button panel-button--danger" onClick={actions.clearMissing}>
          Clear unavailable
        </button>
      )}
    </div>
  );
}
