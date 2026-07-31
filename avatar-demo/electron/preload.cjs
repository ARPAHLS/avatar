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
});
