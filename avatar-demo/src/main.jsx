import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/desktop.css';
import { enableDesktopMode } from './lib/desktopMode';
import App from './App.jsx';

enableDesktopMode();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
