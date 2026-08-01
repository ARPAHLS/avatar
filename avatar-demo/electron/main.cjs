const { app, BrowserWindow, ipcMain, screen, session, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const {
  loadSettings,
  saveSettings,
  resetSettings,
  getSettingsInfo,
} = require('./settingsStore.cjs');

const WINDOW_STATE_FILE = 'window-state.json';
const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 560;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const EDGE_MARGIN = 16;

let windowScale = 1;
let suppressPersist = false;

function getStatePath() {
  return path.join(app.getPath('userData'), WINDOW_STATE_FILE);
}

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(getStatePath(), 'utf8'));
  } catch {
    return null;
  }
}

function saveWindowState(state) {
  try {
    fs.writeFileSync(getStatePath(), JSON.stringify(state));
  } catch {
    // ignore persistence errors
  }
}

function readPersistedState() {
  const saved = loadWindowState();
  const defaults = defaultBounds();

  if (!saved) {
    return { bounds: defaults, overlayMode: true, windowScale: 1 };
  }

  const bounds = {
    width: saved.width ?? saved.bounds?.width ?? defaults.width,
    height: saved.height ?? saved.bounds?.height ?? defaults.height,
    x: saved.x ?? saved.bounds?.x ?? defaults.x,
    y: saved.y ?? saved.bounds?.y ?? defaults.y,
  };

  return {
    bounds,
    overlayMode: saved.overlayMode !== false,
    windowScale: normalizeScale(saved.windowScale),
  };
}

/** @param {number} value */
function normalizeScale(value) {
  if (value === 0.5 || value === 2) return value;
  return 1;
}

function scaledWindowSize(factor) {
  return {
    width: Math.round(DEFAULT_WIDTH * factor),
    height: Math.round(DEFAULT_HEIGHT * factor),
  };
}

function applyWindowScale(factor) {
  if (!mainWindow) return windowScale;

  const nextScale = normalizeScale(factor);
  const size = scaledWindowSize(nextScale);
  const minWidth = Math.round(DEFAULT_WIDTH * MIN_SCALE);
  const minHeight = Math.round(DEFAULT_HEIGHT * MIN_SCALE);

  mainWindow.setMinimumSize(minWidth, minHeight);
  mainWindow.setMaximumSize(0, 0);

  const bounds = mainWindow.getBounds();
  const centerX = bounds.x + bounds.width / 2;
  const bottomY = bounds.y + bounds.height;

  suppressPersist = true;
  mainWindow.webContents.setZoomFactor(nextScale);
  mainWindow.setBounds({
    x: Math.round(centerX - size.width / 2),
    y: bottomY - size.height,
    width: size.width,
    height: size.height,
  });

  windowScale = nextScale;
  persistWindowState();

  setTimeout(() => {
    suppressPersist = false;
  }, 400);

  return windowScale;
}

function defaultBounds() {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: workArea.x + EDGE_MARGIN,
    y: workArea.y + workArea.height - DEFAULT_HEIGHT - EDGE_MARGIN,
  };
}

/** @type {import('electron').BrowserWindow | null} */
let mainWindow = null;
/** @type {import('electron').BrowserWindow | null} */
let splashWindow = null;
let overlayMode = true;
let splashStartedAt = 0;
let splashDismissed = false;
const SPLASH_MIN_MS = 1800;

function getLogoPath() {
  return path.join(__dirname, '../public/AVATAR_LOGO_150.png');
}

function createSplashWindow() {
  splashDismissed = false;
  splashStartedAt = Date.now();

  splashWindow = new BrowserWindow({
    width: 280,
    height: 280,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    show: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Logo is read inside splash.html via Electron fs (asar-safe data URL).
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function revealMainWindow() {
  if (!mainWindow) return;
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

function finishSplashAndShowMain() {
  if (splashDismissed) {
    revealMainWindow();
    return;
  }

  const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - splashStartedAt));

  setTimeout(() => {
    if (splashDismissed) {
      revealMainWindow();
      return;
    }

    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.send('splash:finish');
      // Fallback if splash never replies (crash / old HTML)
      setTimeout(() => {
        if (!splashDismissed) {
          splashDismissed = true;
          if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
          revealMainWindow();
        }
      }, 2200);
      return;
    }

    splashDismissed = true;
    revealMainWindow();
  }, wait);
}

function applyOverlayMode(enabled) {
  overlayMode = Boolean(enabled);
  if (!mainWindow) return;

  if (overlayMode) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setBackgroundColor('#00000000');
    mainWindow.setHasShadow(true);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setBackgroundColor('#ebe3fa');
    mainWindow.setHasShadow(true);
  }
}

