import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/desktop.css';
import { enableDesktopMode } from './lib/desktopMode';
import App from './App.jsx';

enableDesktopMode();

// Dev-only asset generation (npm run thumbs): render the bundled avatars'
// portraits and exit, without mounting the app.
if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('genthumbs')) {
  import('./lib/generateBundledThumbnails').then(({ generateBundledThumbnails }) =>
    generateBundledThumbnails(),
  );
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
