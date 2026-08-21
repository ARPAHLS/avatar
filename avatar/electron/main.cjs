const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  safeStorage,
  screen,
  session,
  shell,
  desktopCapturer,
} = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('node:url');
const {
  loadSettings,
  saveSettings,
  resetSettings,
  getSettingsInfo,
} = require('./settingsStore.cjs');
const { createVroidHubAuth } = require('./vroid-hub-auth.cjs');
const { createVroidHubClient } = require('./vroid-hub-client.cjs');
const {
  clearVroidHubCredentials,
  readVroidHubCredentials,
  writeVroidHubCredentials,
} = require('./vroid-hub-credentials.cjs');
const {
  createVroidOauthServer,
  DEFAULT_VROID_OAUTH_PORT,
  OAUTH_CALLBACK_PATH,
} = require('./vroid-oauth-server.cjs');
const { createAgentBusServer, DEFAULT_AGENT_BUS_PORT } = require('./agent-bus.cjs');
const {
  ensureAgentBusToken,
  generateAgentBusToken,
  readAgentBusToken,
  rotateAgentBusToken,
} = require('./agent-bus-token.cjs');
const {
  pathExists,
  readLibraryFileAsync,
  resolveLibraryPath,
  scanAnimations,
  scanAvatars,
  scanEnvironments,
} = require('./user-library.cjs');
const {
  configureThumbnailCache,
  readThumbnail,
  writeThumbnail,
} = require('./thumbnails.cjs');

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

let vroidHubAuth = null;
let vroidHubClient = null;
let vroidCredentialsFilePath = null;
let vroidOauthServer = null;
let vroidOauthPort = Number(process.env.AVATAR_VROID_OAUTH_PORT) || DEFAULT_VROID_OAUTH_PORT;

function vroidHubRedirectUri() {
  return `http://127.0.0.1:${vroidOauthPort}${OAUTH_CALLBACK_PATH}`;
}

// Builds vroidHubAuth/vroidHubClient from a VRoid Hub OAuth app's client
// id/secret (the user's own, saved via Settings). Requires OS-backed
// encryption to be available, since the resulting session tokens are
// persisted through it.
function configureVroidHub(clientId, clientSecret) {
  vroidHubAuth = createVroidHubAuth({
    clientId,
    clientSecret,
    redirectUri: vroidHubRedirectUri(),
    authFilePath: path.join(app.getPath('userData'), 'vroid-hub-auth.json'),
    encrypt: (buffer) => safeStorage.encryptString(buffer.toString('utf8')),
    decrypt: (buffer) => Buffer.from(safeStorage.decryptString(buffer), 'utf8'),
  });
  vroidHubClient = createVroidHubClient({ clientId });
}

// safeStorage.isEncryptionAvailable() alone isn't enough on Linux: without a
// keyring (KWallet/GNOME Secret Service), Electron silently falls back to
// "basic_text" — a hardcoded plaintext password, not real OS encryption —
// while still reporting encryption as "available". Treat that fallback the
// same as no secure storage at all. Both the VRoid Hub credentials and the
// agent bus token are gated on it.
function hasSecureStorage() {
  if (!safeStorage.isEncryptionAvailable()) return false;
  if (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text') {
    return false;
  }
  return true;
}

function vroidHubStatus() {
  return {
    configured: vroidHubAuth != null,
    connected: vroidHubAuth?.isConnected() ?? false,
    redirect_uri: vroidHubRedirectUri(),
  };
}

function broadcastVroidHubStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('vroid:status-updated', vroidHubStatus());
  }
}

// Invoked once VRoid Hub redirects back to vroid-oauth-server.cjs's
// /vroid-oauth-callback route with an authorization code. Throwing here
// surfaces a failure page to the system browser without exposing any
// Electron internals to it.
async function completeVroidHubLogin({ code, state, error }) {
  if (!vroidHubAuth) throw new Error('VRoid Hub is not configured.');
  if (error) {
    throw new Error(`VRoid Hub sign-in was cancelled or denied (${error}).`);
  }
  await vroidHubAuth.exchangeCode(code, state);
  broadcastVroidHubStatus();
}

