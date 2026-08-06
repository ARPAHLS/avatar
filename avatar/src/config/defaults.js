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
  // Purely the user's own framing rotation — no VRM 0.0 facing flip baked in.
  // That 180° correction is applied per-model from each VRM's own spec version
  // (see VrmAvatar's VRMUtils.rotateVRM0 call); folding it in here would leave
  // VRM 1.0 models, which need no flip, facing away from the camera.
  rotation: [0, 0, 0],
};