function persistWindowState() {
  if (!mainWindow) return;
  saveWindowState({
    ...mainWindow.getBounds(),
    bounds: mainWindow.getBounds(),
    overlayMode,
    windowScale,
  });
}

function createWindow() {
  const persisted = readPersistedState();
  const scale = persisted.windowScale ?? 1;
  const scaledSize = scaledWindowSize(scale);
  const bounds = persisted.bounds;
  overlayMode = persisted.overlayMode;
  windowScale = scale;

  const minWidth = Math.round(DEFAULT_WIDTH * MIN_SCALE);
  const minHeight = Math.round(DEFAULT_HEIGHT * MIN_SCALE);

  mainWindow = new BrowserWindow({
    width: scaledSize.width,
    height: scaledSize.height,
    x: bounds.x,
    y: bounds.y,
    minWidth,
    minHeight,
    icon: path.join(__dirname, '../public/AVATAR_LOGO_150.png'),
    transparent: true,
    frame: false,
    alwaysOnTop: overlayMode,
    resizable: true,
    hasShadow: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  applyOverlayMode(overlayMode);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.setZoomFactor(windowScale);
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const desktopQuery = { query: { desktop: '1' } };

  if (devUrl) {
    const url = devUrl.includes('desktop=1')
      ? devUrl
      : `${devUrl}${devUrl.includes('?') ? '&' : '?'}desktop=1`;
    mainWindow.loadURL(url);
  } else if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex, desktopQuery);
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173/?desktop=1');
  }

  setTimeout(() => {
    finishSplashAndShowMain();
  }, 12000);

  let saveTimer;
  const persistBounds = () => {
    if (suppressPersist) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistWindowState, 250);
  };

  mainWindow.on('move', persistBounds);
  mainWindow.on('resize', persistBounds);
  mainWindow.on('moved', () => {
    // Always re-sample chrome after the window settles (drag or snap).
    mainWindow?.webContents.send('window:position-settled');
    if (!suppressManualMoveNotify) {
      mainWindow?.webContents.send('window:manual-moved');
    }
  });
  mainWindow.on('close', persistWindowState);
}

let suppressManualMoveNotify = false;
let manualMoveTimer = null;

function snapToCorner(corner) {
  if (!mainWindow) return null;

  const win = mainWindow.getBounds();
  const display = screen.getDisplayMatching(win);
  const area = display.workArea;

  const left = area.x + EDGE_MARGIN;
  const right = area.x + area.width - win.width - EDGE_MARGIN;
  const centerX = area.x + Math.round((area.width - win.width) / 2);
  const top = area.y + EDGE_MARGIN;
  const bottom = area.y + area.height - win.height - EDGE_MARGIN;
  const centerY = area.y + Math.round((area.height - win.height) / 2);

  const positions = {
    'top-left': { x: left, y: top },
    'top-center': { x: centerX, y: top },
    'top-right': { x: right, y: top },
    'center-left': { x: left, y: centerY },
    center: { x: centerX, y: centerY },
    'center-right': { x: right, y: centerY },
    'bottom-left': { x: left, y: bottom },
    'bottom-center': { x: centerX, y: bottom },
    'bottom-right': { x: right, y: bottom },
  };

  const next = positions[corner];
  if (!next) return null;

  suppressManualMoveNotify = true;
  clearTimeout(manualMoveTimer);
  mainWindow.setPosition(next.x, next.y);
  manualMoveTimer = setTimeout(() => {
    suppressManualMoveNotify = false;
  }, 350);

  return corner;
}


function setupDisplayMediaHandler() {
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      const primary = sources[0];
      if (!primary) {
        callback({});
        return;
      }
      callback({
        video: primary,
        audio: 'loopback',
      });
    } catch {
      callback({});
    }
  });
}

