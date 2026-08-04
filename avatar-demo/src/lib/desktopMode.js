export function isDesktopMode() {
  if (typeof window === 'undefined') return false;
  if (window.voxDesktop?.isDesktop === true) return true;
  return new URLSearchParams(window.location.search).get('desktop') === '1';
}

export function enableDesktopMode() {
  if (!isDesktopMode()) return;
  document.documentElement.classList.add('vox-desktop');
}

export function getDesktopApi() {
  return window.voxDesktop ?? null;
}

export function getVroidHubApi() {
  return window.voxVroidHub ?? null;
}

/** Electron user-library helpers (folder pick / scan / read). */
export function getLibraryApi() {
  const desktop = getDesktopApi();
  if (!desktop?.pickLibraryFolder) return null;
  return {
    pickFolder: () => desktop.pickLibraryFolder(),
    pathExists: (dirPath) => desktop.libraryPathExists(dirPath),
    openFolder: (dirPath) => desktop.openLibraryFolder(dirPath),
    scanAvatars: (dirPath) => desktop.scanLibraryAvatars(dirPath),
    scanEnvironments: (dirPath) => desktop.scanLibraryEnvironments(dirPath),
    readFile: (id) => desktop.readLibraryFile(id),
  };
}
