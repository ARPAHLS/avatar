export const STAGE = {
  width: 400,
  height: 460,
  barHeight: 20,
  /** Extra canvas space above the layout box — no top clip. */
  canvasOverflowTop: 180,
  /** Extra canvas space on each side — no side clip. */
  canvasOverflowSide: 120,
};

/** Tuned bust / three-quarter framing from the live camera panel. */
export const defaultCamera = {
  position: [-0.09, 0.59, 1.69],
  lookAt: [0, 0.5, 0],
  fov: 26.8,
};

export const defaultLight = {
  intensity: 0.7,
  color: '#ffffff',
  position: [1, 2, 2],
};

export const defaultAvatar = {
  position: [0, -1.03, -1.48],
  rotation: [0, Math.PI, 0],
};

export const pastelTheme = {
  background: '#e9e1fa',
  border: '2px solid #bca6e9',
  icon: '#a18ad6',
  frameBorder: '#d6c8f7',
  panelBg: 'rgba(43,43,43,0.7)',
  panelBorder: '#444',
  panelText: '#e9e1fa',
  accent: '#a18ad6',
};
