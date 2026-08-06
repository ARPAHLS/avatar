import { useEffect, useState } from 'react';
import { getLibraryThumbnail } from '../../lib/thumbnails';

/**
 * A picker thumbnail. This used to be a live <Canvas> per avatar, which meant
 * Appearance parsed every VRM in the catalog — seconds of blocked main thread —
 * to draw a handful of 56px circles. The portrait is static either way, so it
 * is now an image: bundled avatars ship one, user-folder avatars render theirs
 * once and keep it on disk.
 */
export function MiniAvatar({ entry, selected, onClick }) {
  const [src, setSrc] = useState(entry.thumbnail ?? null);

  useEffect(() => {
    if (entry.thumbnail) {
      setSrc(entry.thumbnail);
      return undefined;
    }

    let cancelled = false;
    setSrc(null);
    const previewPath =
      entry.skins.find((skin) => skin.id === 'default')?.path ?? entry.skins[0]?.path;
    if (!previewPath) return undefined;

    void getLibraryThumbnail({ id: entry.id, path: previewPath }).then((url) => {
      if (!cancelled) setSrc(url);
    });

    return () => {
      cancelled = true;
    };
  }, [entry.id, entry.thumbnail, entry.skins]);

  return (
    <div
      onClick={onClick}
      className={`mini-avatar ${selected ? 'mini-avatar--selected' : ''}`}
      role="button"
      tabIndex={0}
      title={entry.label}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
    >
      <div className="mini-avatar__canvas-wrap">
        {src ? (
          <img className="mini-avatar__image" src={src} alt={entry.label} />
        ) : (
          // First sight of a user's .vrm still costs one parse to render from.
          // Thumbnails are generated one at a time, so the rest of the picker
          // stays interactive while these fill in.
          <span className="mini-avatar__pending" aria-label={`${entry.label} loading`} />
        )}
      </div>
    </div>
  );
}
