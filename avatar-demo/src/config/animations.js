import vrma01 from '../assets/avatars/VRMA/VRMA_01.vrma';
import vrma02 from '../assets/avatars/VRMA/VRMA_02.vrma';
import vrma03 from '../assets/avatars/VRMA/VRMA_03.vrma';
import vrma04 from '../assets/avatars/VRMA/VRMA_04.vrma';
import vrma05 from '../assets/avatars/VRMA/VRMA_05.vrma';
import vrma06 from '../assets/avatars/VRMA/VRMA_06.vrma';
import vrma07 from '../assets/avatars/VRMA/VRMA_07.vrma';

/** @typedef {'rest' | 'vrma' | 'sequence'} AnimationSource */
/** @typedef {'loop' | 'once'} AnimationPlayback */

/**
 * @typedef {Object} AnimationEntry
 * @property {string} id
 * @property {string} label
 * @property {AnimationSource} source
 * @property {AnimationPlayback} [playback]
 * @property {string} [vrmaUrl]
 * @property {string[]} [intro]
 * @property {string[]} [sequence]
 * @property {string} [description]
 * @property {string} [group]
 * @property {boolean} [selectable]
 */

/** @type {AnimationEntry[]} */
export const animationCatalog = [
  {
    id: 'rest',
    label: 'Rest',
    source: 'rest',
    playback: 'loop',
    group: 'Default',
    description: 'Neutral bind pose with blink and optional lip sync.',
    selectable: false,
  },
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
    vrmaUrl: vrma01,
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-02',
    label: 'Greeting',
    source: 'vrma',
    vrmaUrl: vrma02,
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-03',
    label: 'Peace Sign',
    source: 'vrma',
    vrmaUrl: vrma03,
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-04',
    label: 'Shoot',
    source: 'vrma',
    vrmaUrl: vrma04,
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-05',
    label: 'Spin',
    source: 'vrma',
    vrmaUrl: vrma05,
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-06',
    label: 'Model Pose',
    source: 'vrma',
    vrmaUrl: vrma06,
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
  {
    id: 'vrma-07',
    label: 'Squat',
    source: 'vrma',
    vrmaUrl: vrma07,
    playback: 'loop',
    group: 'VRMA Motion Pack',
    selectable: true,
  },
];

export const defaultAnimationId = 'default';

/** @param {string} id */
export function getAnimationById(id) {
  return animationCatalog.find((entry) => entry.id === id) ?? animationCatalog[0];
}

/** @param {string} id */
export function resolveVrmaUrl(id) {
  const entry = getAnimationById(id);
  return entry.source === 'vrma' && entry.vrmaUrl ? entry.vrmaUrl : null;
}

/** Animations shown in the dropdown. */
export function getSelectableAnimations() {
  return animationCatalog.filter((entry) => entry.selectable !== false);
}
