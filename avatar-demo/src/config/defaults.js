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
  position: [-0.01, 0.59, 1.69],
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
