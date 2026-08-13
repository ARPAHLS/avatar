import { useEffect, useState } from 'react';
import { getEnvironmentThumbnail } from '../../lib/environmentThumbnails';

/**
 * A custom-folder environment tile.
 *
 * The picker used to point straight at the full-size image, which for a folder
 * of gifs meant decoding and animating every one of them inside a 40px box.
 * Each tile now draws a poster that is generated once and cached to disk, the
 * same arrangement MiniAvatar uses for portraits. Only the environment actually
 * selected loads its real bytes, and only on the stage.
 */
export function MiniEnvironment({ entry, selected, onClick }) {
  const [src, setSrc] = useState(null);
  const { id, fileName } = entry;

  useEffect(() => {
    let cancelled = false;
    setSrc(null);

    // Deliberately not keyed on `entry`: selecting an environment replaces that
    // object to carry its loaded source, and re-running here would drop the
    // tile back to its placeholder — a flicker in the picker, of all places.
    void getEnvironmentThumbnail({ id, fileName }).then((url) => {
      if (!cancelled) setSrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [id, fileName]);

  return (
    <button
      type="button"
      className={`background-thumb ${selected ? 'background-thumb--selected' : ''}`}
      onClick={onClick}
      title={entry.label}
    >
      {src ? (
        <img src={src} alt={entry.label} loading="lazy" />
      ) : (
        // First sight of an image still costs one decode to generate from.
        <span className="background-thumb__pending" aria-label={`${entry.label} loading`} />
      )}
      <span className="background-thumb__label">{entry.label}</span>
    </button>
  );
}
