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
let overlayMode = true;

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
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
  }, 12000);

  let saveTimer;
  const persistBounds = () => {
    if (suppressPersist) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistWindowState, 250);
  };

  mainWindow.on('move', persistBounds);
  mainWindow.on('resize', persistBounds);
  mainWindow.on('close', persistWindowState);
}

function snapToCorner(corner) {
  if (!mainWindow) return;

  const win = mainWindow.getBounds();
  const display = screen.getDisplayMatching(win);
  const area = display.workArea;

  const positions = {
    'bottom-left': {
      x: area.x + EDGE_MARGIN,
      y: area.y + area.height - win.height - EDGE_MARGIN,
    },
    'bottom-right': {
      x: area.x + area.width - win.width - EDGE_MARGIN,
      y: area.y + area.height - win.height - EDGE_MARGIN,
    },
    'top-left': {
      x: area.x + EDGE_MARGIN,
      y: area.y + EDGE_MARGIN,
    },
    'top-right': {
      x: area.x + area.width - win.width - EDGE_MARGIN,
      y: area.y + EDGE_MARGIN,
    },
    'bottom-center': {
      x: area.x + Math.round((area.width - win.width) / 2),
      y: area.y + area.height - win.height - EDGE_MARGIN,
    },
  };

  const next = positions[corner];
  if (next) mainWindow.setPosition(next.x, next.y);
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

ipcMain.handle('window:snap', (_event, corner) => {
  snapToCorner(corner);
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
  if (!mainWindow?.isVisible()) mainWindow.show();
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
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
