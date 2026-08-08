import { restAnimation } from './animationLookup';
import { bundledVrmaUrls } from './vrmaAssets';

/**
 * @typedef {import('./animationLookup').AnimationEntry} AnimationEntry
 */

// Public entry point for the animation config: the bundled catalog plus the
// lookups re-exported below, so callers need only this module.
export {
  createVrmaResolver,
  defaultAnimationId,
  getAnimationById,
  getSelectableAnimations,
  resolveAnimationId,
  resolveVrmaUrl,
  restAnimation,
} from './animationLookup';

/** @type {AnimationEntry[]} */
export const animationCatalog = [
  restAnimation,
  {
    id: 'default',
    label: 'Default',
    source: 'sequence',
    intro: ['vrma-02'],
    sequence: ['vrma-06', 'vrma-01', 'vrma-03', 'vrma-07', 'vrma-04'],
    group: 'Default',
    description: 'Greeting, then model pose → full body → peace sign → squat → shoot.',
    selectable: true,
  },
  {
    id: 'vrma-01',
    label: 'Show Full Body',
    source: 'vrma',
    vrmaUrl: bundledVrmaUrls['vrma-01'],
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-02',
    label: 'Greeting',
    source: 'vrma',
    vrmaUrl: bundledVrmaUrls['vrma-02'],
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-03',
    label: 'Peace Sign',
    source: 'vrma',
    vrmaUrl: bundledVrmaUrls['vrma-03'],
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-04',
    label: 'Shoot',
    source: 'vrma',
    vrmaUrl: bundledVrmaUrls['vrma-04'],
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-05',
    label: 'Spin',
    source: 'vrma',
    vrmaUrl: bundledVrmaUrls['vrma-05'],
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-06',
    label: 'Model Pose',
    source: 'vrma',
    vrmaUrl: bundledVrmaUrls['vrma-06'],
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-07',
    label: 'Squat',
    source: 'vrma',
    vrmaUrl: bundledVrmaUrls['vrma-07'],
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
];