ipcMain.handle('desktop:get-sources', async (_event, types = ['window', 'screen']) => {
  const sources = await desktopCapturer.getSources({ types });
  return sources.map(({ id, name }) => ({ id, name }));
});

/**
 * Sample luminance of the desktop near the window (not under our chrome),
 * so the glass bar can follow light vs dark pages behind the overlay.
 * @returns {Promise<number | null>} 0–1 luma, or null if unavailable
 */
ipcMain.handle('desktop:sample-luma', async () => {
  if (!mainWindow || !overlayMode) return null;

  try {
    const bounds = mainWindow.getBounds();
    const display = screen.getDisplayMatching(bounds);
    const area = display.bounds;
    const thumbW = Math.max(80, Math.round(area.width / 12));
    const thumbH = Math.max(80, Math.round(area.height / 12));

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: thumbW, height: thumbH },
    });

    const source =
      sources.find((entry) => String(entry.display_id) === String(display.id)) || sources[0];
    if (!source?.thumbnail || source.thumbnail.isEmpty()) return null;

    const img = source.thumbnail;
    const size = img.getSize();
    if (size.width < 4 || size.height < 4) return null;

    /** Prefer a patch beside / below the window so we don't sample our own UI. */
    const candidates = [
      { x: bounds.x - 12, y: bounds.y + bounds.height - 18 },
      { x: bounds.x + bounds.width + 12, y: bounds.y + bounds.height - 18 },
      { x: bounds.x + Math.round(bounds.width / 2), y: bounds.y + bounds.height + 8 },
      { x: bounds.x + Math.round(bounds.width / 2), y: bounds.y - 8 },
    ];

    let sampleX = bounds.x + Math.round(bounds.width / 2);
    let sampleY = bounds.y + bounds.height - 12;
    for (const point of candidates) {
      if (
        point.x >= area.x + 2 &&
        point.x < area.x + area.width - 2 &&
        point.y >= area.y + 2 &&
        point.y < area.y + area.height - 2
      ) {
        sampleX = point.x;
        sampleY = point.y;
        break;
      }
    }

    const relX = (sampleX - area.x) / area.width;
    const relY = (sampleY - area.y) / area.height;
    const px = Math.min(size.width - 3, Math.max(0, Math.floor(relX * size.width)));
    const py = Math.min(size.height - 3, Math.max(0, Math.floor(relY * size.height)));
    const patch = img.crop({
      x: px,
      y: py,
      width: Math.min(3, size.width - px),
      height: Math.min(3, size.height - py),
    });

    const bitmap = patch.toBitmap();
    let total = 0;
    let count = 0;
    for (let i = 0; i + 3 < bitmap.length; i += 4) {
      const b = bitmap[i] / 255;
      const g = bitmap[i + 1] / 255;
      const r = bitmap[i + 2] / 255;
      total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      count += 1;
    }
    return count > 0 ? total / count : null;
  } catch {
    return null;
  }
});

ipcMain.handle('window:snap', (_event, corner) => {
  return snapToCorner(corner);
});

ipcMain.handle('window:set-always-on-top', (_event, enabled) => {
  mainWindow?.setAlwaysOnTop(Boolean(enabled));
});

ipcMain.handle('window:get-always-on-top', () => mainWindow?.isAlwaysOnTop() ?? true);

ipcMain.handle('window:set-overlay-mode', (_event, enabled) => {
  applyOverlayMode(enabled);
  persistWindowState();
});

ipcMain.handle('window:get-overlay-mode', () => overlayMode);

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:avatar-ready', () => {
  finishSplashAndShowMain();
});

ipcMain.on('splash:finished', () => {
  if (splashDismissed) return;
  splashDismissed = true;
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
  revealMainWindow();
});

ipcMain.handle('window:set-scale', (_event, factor) => {
  return applyWindowScale(factor);
});

ipcMain.handle('window:get-scale', () => windowScale);

ipcMain.handle('settings:load', () => loadSettings(app));

ipcMain.handle('settings:save', (_event, settings) => saveSettings(app, settings));

ipcMain.handle('settings:reset', () => resetSettings(app));

ipcMain.handle('settings:info', () => getSettingsInfo(app));

app.whenReady().then(() => {
  setupDisplayMediaHandler();
  createSplashWindow();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
