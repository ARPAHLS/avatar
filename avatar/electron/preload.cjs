const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('voxDesktop', {
  isDesktop: true,
  snapToCorner: (corner) => ipcRenderer.invoke('window:snap', corner),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke('window:set-always-on-top', enabled),
  getAlwaysOnTop: () => ipcRenderer.invoke('window:get-always-on-top'),
  setOverlayMode: (enabled) => ipcRenderer.invoke('window:set-overlay-mode', enabled),
  getOverlayMode: () => ipcRenderer.invoke('window:get-overlay-mode'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  notifyReady: () => ipcRenderer.invoke('window:avatar-ready'),
  getWindowScale: () => ipcRenderer.invoke('window:get-scale'),
  setWindowScale: (factor) => ipcRenderer.invoke('window:set-scale', factor),
  getDesktopSources: (types) => ipcRenderer.invoke('desktop:get-sources', types),
  sampleDesktopLuma: () => ipcRenderer.invoke('desktop:sample-luma'),
  openPrivacySettings: () => ipcRenderer.invoke('shell:open-privacy-settings'),
  onPositionSettled: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('window:position-settled', listener);
    return () => ipcRenderer.removeListener('window:position-settled', listener);
  },
  onManualMoved: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('window:manual-moved', listener);
    return () => ipcRenderer.removeListener('window:manual-moved', listener);
  },
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  getSettingsInfo: () => ipcRenderer.invoke('settings:info'),
  pickLibraryFolder: () => ipcRenderer.invoke('library:pick-folder'),
  libraryPathExists: (dirPath) => ipcRenderer.invoke('library:path-exists', dirPath),
  openLibraryFolder: (dirPath) => ipcRenderer.invoke('library:open-folder', dirPath),
  scanLibraryAvatars: (dirPath) => ipcRenderer.invoke('library:scan-avatars', dirPath),
  scanLibraryAnimations: (dirPath) => ipcRenderer.invoke('library:scan-animations', dirPath),
  scanLibraryEnvironments: (dirPath) => ipcRenderer.invoke('library:scan-environments', dirPath),
  readLibraryFile: (id) => ipcRenderer.invoke('library:read-file', id),
  getThumbnail: (id) => ipcRenderer.invoke('thumbnail:get', id),
  putThumbnail: (id, png) => ipcRenderer.invoke('thumbnail:put', id, png),
  // Only answered during `npm run thumbs`; rejects in any normal run.
  devWriteThumbnail: (kind, fileName, png) =>
    ipcRenderer.invoke('thumbnail:dev-write', kind, fileName, png),
});

contextBridge.exposeInMainWorld('voxVroidHub', {
  getStatus: () => ipcRenderer.invoke('vroid:get-status'),
  getCredentials: () => ipcRenderer.invoke('vroid:get-credentials'),
  setCredentials: (clientId, clientSecret) =>
    ipcRenderer.invoke('vroid:set-credentials', clientId, clientSecret),
  clearCredentials: () => ipcRenderer.invoke('vroid:clear-credentials'),
  connect: () => ipcRenderer.invoke('vroid:connect'),
  disconnect: () => ipcRenderer.invoke('vroid:disconnect'),
  listCharacters: () => ipcRenderer.invoke('vroid:list-characters'),
  openModelPage: (modelUrl) => ipcRenderer.invoke('vroid:open-model-page', modelUrl),
  selectCharacter: async (characterId) => {
    const result = await ipcRenderer.invoke('vroid:select-character', characterId);
    if (result && typeof result === 'object' && 'ok' in result) {
      if (result.ok) return result.data;
      throw new Error(typeof result.error === 'string' ? result.error : 'Failed to load VRoid model.');
    }
    return result;
  },
  subscribe: (listener) => {
    const handler = (_event, status) => listener(status);
    ipcRenderer.on('vroid:status-updated', handler);
    return () => ipcRenderer.removeListener('vroid:status-updated', handler);
  },
});