// Defense in depth for the VRoid Hub handlers specifically: they touch
// encrypted secrets, an OAuth session, and shell.openExternal, so verify the
// call actually came from this app's own window/frame rather than trusting
// any renderer that can reach ipcMain (see Electron's IPC security guidance).
function assertTrustedVroidSender(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.senderFrame !== mainWindow.webContents.mainFrame) {
    throw new Error('Rejected VRoid Hub IPC call from an untrusted sender.');
  }
}

function isVroidHubUrl(value) {
  try {
    return new URL(String(value)).origin === 'https://hub.vroid.com';
  } catch {
    return false;
  }
}

function assertTrustedLibrarySender(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.senderFrame !== mainWindow.webContents.mainFrame) {
    throw new Error('Rejected library IPC call from an untrusted sender.');
  }
}

function assertTrustedDesktopSender(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.senderFrame !== mainWindow.webContents.mainFrame) {
    throw new Error('Rejected desktop IPC call from an untrusted sender.');
  }
}

function assertTrustedAgentBusSender(event) {
  if (!mainWindow || mainWindow.isDestroyed() || event.senderFrame !== mainWindow.webContents.mainFrame) {
    throw new Error('Rejected agent bus IPC call from an untrusted sender.');
  }
}

const AGENT_BUS_TOKEN_FILE = 'agent-bus.json';
const MIN_AGENT_BUS_PORT = 1024;
const MAX_AGENT_BUS_PORT = 65535;

let agentBusServer = null;
let agentBusSettings = { enabled: false, port: DEFAULT_AGENT_BUS_PORT, requireToken: true };
let agentBusToken = null;
let agentBusError = null;
// What the window last reported: { context, state }, or null until it has
// reported anything. Every bus request answers 503 until then, which is also
// what a reload leaves behind (Refs #6).
let stageSnapshot = null;
let resolveStageCommand = null;

function agentBusTokenPath() {
  return path.join(app.getPath('userData'), AGENT_BUS_TOKEN_FILE);
}

function agentBusCipher() {
  return {
    tokenFilePath: agentBusTokenPath(),
    encrypt: (buffer) => safeStorage.encryptString(buffer.toString('utf8')),
    decrypt: (buffer) => Buffer.from(safeStorage.decryptString(buffer), 'utf8'),
  };
}

/**
 * The stored token, without creating one. Null means either "never enabled"
 * or, on a machine with no OS keychain, "not minted yet this run".
 */
function currentAgentBusToken() {
  if (agentBusToken) return agentBusToken;
  if (!hasSecureStorage()) return null;
  agentBusToken = readAgentBusToken(agentBusCipher());
  return agentBusToken;
}

/**
 * Minted on first enable and reused thereafter, so nobody has to invent one
 * and no stored script breaks on the next launch. Without OS-backed
 * encryption there is nowhere safe to keep it, so it lives for this run only
 * and Settings says so.
 */
function mintAgentBusToken() {
  agentBusToken = hasSecureStorage()
    ? ensureAgentBusToken(agentBusCipher())
    : generateAgentBusToken();
  return agentBusToken;
}

function rotateAgentBusTokenNow() {
  agentBusToken = hasSecureStorage()
    ? rotateAgentBusToken(agentBusCipher())
    : generateAgentBusToken();
  return agentBusToken;
}

/** What Settings shows. Returned by every agent bus handler below. */
function agentBusStatus() {
  return {
    running: agentBusServer != null,
    token: agentBusSettings.requireToken ? currentAgentBusToken() : null,
    // False on a machine with no OS keychain: the token is regenerated every
    // launch there, and a copied one stops working when the app restarts.
    tokenPersisted: hasSecureStorage(),
    error: agentBusError,
  };
}

