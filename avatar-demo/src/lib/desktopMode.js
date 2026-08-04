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
