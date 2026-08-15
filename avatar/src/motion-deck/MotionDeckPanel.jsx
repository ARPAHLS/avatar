import { useEffect, useMemo, useState } from 'react';
import { Play, Plus, Search, X } from 'lucide-react';
import { getSelectableAnimations } from '../config/animations';
import './motionDeck.css';

// Below this the filter is noise: you can see the whole deck at once.
const FILTER_THRESHOLD = 5;

/**
 * Settings → Motion. The deck is a shortlist the user builds, not a view of the
 * catalog, so this panel never grows with the animation folder.
 *
 * One row per clip inside a single surface, rather than a card each: a deck of
 * twenty is a list you scan for a name, and the pairing of name to chord is the
 * only thing on it worth reading.
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
  const [filter, setFilter] = useState('');

  // Closing the drawer unmounts this while recording may still be armed, and
  // the pill saying so goes with it.
  useEffect(() => actions.cancelRecording, [actions]);

  // Every action addresses a card by its index in the deck, so the filter has to
  // carry the original one — a filtered row must not fire whichever card
  // happens to sit at that position in the visible list.
  const rows = useMemo(() => {
    const numbered = cards.map((card, index) => ({ card, index }));
    const folded = filter.trim().toLowerCase();
    if (folded === '') return numbered;
    return numbered.filter(({ card }) =>
      (card.entry?.label || card.label || card.animationId).toLowerCase().includes(folded),
    );
  }, [cards, filter]);

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

      {cards.length === 0 ? (
        !adding && <p className="panel-note panel-note--compact">No motions on the deck yet.</p>
      ) : (
        <div className="motion-deck__table">
          {cards.length > FILTER_THRESHOLD && (
            <div className="motion-deck__filter">
              <Search size={12} strokeWidth={2.5} />
              <input
                type="text"
                className="motion-deck__filter-input"
                placeholder={`Filter ${cards.length} motions…`}
                value={filter}
                // A key press while recording is the binding, wherever the caret
                // is — arming the filter box would eat the first letter typed.
                onFocus={actions.cancelRecording}
                onChange={(event) => setFilter(event.target.value)}
              />
              {filter !== '' && (
                <button
                  type="button"
                  className="motion-deck__filter-clear"
                  aria-label="Clear filter"
                  onClick={() => setFilter('')}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          <div className="motion-deck__rows">
            {rows.map(({ card, index }) => (
              <div
                key={`${card.animationId}-${index}`}
                className={`motion-deck__row ${card.available ? '' : 'motion-deck__row--missing'}`}
              >
                <button
                  type="button"
                  className="motion-deck__play"
                  disabled={!card.available}
                  title={card.available ? 'Play once' : undefined}
                  onClick={() => actions.play(index)}
                >
                  <Play size={11} strokeWidth={2.5} />
                  <span className="motion-deck__label">
                    {card.entry?.label || card.label || card.animationId}
                  </span>
                  {!card.available && (
                    <span
                      className="motion-deck__badge"
                      title="Not in the current animations folder. Its keys stay reserved."
                    >
                      unavailable
                    </span>
                  )}
                </button>

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

                <button
                  type="button"
                  className="motion-deck__remove"
                  aria-label={`Remove ${card.label || card.animationId}`}
                  onClick={() => actions.remove(index)}
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {rows.length === 0 && (
              <p className="panel-note panel-note--compact motion-deck__empty">
                No motion on the deck matches “{filter.trim()}”.
              </p>
            )}
          </div>
        </div>
      )}

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
        <>
          <p className="panel-note panel-note--compact">
            Unavailable motions are not in the current animations folder. They keep their keys
            reserved and come back when the folder does.
          </p>
          <button
            type="button"
            className="panel-button panel-button--danger"
            onClick={actions.clearMissing}
          >
            Clear unavailable
          </button>
        </>
      )}
    </div>
  );
}