/**
 * The renderer's own command resolver, loaded from source rather than
 * reimplemented here: panels, hotkeys and the bus share one set of command
 * names and one set of error codes. It is ESM and this file is CommonJS,
 * hence the dynamic import — and why src/lib/stageCommands.js and the two
 * config modules it pulls in are listed in package.json's build.files.
 */
async function stageResolver() {
  if (!resolveStageCommand) {
    const source = pathToFileURL(path.join(__dirname, '../src/lib/stageCommands.js')).href;
    ({ resolveStageCommand } = await import(source));
  }
  return resolveStageCommand;
}

async function stopAgentBus() {
  if (!agentBusServer) return;
  const server = agentBusServer;
  agentBusServer = null;
  try {
    await server.close();
  } catch {
    // Nothing left to do about a socket that will not shut down.
  }
}

async function startAgentBus() {
  await stopAgentBus();

  if (agentBusSettings.requireToken) mintAgentBusToken();

  try {
    const server = createAgentBusServer({
      port: agentBusSettings.port,
      version: app.getVersion(),
      resolveCommand: await stageResolver(),
      getContext: () => stageSnapshot?.context ?? null,
      // The window reports the catalogs; the version and the runtime are
      // main's to add, and a caller checking either has nowhere else to look.
      getState: () =>
        stageSnapshot?.state
          ? { runtime: { version: app.getVersion(), mode: 'desktop' }, ...stageSnapshot.state }
          : null,
      // One way on purpose: acceptance was decided here, application happens
      // in the window, and a 200 has never claimed the model finished loading.
      applyAction: (action) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('agent-bus:action', action);
        }
      },
      // Minting again rather than returning null matters: null means "no token
      // required", so a token that somehow went missing would open the bus up
      // instead of closing it.
      getToken: () =>
        agentBusSettings.requireToken ? (currentAgentBusToken() ?? mintAgentBusToken()) : null,
    });
    await server.listen();
    agentBusServer = server;
    agentBusError = null;
  } catch (error) {
    // Fixed port, no silent fallback: moving would make the copied curl
    // example in Settings lie about where the bus is.
    agentBusError =
      error && error.code === 'EADDRINUSE'
        ? `Port ${agentBusSettings.port} is already in use.`
        : error instanceof Error
          ? error.message
          : String(error);
  }

  return agentBusStatus();
}

/** Mirrors normalizeAgentBusPort in src/config/agentBus.js; an IPC payload is
 * checked here rather than trusted, and a bad port must not reach `listen`,
 * which would read NaN as "any free port" and move the bus silently. */
function normalizeAgentBusPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_AGENT_BUS_PORT || port > MAX_AGENT_BUS_PORT) {
    return DEFAULT_AGENT_BUS_PORT;
  }
  return port;
}

/**
 * Driven by the window, which owns config.yaml: this runs on hydrate and
 * again whenever the user changes the Agents panel.
 */
async function configureAgentBus(settings) {
  const requested = {
    enabled: settings?.enabled === true,
    port: normalizeAgentBusPort(settings?.port),
    requireToken: settings?.requireToken !== false,
  };
  const previous = agentBusSettings;
  agentBusSettings = requested;

  if (!requested.enabled) {
    await stopAgentBus();
    agentBusError = null;
    return agentBusStatus();
  }

  const rebind =
    !agentBusServer ||
    previous.port !== requested.port ||
    previous.requireToken !== requested.requireToken;

  return rebind ? startAgentBus() : agentBusStatus();
}

function getLogoPath() {
  return path.join(__dirname, '../public/AVATAR_LOGO_150.png');
}

function revealMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
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
    icon: getLogoPath(),
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

  if (process.env.AVATAR_GEN_THUMBS) {
    // The generator's only progress report is renderer-side console output,
    // and this window is frameless with no DevTools accelerator.
    mainWindow.webContents.on('console-message', (...args) => {
      const details = args[1];
      const message = details && typeof details === 'object' ? details.message : args[2];
      if (typeof message === 'string') console.log(message);
    });
  }

  // A reload throws away the catalog the bus was validating against, and the
  // new one has not been reported yet.
  mainWindow.webContents.on('did-start-loading', () => {
    stageSnapshot = null;
  });

  mainWindow.on('closed', () => {
    stageSnapshot = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.setZoomFactor(windowScale);
    // WebGL in a window that is never composited does not reliably produce a
    // frame, and the generator's whole job is to read one back.
    if (process.env.AVATAR_GEN_THUMBS) revealMainWindow();
  });

  const distIndex = path.join(__dirname, '../dist/index.html');
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const desktopQuery = { query: { desktop: '1' } };

  if (devUrl) {
    const base = devUrl.includes('desktop=1')
      ? devUrl
      : `${devUrl}${devUrl.includes('?') ? '&' : '?'}desktop=1`;
    const url = process.env.AVATAR_GEN_THUMBS ? `${base}&genthumbs=1` : base;
    mainWindow.loadURL(url);
  } else if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex, desktopQuery);
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173/?desktop=1');
  }

  setTimeout(() => {
    revealMainWindow();
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

// Allowlisted OS privacy panes only — never a free-form URL from the renderer.
ipcMain.handle('shell:open-privacy-settings', (event) => {
  assertTrustedDesktopSender(event);
  if (process.platform === 'win32') {
    void shell.openExternal('ms-settings:privacy-microphone');
    return true;
  }
  if (process.platform === 'darwin') {
    void shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone',
    );
    return true;
  }
  return false;
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

// The window owns config.yaml, so it tells main what the bus should be doing
// — on hydrate and again on every change in the Agents panel.
ipcMain.handle('agent-bus:configure', (event, settings) => {
  assertTrustedAgentBusSender(event);
  return configureAgentBus(settings);
});

ipcMain.handle('agent-bus:rotate-token', async (event) => {
  assertTrustedAgentBusSender(event);
  rotateAgentBusTokenNow();
  // The running server reads the token per request, so nothing needs
  // restarting — the old one simply stops working.
  return agentBusStatus();
});

// Fire and forget: the catalog and the current selection, whenever either
// changes. Anything the bus is asked before the first report answers 503.
ipcMain.on('agent-bus:report', (event, snapshot) => {
  if (!mainWindow || mainWindow.isDestroyed() || event.senderFrame !== mainWindow.webContents.mainFrame) {
    return;
  }
  stageSnapshot = snapshot && typeof snapshot === 'object' ? snapshot : null;
});

ipcMain.handle('library:pick-folder', async (event) => {
  assertTrustedLibrarySender(event);
  if (!mainWindow || mainWindow.isDestroyed()) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose folder',
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths?.[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('library:path-exists', (event, dirPath) => {
  assertTrustedLibrarySender(event);
  return pathExists(dirPath);
});

ipcMain.handle('library:open-folder', async (event, dirPath) => {
  assertTrustedLibrarySender(event);
  if (!pathExists(dirPath)) {
    throw new Error('Folder not found.');
  }
  const err = await shell.openPath(dirPath);
  if (err) throw new Error(err);
  return true;
});

ipcMain.handle('library:scan-avatars', (event, dirPath) => {
  assertTrustedLibrarySender(event);
  return scanAvatars(dirPath);
});

ipcMain.handle('library:scan-animations', (event, dirPath) => {
  assertTrustedLibrarySender(event);
  return scanAnimations(dirPath);
});

ipcMain.handle('library:scan-environments', (event, dirPath) => {
  assertTrustedLibrarySender(event);
  return scanEnvironments(dirPath);
});

ipcMain.handle('library:read-file', async (event, id) => {
  assertTrustedLibrarySender(event);
  const buffer = await readLibraryFileAsync(id);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
});

ipcMain.handle('thumbnail:get', (event, id) => {
  assertTrustedLibrarySender(event);
  const absolutePath = resolveLibraryPath(id);
  if (!absolutePath) return null;
  const png = readThumbnail(absolutePath);
  if (!png) return null;
  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
});

// Dev-only asset generation (npm run thumbs). Registered only for that run, so
// a packaged app has no channel that can write into the source tree at all.
if (!app.isPackaged && process.env.AVATAR_GEN_THUMBS) {
  // Both the directory and the shape of the name are fixed here rather than
  // taken from the renderer, so this channel can only ever write generated
  // artwork into the two directories that hold it.
  const DEV_THUMB_TARGETS = {
    avatars: { dir: '../src/assets/avatars/thumbs', pattern: /^avatar\d+\.png$/ },
    environments: {
      dir: '../src/assets/environments/thumbs',
      // Environment ids are author-defined, so this bounds the shape instead of
      // listing them: no separators and no dots means no path to escape into.
      pattern: /^[a-z][a-z0-9-]{0,31}\.png$/,
    },
  };

  ipcMain.handle('thumbnail:dev-write', (event, kind, fileName, png) => {
    assertTrustedLibrarySender(event);
    // hasOwn, not a bare lookup: `__proto__` and friends would otherwise sail
    // past this guard with something truthy off Object.prototype.
    if (!Object.hasOwn(DEV_THUMB_TARGETS, String(kind))) {
      throw new Error(`Refusing to write thumbnails for unknown kind: ${kind}`);
    }
    const target = DEV_THUMB_TARGETS[String(kind)];
    if (!target.pattern.test(String(fileName))) {
      throw new Error(`Refusing to write unexpected thumbnail name: ${fileName}`);
    }
    const dir = path.join(__dirname, target.dir);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, Buffer.from(png));
    return filePath;
  });
}

ipcMain.handle('thumbnail:put', (event, id, png) => {
  assertTrustedLibrarySender(event);
  const absolutePath = resolveLibraryPath(id);
  if (!absolutePath) return false;
  // The renderer hands over an ArrayBuffer; only the id is trusted to name a
  // file, and writeThumbnail bounds the size.
  return writeThumbnail(absolutePath, Buffer.from(png));
});

ipcMain.handle('vroid:get-status', (event) => {
  assertTrustedVroidSender(event);
  return vroidHubStatus();
});

ipcMain.handle('vroid:get-credentials', (event) => {
  assertTrustedVroidSender(event);
  if (!hasSecureStorage()) {
    return { clientId: null, hasClientSecret: false };
  }
  const credentials = readVroidHubCredentials({
    credentialsFilePath: vroidCredentialsFilePath,
    decrypt: (buffer) => Buffer.from(safeStorage.decryptString(buffer), 'utf8'),
  });
  return {
    clientId: credentials?.clientId ?? null,
    hasClientSecret: credentials != null,
  };
});

ipcMain.handle('vroid:set-credentials', (event, clientId, clientSecret) => {
  assertTrustedVroidSender(event);
  if (!hasSecureStorage()) {
    throw new Error(
      'This OS has no secure credential storage available (on Linux, install a keyring such as ' +
        'GNOME Keyring or KWallet), so VRoid Hub credentials cannot be saved.',
    );
  }
  writeVroidHubCredentials(
    {
      credentialsFilePath: vroidCredentialsFilePath,
      encrypt: (buffer) => safeStorage.encryptString(buffer.toString('utf8')),
    },
    { clientId, clientSecret },
  );
  // A new OAuth app means any existing session belongs to the old one.
  vroidHubAuth?.disconnect();
  configureVroidHub(clientId.trim(), clientSecret.trim());
  broadcastVroidHubStatus();
  return vroidHubStatus();
});

ipcMain.handle('vroid:clear-credentials', (event) => {
  assertTrustedVroidSender(event);
  clearVroidHubCredentials({ credentialsFilePath: vroidCredentialsFilePath });
  vroidHubAuth?.disconnect();
  vroidHubAuth = null;
  vroidHubClient = null;
  broadcastVroidHubStatus();
  return vroidHubStatus();
});

ipcMain.handle('vroid:connect', (event) => {
  assertTrustedVroidSender(event);
  if (!vroidHubAuth) {
    throw new Error('VRoid Hub is not configured. Add your VRoid Hub app credentials in Settings first.');
  }
  void shell.openExternal(vroidHubAuth.buildAuthorizeUrl());
  return vroidHubStatus();
});

ipcMain.handle('vroid:disconnect', (event) => {
  assertTrustedVroidSender(event);
  vroidHubAuth?.disconnect();
  return vroidHubStatus();
});

ipcMain.handle('vroid:list-characters', async (event) => {
  assertTrustedVroidSender(event);
  if (!vroidHubAuth?.isConnected()) {
    throw new Error('Connect your VRoid Hub account first.');
  }
  const token = await vroidHubAuth.getValidAccessToken();
  return vroidHubClient.listCharacters(token);
});

// The URL comes back through the renderer, so it's re-checked here rather than
// trusted: shell.openExternal hands any scheme straight to the OS.
ipcMain.handle('vroid:open-model-page', (event, modelUrl) => {
  assertTrustedVroidSender(event);
  if (!isVroidHubUrl(modelUrl)) {
    throw new Error('Only VRoid Hub model pages can be opened from here.');
  }
  void shell.openExternal(modelUrl);
  return true;
});

ipcMain.handle('vroid:select-character', async (event, characterId) => {
  assertTrustedVroidSender(event);
  if (!vroidHubAuth?.isConnected()) {
    return { ok: false, error: 'Connect your VRoid Hub account first.' };
  }
  try {
    const token = await vroidHubAuth.getValidAccessToken();
    // No re-fetch of the character list to check characterId is in it: that's
    // not a real gate anyway, since /api/download_licenses below is VRoid
    // Hub's own authority on whether this id is licensable, and the renderer
    // already has this id from the list it just rendered.
    const buffer = await vroidHubClient.loadCharacterModel(token, characterId);
    return {
      ok: true,
      data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
});

app.whenReady().then(async () => {
  setupDisplayMediaHandler();
  configureThumbnailCache(app.getPath('userData'));
  createWindow();

  // VRoid Hub OAuth is opt-in and advanced: it's off until the user
  // registers their own OAuth app at hub.vroid.com/oauth/applications and
  // pastes its client id/secret into Settings (see docs/vroid-hub.md).
  // Dev-only convenience: safeStorage needs a real OS keychain backend on
  // Linux (KWallet or GNOME Secret Service over D-Bus). Contributors running
  // avatar from source without one would otherwise have the VRoid Hub
  // feature silently disabled. Packaged builds never call this, so a
  // distributed build still requires real OS-backed encryption.
  if (!app.isPackaged) {
    safeStorage.setUsePlainTextEncryption(true);
  }
  vroidCredentialsFilePath = path.join(app.getPath('userData'), 'vroid-hub-credentials.json');
  if (hasSecureStorage()) {
    const vroidCredentials = readVroidHubCredentials({
      credentialsFilePath: vroidCredentialsFilePath,
      decrypt: (buffer) => Buffer.from(safeStorage.decryptString(buffer), 'utf8'),
    });
    if (vroidCredentials) {
      configureVroidHub(vroidCredentials.clientId, vroidCredentials.clientSecret);
    }
  }

  vroidOauthServer = createVroidOauthServer({
    port: vroidOauthPort,
    // Always wired in, not gated on vroidHubAuth at creation time: the user
    // can configure VRoid Hub credentials from Settings at any point after
    // the server starts, and completeVroidHubLogin itself already rejects if
    // vroidHubAuth still isn't set by the time a callback lands.
    onOauthCallback: completeVroidHubLogin,
  });
  try {
    const address = await vroidOauthServer.listen();
    if (address && typeof address === 'object') {
      vroidOauthPort = address.port;
    }
  } catch {
    // A real OAuth flow can't complete without this server, but the rest of
    // the app (avatar, voice, environments) works fine without it — the
    // VRoid Hub Settings panel will simply show Connect failing.
    vroidOauthServer = null;
  }
});

app.on('before-quit', () => {
  void stopAgentBus();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
