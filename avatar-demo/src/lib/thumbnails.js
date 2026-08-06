import {
  AmbientLight,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { getLibraryApi } from './desktopMode';

// Rendered at 2x the 56px the picker displays, so the portrait stays sharp on
// HiDPI screens without storing anything close to a full texture.
const THUMBNAIL_PX = 112;

// Framing copied from the live picker preview it replaces, so swapping to a
// static image does not shift how the characters sit in their circles.
const CAMERA_POSITION = [0, 1.1, 0.7];
const CAMERA_LOOK_AT = [0, 1.0, 0];
const CAMERA_FOV = 24;
const MODEL_OFFSET_Y = -0.54;

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

/** @type {Map<string, string>} avatar id → object URL, for this session. */
const urlCache = new Map();
/** @type {Map<string, Promise<string | null>>} in-flight work, so two mounts share one render. */
const pending = new Map();

/** Generation is strictly serial: see runQueued. */
let queueTail = Promise.resolve();

/**
 * Parsing a VRM is a second of unbroken main-thread work. Running three at
 * once is what made opening Appearance freeze, so thumbnails are generated one
 * at a time with a yield between them — the picker fills in progressively
 * instead of the window going away.
 *
 * @template T
 * @param {() => Promise<T>} job
 * @returns {Promise<T>}
 */
function runQueued(job) {
  const result = queueTail.then(async () => {
    await new Promise((resolve) => {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    });
    return job();
  });
  // Keep the chain alive even if one model fails to parse.
  queueTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/**
 * @param {string} modelPath
 * @returns {Promise<Blob>}
 */
async function renderThumbnail(modelPath) {
  const gltf = await loader.loadAsync(modelPath);
  const vrm = gltf.userData.vrm;

  if (!vrm) {
    // A plain .glb, or anything renamed to .vrm — it parses, but there is no
    // VRM payload to pose. The loader has already built its geometries and
    // textures, and nothing else holds them.
    VRMUtils.deepDispose(gltf.scene);
    throw new Error('File is not a VRM.');
  }

  // Everything allocated from here on has to be released even if the render
  // throws, so it all lives inside the try.
  let renderer = null;
  try {
    // Same two corrections the live avatar applies; rotateVRM0 in particular
    // is what keeps VRM 0.0 models facing the camera instead of away from it.
    VRMUtils.combineSkeletons(vrm.scene);
    VRMUtils.rotateVRM0(vrm);

    // rotateVRM0 owns vrm.scene's transform, so the framing offset goes on a
    // wrapper — the same split VrmAvatar uses. Writing it onto vrm.scene
    // happens to work today only because rotateVRM0 touches rotation, not
    // position.
    const framing = new Group();
    framing.position.y = MODEL_OFFSET_Y;
    framing.add(vrm.scene);

    const canvas = document.createElement('canvas');
    canvas.width = THUMBNAIL_PX;
    canvas.height = THUMBNAIL_PX;

    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      // toBlob reads the drawing buffer after render returns, which is only
      // guaranteed to still hold the frame when this is set.
      preserveDrawingBuffer: true,
    });
    renderer.setSize(THUMBNAIL_PX, THUMBNAIL_PX, false);

    const scene = new Scene();
    scene.add(new AmbientLight(0xffffff, 0.7));
    const key = new DirectionalLight(0xffffff, 0.7);
    key.position.set(1, 2, 2);
    scene.add(key);
    scene.add(framing);

    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 20);
    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(...CAMERA_LOOK_AT);

    renderer.render(scene, camera);
    return await new Promise((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error('Thumbnail canvas produced no image.'));
      }, 'image/png');
    });
  } finally {
    // This renderer exists for exactly one frame. Everything it and the model
    // put on the GPU has to go back, or generating thumbnails would leak more
    // than the live previews ever did.
    VRMUtils.deepDispose(vrm.scene);
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
}

/**
 * A cached thumbnail for a user-library avatar, rendering and storing one if
 * this is the first time we have seen the file.
 *
 * @param {{ id: string, path: string }} entry
 * @returns {Promise<string | null>} object URL, or null if unavailable
 */
export function getLibraryThumbnail(entry) {
  const cached = urlCache.get(entry.id);
  if (cached) return Promise.resolve(cached);

  const inFlight = pending.get(entry.id);
  if (inFlight) return inFlight;

  const work = (async () => {
    const api = getLibraryApi();
    if (!api) return null;

    try {
      const stored = await api.getThumbnail(entry.id);
      if (stored) {
        const url = URL.createObjectURL(new Blob([stored], { type: 'image/png' }));
        urlCache.set(entry.id, url);
        return url;
      }

      const blob = await runQueued(() => renderThumbnail(entry.path));

      // Best-effort, and it has to actually behave that way: a cache that
      // refuses the write must not cost us the image we just rendered.
      try {
        await api.putThumbnail(entry.id, await blob.arrayBuffer());
      } catch {
        // Falls back to regenerating next launch.
      }

      const url = URL.createObjectURL(blob);
      urlCache.set(entry.id, url);
      return url;
    } catch {
      return null;
    } finally {
      pending.delete(entry.id);
    }
  })();

  pending.set(entry.id, work);
  return work;
}

/**
 * Render a thumbnail without touching the disk cache. Used by the bundled
 * avatars' generate-and-commit path, which has no library id to key on.
 *
 * @param {string} modelPath
 * @returns {Promise<Blob>}
 */
export function renderThumbnailBlob(modelPath) {
  return runQueued(() => renderThumbnail(modelPath));
}

/**
 * Drop this session's object URLs. Must be called whenever the avatar library
 * is rescanned: ids are derived from the file path alone, so without this a
 * .vrm replaced in place keeps serving its old portrait for the rest of the
 * session — urlCache would answer before the disk cache's mtime/size check
 * ever got a chance to miss.
 */
export function revokeThumbnailUrls() {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}
