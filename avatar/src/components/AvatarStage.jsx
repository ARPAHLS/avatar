import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  animationCatalog as bundledAnimations,
  defaultAnimationId,
  resolveAnimationId,
} from '../config/animations';
import { getDefaultAudioSourceId } from '../config/audioSources';
import {
  customEnvironments,
  defaultColor,
  setLibraryCustomEnvironments,
} from '../config/environments';
import {
  avatars as bundledAvatars,
  defaultAvatarId,
  defaultSkinId,
  resolveAvatarPath,
} from '../config/avatars';
import { defaultAvatar, defaultCamera, defaultLight, STAGE } from '../config/defaults';
import { defaultWindowScale, normalizeWindowScale } from '../config/windowScale';
import {
  createDefaultDirectories,
  createDefaultDirectorySource,
  createDefaultUserSettings,
  snapshotUserSettings,
} from '../config/userSettings';
import { useAudioSource } from '../hooks/useAudioSource';
import { getDesktopApi, getLibraryApi, isDesktopMode } from '../lib/desktopMode';
import {
  loadEnvironmentSource,
  loadLibraryAnimations,
  loadLibraryAvatars,
  loadLibraryEnvironments,
  revokeAnimationBlobUrls,
  revokeAvatarBlobUrls,
  revokeEnvironmentBlobUrls,
} from '../lib/userLibrary';
import { loadUserSettings, resetUserSettings, saveUserSettings } from '../lib/userSettingsStore';
import { revokeThumbnailUrls } from '../lib/thumbnails';
import { revokeEnvironmentThumbnailUrls } from '../lib/environmentThumbnails';
import { VrmAvatar } from './avatar/VrmAvatar';
import { AvatarStageShell } from './avatar/AvatarStageShell';
import { CameraController } from './ui/CameraController';
import { GlassDrawer } from './ui/GlassDrawer';
import { Divider } from './ui/PanelPrimitives';
import { PalettePanel } from './panels/PalettePanel';
import { VoicePanel } from './panels/VoicePanel';
import { CameraPanel } from './panels/CameraPanel';
import { DesktopPanel } from './panels/DesktopPanel';
import { DirectoriesPanel } from './panels/DirectoriesPanel';
import { VroidHubPanel } from './panels/VroidHubPanel';

const desktopMode = isDesktopMode();
const SAVE_DEBOUNCE_MS = 400;

export function AvatarStage() {
  const [settingsReady, setSettingsReady] = useState(false);
  const [animationId, setAnimationId] = useState(defaultAnimationId);
  const [animationRequest, setAnimationRequest] = useState(0);
  const [camera, setCamera] = useState({ ...defaultCamera });
  const [light, setLight] = useState({ ...defaultLight });
  const [avatar, setAvatar] = useState({ ...defaultAvatar });
  const [avatarReady, setAvatarReady] = useState(false);
  const [overlayMode, setOverlayMode] = useState(true);
  const hoverAreaRef = useRef(null);
  const [openAccordion, setOpenAccordion] = useState('avatars');
  const [openPanel, setOpenPanel] = useState(null);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [scaleMenuOpen, setScaleMenuOpen] = useState(false);
  const [windowScale, setWindowScale] = useState(defaultWindowScale);
  const [selectedAvatarId, setSelectedAvatarId] = useState(defaultAvatarId);
  const [selectedSkinId, setSelectedSkinId] = useState(defaultSkinId);
  const [selectedBg, setSelectedBg] = useState({ type: 'color', value: defaultColor });
  const [audioFile, setAudioFile] = useState(null);
  const [windowSourceId, setWindowSourceId] = useState(null);
  const [audioSourceId, setAudioSourceId] = useState(getDefaultAudioSourceId);
  const [settingsPath, setSettingsPath] = useState(null);
  // Session-only: a VRoid Hub character is never persisted to config.yaml
  // (kept in memory only, per VRoid Hub's licensing rules for linked-app
  // usage), so neither of these belongs in userSettings.js's schema.
  const [hubAvatar, setHubAvatar] = useState(null); // { id, name, blobUrl } | null
  const [hubActive, setHubActive] = useState(false);
  const [hubSelectionState, setHubSelectionState] = useState({
    characterId: null,
    loading: false,
    error: null,
    notice: null,
  });
  const [directories, setDirectories] = useState(createDefaultDirectories);
  const [libraryAvatars, setLibraryAvatars] = useState([]);
  const [libraryAnimations, setLibraryAnimations] = useState([]);
  const [libraryEnvironments, setLibraryEnvironments] = useState([]);
  const [directoriesNotice, setDirectoriesNotice] = useState(null);
  const libraryAvatarsRef = useRef([]);
  const libraryAnimationsRef = useRef([]);
  const libraryEnvironmentsRef = useRef([]);
  /** Id of the environment whose full-size image is currently being read. */
  const environmentSourceLoadRef = useRef(null);
  const panelRef = useRef(null);
  const drawerRef = useRef(null);
  const commandMenuRef = useRef(null);
  const scaleMenuRef = useRef(null);
  const isPanelHovered = useRef(false);
  const skipNextSave = useRef(true);

  const desktopApi = getDesktopApi();

  const { level, speaking, status: audioStatus, error: audioError, restart } = useAudioSource(
    audioSourceId,
    audioFile,
    { windowSourceId },
  );

  const lipSyncEnabled = audioSourceId !== 'none' && audioStatus === 'active';

  const applySettings = useCallback((settings) => {
    setSelectedAvatarId(settings.avatarId);
    setSelectedSkinId(settings.skinId);
    setAnimationId(settings.animationId);
    setSelectedBg(settings.environment);
    setCamera({
      position: [...settings.camera.position],
      lookAt: [...settings.camera.lookAt],
      fov: settings.camera.fov,
    });
    setLight({
      intensity: settings.light.intensity,
      color: settings.light.color,
      position: [...settings.light.position],
    });
    setAvatar({
      position: [...settings.avatarTransform.position],
      rotation: [...settings.avatarTransform.rotation],
    });
    setAudioSourceId(settings.audioSourceId);
    setWindowSourceId(settings.windowSourceId);
    setOverlayMode(settings.overlayMode);
    document.documentElement.classList.toggle('vox-desktop-windowed', !settings.overlayMode);
    setWindowScale(normalizeWindowScale(settings.windowScale));
    setDirectories(settings.directories ?? createDefaultDirectories());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const settings = await loadUserSettings();
      let hasPersisted = false;

      if (desktopApi?.getSettingsInfo) {
        try {
          const info = await desktopApi.getSettingsInfo();
          if (!cancelled && info?.path) setSettingsPath(info.path);
          hasPersisted = Boolean(info?.exists);
        } catch {
          // ignore
        }
      } else {
        try {
          hasPersisted = Boolean(window.localStorage.getItem('avatar.config.yaml'));
        } catch {
          hasPersisted = false;
        }
      }

      if (!hasPersisted && desktopApi) {
        try {
          if (desktopApi.getOverlayMode) {
            settings.overlayMode = await desktopApi.getOverlayMode();
          }
          if (desktopApi.getWindowScale) {
            settings.windowScale = normalizeWindowScale(await desktopApi.getWindowScale());
          }
        } catch {
          // keep defaults
        }
      }

      if (cancelled) return;
      applySettings(settings);

      if (hasPersisted && desktopApi) {
        if (desktopApi.setOverlayMode) {
          await desktopApi.setOverlayMode(settings.overlayMode);
        }
        if (desktopApi.setWindowScale) {
          await desktopApi.setWindowScale(settings.windowScale);
        }
      }

      skipNextSave.current = true;
      setSettingsReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [applySettings, desktopApi]);

  useEffect(() => {
    if (!settingsReady) return undefined;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const snapshot = snapshotUserSettings({
        avatarId: selectedAvatarId,
        skinId: selectedSkinId,
        animationId,
        environment: selectedBg,
        camera,
        light,
        avatarTransform: avatar,
        audioSourceId,
        windowSourceId,
        overlayMode,
        windowScale,
        directories,
      });
      void saveUserSettings(snapshot);
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    settingsReady,
    selectedAvatarId,
    selectedSkinId,
    animationId,
    selectedBg,
    camera,
    light,
    avatar,
    audioSourceId,
    windowSourceId,
    overlayMode,
    windowScale,
    directories,
  ]);

  useEffect(() => {
    if (!commandMenuOpen && !openPanel && !scaleMenuOpen) return undefined;

    function handlePointerDown(event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (commandMenuRef.current?.contains(target)) return;
      if (scaleMenuRef.current?.contains(target)) return;
      if (drawerRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('.avatar-glass-bar__gear')) return;
      if (target instanceof Element && target.closest('.avatar-glass-bar__scale')) return;
      // Portaled lilac selects render on document.body (outside the drawer).
      if (target instanceof Element && target.closest('.panel-select-menu__list')) return;

      if (commandMenuOpen) setCommandMenuOpen(false);
      if (scaleMenuOpen) setScaleMenuOpen(false);
      if (openPanel) setOpenPanel(null);
    }

    const timer = window.setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown);
    }, 120);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [commandMenuOpen, openPanel, scaleMenuOpen]);

  useEffect(() => {
    if (!desktopMode) return undefined;
    function handleBlur() {
      setCommandMenuOpen(false);
      setScaleMenuOpen(false);
    }
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const handleAnimationChange = useCallback((nextId) => {
    setAnimationId(nextId);
    setAnimationRequest((count) => count + 1);
  }, []);

  const handleAvatarLoaded = useCallback(() => {
    setAvatarReady(true);
    void getDesktopApi()?.notifyReady?.();
  }, []);

  const customAvatarMode =
    desktopMode && directories.avatars.mode === 'custom' && Boolean(directories.avatars.path);
  const avatarCatalog = customAvatarMode ? libraryAvatars : bundledAvatars;
  const customAnimationMode =
    desktopMode && directories.animations.mode === 'custom' && Boolean(directories.animations.path);
  // Replace, not additive: in custom mode the bundled Default sequence and VRMA
  // pack are unreachable, so the folder is the whole catalog.
  const animationCatalog = customAnimationMode ? libraryAnimations : bundledAnimations;
  const appearanceCustomEnvironments =
    desktopMode && directories.environments.mode === 'custom' && Boolean(directories.environments.path)
      ? libraryEnvironments
      : customEnvironments;

  useEffect(() => {
    libraryAvatarsRef.current = libraryAvatars;
  }, [libraryAvatars]);

  useEffect(() => {
    libraryAnimationsRef.current = libraryAnimations;
  }, [libraryAnimations]);

  useEffect(() => {
    libraryEnvironmentsRef.current = libraryEnvironments;
  }, [libraryEnvironments]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAvatarLibrary() {
      revokeAvatarBlobUrls(libraryAvatarsRef.current);
      // Thumbnails are keyed by path, so a rescan has to drop them too or a
      // replaced .vrm keeps showing its old portrait.
      revokeThumbnailUrls();
      if (!customAvatarMode || !directories.avatars.path) {
        if (!cancelled) {
          setLibraryAvatars([]);
        }
        return;
      }

      const { avatars: next, error } = await loadLibraryAvatars(directories.avatars.path);
      if (cancelled) {
        revokeAvatarBlobUrls(next);
        return;
      }
      setLibraryAvatars(next);
      if (error) {
        setDirectoriesNotice(error);
        setDirectories((prev) => ({
          ...prev,
          avatars: createDefaultDirectorySource(),
        }));
        setSelectedAvatarId(defaultAvatarId);
        setSelectedSkinId(defaultSkinId);
        // Same bundled path may not re-fire onLoaded — force the stage visible again.
        setAvatarReady(true);
        return;
      }
      setDirectoriesNotice((prev) =>
        prev && prev.toLowerCase().includes('avatar') ? null : prev,
      );
      if (next.length === 0) {
        setDirectoriesNotice(
          'No .vrm files in that folder. Keeping the default avatar list.',
        );
        setDirectories((prev) => ({
          ...prev,
          avatars: createDefaultDirectorySource(),
        }));
        setLibraryAvatars([]);
        setSelectedAvatarId(defaultAvatarId);
        setSelectedSkinId(defaultSkinId);
        setAvatarReady(true);
        return;
      }
      setSelectedAvatarId((current) =>
        next.some((entry) => entry.id === current) ? current : next[0].id,
      );
      setSelectedSkinId(defaultSkinId);
      setAvatarReady(false);
    }

    void refreshAvatarLibrary();
    return () => {
      cancelled = true;
    };
  }, [customAvatarMode, directories.avatars.path]);

  useEffect(() => {
    let cancelled = false;

    async function refreshAnimationLibrary() {
      // Retire the old urls only once their replacements are in state, so a load
      // still in flight resolves — same hazard the environments list hit (#39).
      const previous = libraryAnimationsRef.current;

      if (!customAnimationMode || !directories.animations.path) {
        if (!cancelled) {
          setLibraryAnimations([]);
          revokeAnimationBlobUrls(previous);
        }
        return;
      }

      const { animations: next, error, notice } = await loadLibraryAnimations(
        directories.animations.path,
      );
      if (cancelled) {
        // A newer run captured the same `previous` and owns retiring it.
        revokeAnimationBlobUrls(next);
        return;
      }
      setLibraryAnimations(next);
      revokeAnimationBlobUrls(previous);

      if (error || next.length === 0) {
        setDirectoriesNotice(
          error ?? 'No .vrma files in that folder. Keeping the default animation list.',
        );
        setDirectories((prev) => ({
          ...prev,
          animations: createDefaultDirectorySource(),
        }));
        setLibraryAnimations([]);
        revokeAnimationBlobUrls(next);
        setAnimationId(defaultAnimationId);
        return;
      }

      setDirectoriesNotice((prev) =>
        notice ?? (prev && prev.toLowerCase().includes('animation') ? null : prev),
      );
      // Ids hash the file path, so the same clip keeps its selection across a
      // rescan; only a folder swap or a file gone since last launch retires one.
      setAnimationId((current) => resolveAnimationId(next, current));
    }

    void refreshAnimationLibrary();
    return () => {
      cancelled = true;
    };
  }, [customAnimationMode, directories.animations.path]);

  useEffect(() => {
    let cancelled = false;

    async function refreshEnvLibrary() {
      // Revoking before the await left the stage and the picker pointing at
      // urls that no longer resolve for as long as the replacement took to
      // load. Already-decoded images survive revocation, so nothing changed on
      // screen — but a remount in that window loaded nothing. Hold the old list
      // and drop it only once its replacement is in state (#39).
      const previous = libraryEnvironmentsRef.current;
      // Posters are keyed by path, so a rescan has to drop them or an image
      // replaced in place keeps serving its old one: the disk cache would catch
      // the new mtime, but this session's url cache answers first.
      revokeEnvironmentThumbnailUrls();
      const useLibrary =
        desktopMode &&
        directories.environments.mode === 'custom' &&
        Boolean(directories.environments.path);

      if (!useLibrary) {
        setLibraryCustomEnvironments([]);
        if (!cancelled) {
          setLibraryEnvironments([]);
          revokeEnvironmentBlobUrls(previous);
        }
        return;
      }

      const { environments: next, error } = await loadLibraryEnvironments(
        directories.environments.path,
      );
      if (cancelled) {
        // A newer run captured the same `previous` and owns retiring it.
        revokeEnvironmentBlobUrls(next);
        return;
      }
      setLibraryEnvironments(next);
      setLibraryCustomEnvironments(next);
      revokeEnvironmentBlobUrls(previous);
      if (error) {
        setDirectoriesNotice(error);
        setDirectories((prev) => ({
          ...prev,
          environments: createDefaultDirectorySource(),
        }));
        setLibraryEnvironments([]);
        setLibraryCustomEnvironments([]);
        revokeEnvironmentBlobUrls(next);
        setSelectedBg((prev) =>
          prev.type === 'env' && String(prev.id).startsWith('lib-env-')
            ? { type: 'color', value: defaultColor }
            : prev,
        );
        return;
      }
      if (next.length === 0) {
        setDirectoriesNotice(
          'No .gif / .png / .jpg / .jpeg files in that folder. Keeping the default environment source.',
        );
        setDirectories((prev) => ({
          ...prev,
          environments: createDefaultDirectorySource(),
        }));
        setLibraryEnvironments([]);
        setLibraryCustomEnvironments([]);
        revokeEnvironmentBlobUrls(next);
        setSelectedBg((prev) =>
          prev.type === 'env' && String(prev.id).startsWith('lib-env-')
            ? { type: 'color', value: defaultColor }
            : prev,
        );
        return;
      }
      setDirectoriesNotice((prev) =>
        prev && prev.toLowerCase().includes('environment') ? null : prev,
      );
    }

    void refreshEnvLibrary();
    return () => {
      cancelled = true;
    };
  }, [directories.environments.mode, directories.environments.path]);

  useEffect(() => {
    // Bytes are held for the environment on stage and, while one is being read,
    // for the outgoing one the stage is still showing — never for the whole
    // folder, which is what loadLibraryEnvironments used to do the moment the
    // folder was configured. The picker draws posters instead.
    const selectedId = selectedBg.type === 'env' ? selectedBg.id : null;

    // The registry backs getEnvironmentById, which the holo field and the
    // chrome tone both read during render, so it has to move with the state
    // rather than trail it by an effect.
    const publish = (next) => {
      setLibraryCustomEnvironments(next);
      setLibraryEnvironments(next);
    };

    const target = selectedId
      ? libraryEnvironments.find((entry) => entry.id === selectedId)
      : null;

    // The stage holds the previous background until the incoming one is ready,
    // so its url is still on screen and cannot be released yet.
    if (!target || target.src) {
      const stale = libraryEnvironments.filter((entry) => entry.src && entry.id !== selectedId);
      if (stale.length > 0) {
        revokeEnvironmentBlobUrls(stale);
        publish(
          libraryEnvironments.map((entry) =>
            entry.src && entry.id !== selectedId ? { ...entry, src: null } : entry,
          ),
        );
      }
      return undefined;
    }

    // Publishing below re-runs this effect, and rapid switching can re-enter it
    // for an id already being read. One marker cannot cover every interleaving,
    // so the read itself checks again before it publishes.
    if (environmentSourceLoadRef.current === target.id) return undefined;
    environmentSourceLoadRef.current = target.id;

    void (async () => {
      try {
        const url = await loadEnvironmentSource(target);
        if (!url) return;
        const current = libraryEnvironmentsRef.current;
        const entry = current.find((candidate) => candidate.id === target.id);
        // Gone in a rescan, or another read of the same file got there first.
        if (!entry || entry.src) {
          URL.revokeObjectURL(url);
          return;
        }
        // Published even if the selection has moved on: the pass above releases
        // it on the next run, which is cheaper than losing the read and having
        // to redo it if the user comes back.
        publish(current.map((item) => (item.id === target.id ? { ...item, src: url } : item)));
      } finally {
        if (environmentSourceLoadRef.current === target.id) {
          environmentSourceLoadRef.current = null;
        }
      }
    })();

    return undefined;
  }, [selectedBg, libraryEnvironments]);

  useEffect(() => {
    return () => {
      revokeAvatarBlobUrls(libraryAvatarsRef.current);
      revokeThumbnailUrls();
      revokeAnimationBlobUrls(libraryAnimationsRef.current);
      revokeEnvironmentBlobUrls(libraryEnvironmentsRef.current);
      revokeEnvironmentThumbnailUrls();
      setLibraryCustomEnvironments([]);
    };
  }, []);

  const handleBrowseDirectory = useCallback(async (kind) => {
    const api = getLibraryApi();
    if (!api) return;
    const picked = await api.pickFolder();
    if (!picked) return;

    try {
      if (kind === 'avatars') {
        const scanned = await api.scanAvatars(picked);
        if (!scanned.length) {
          setDirectoriesNotice(
            'No .vrm files in that folder. Keeping the current avatar source.',
          );
          return;
        }
      } else if (kind === 'animations') {
        const scanned = await api.scanAnimations(picked);
        if (!scanned.length) {
          setDirectoriesNotice(
            'No .vrma files in that folder. Keeping the current animation source.',
          );
          return;
        }
      } else if (kind === 'environments') {
        const scanned = await api.scanEnvironments(picked);
        if (!scanned.length) {
          setDirectoriesNotice(
            'No .gif / .png / .jpg / .jpeg files in that folder. Keeping the current environment source.',
          );
          return;
        }
      }
    } catch (error) {
      setDirectoriesNotice(
        error instanceof Error ? error.message : 'Could not read that folder.',
      );
      return;
    }

    setDirectoriesNotice(null);
    setDirectories((prev) => ({
      ...prev,
      [kind]: { mode: 'custom', path: picked },
    }));
    if (kind === 'avatars') {
      setHubActive(false);
      setAvatarReady(false);
    }
  }, []);

  const handleOpenDirectory = useCallback(
    async (kind) => {
      const api = getLibraryApi();
      const pathValue = directories[kind]?.path;
      if (!api || !pathValue) return;
      try {
        await api.openFolder(pathValue);
      } catch (error) {
        setDirectoriesNotice(error instanceof Error ? error.message : 'Could not open folder.');
      }
    },
    [directories],
  );

  const handleClearDirectory = useCallback((kind) => {
    setDirectoriesNotice(null);
    setDirectories((prev) => ({
      ...prev,
      [kind]: createDefaultDirectorySource(),
    }));
    if (kind === 'avatars') {
      setSelectedAvatarId(defaultAvatarId);
      setSelectedSkinId(defaultSkinId);
      setAvatarReady(false);
      setHubActive(false);
    }
    if (kind === 'animations') {
      setAnimationId(defaultAnimationId);
    }
    if (kind === 'environments') {
      setSelectedBg((prev) =>
        prev.type === 'env' && String(prev.id).startsWith('lib-env-')
          ? { type: 'color', value: defaultColor }
          : prev,
      );
    }
  }, []);

  const handleAvatarChange = useCallback((avatarId) => {
    setAvatarReady(false);
    setHubActive(false);
    setSelectedAvatarId(avatarId);
    setSelectedSkinId(defaultSkinId);
  }, []);

  const handleSelectHubCharacter = useCallback(
    (arrayBuffer, character) => {
      if (hubAvatar?.blobUrl) URL.revokeObjectURL(hubAvatar.blobUrl);
      const blobUrl = URL.createObjectURL(
        new Blob([arrayBuffer], { type: 'model/gltf-binary' }),
      );
      setAvatarReady(false);
      setHubAvatar({ id: character.id, name: character.name, blobUrl });
      setHubActive(true);
      setHubSelectionState({
        characterId: character.id,
        loading: false,
        error: null,
        notice: `Loaded ${character.name}.`,
      });
    },
    [hubAvatar],
  );

  const handleReactivateHubCharacter = useCallback(() => {
    setHubActive(true);
  }, []);

  const handleHubCleared = useCallback(() => {
    setHubActive(false);
    setHubSelectionState({
      characterId: null,
      loading: false,
      error: null,
      notice: null,
    });
    setHubAvatar((previous) => {
      if (previous?.blobUrl) URL.revokeObjectURL(previous.blobUrl);
      return null;
    });
  }, []);

  const handleHubSelectionStart = useCallback((character) => {
    setHubSelectionState({
      characterId: character.id,
      loading: true,
      error: null,
      notice: `Loading ${character.name}...`,
    });
  }, []);

  const handleHubSelectionError = useCallback((character, message) => {
    setHubSelectionState({
      characterId: character?.id ?? null,
      loading: false,
      error: message,
      notice: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (hubAvatar?.blobUrl) URL.revokeObjectURL(hubAvatar.blobUrl);
    };
  }, [hubAvatar]);

  const modelPath =
    hubActive && hubAvatar
      ? hubAvatar.blobUrl
      : customAvatarMode
        ? libraryAvatars.find((entry) => entry.id === selectedAvatarId)?.skins?.[0]?.path ??
          libraryAvatars[0]?.skins?.[0]?.path ??
          null
        : resolveAvatarPath(selectedAvatarId, selectedSkinId);

  // Avoid a blank companion shell when there is no model to load (e.g. mid-reject).
  useEffect(() => {
    if (!modelPath && !hubActive) {
      setAvatarReady(true);
    }
  }, [modelPath, hubActive]);

  async function handleOverlayModeToggle() {
    const next = !overlayMode;
    setOverlayMode(next);
    document.documentElement.classList.toggle('vox-desktop-windowed', !next);
    await desktopApi?.setOverlayMode?.(next);
  }

  function handleCloseWindow() {
    void desktopApi?.closeWindow?.();
  }

  function handleCommandMenuChange(open) {
    setCommandMenuOpen(open);
    if (open) setScaleMenuOpen(false);
  }

  function handleScaleMenuChange(open) {
    setScaleMenuOpen(open);
    if (open) setCommandMenuOpen(false);
  }

  async function handleWindowScaleChange(factor) {
    const nextScale = normalizeWindowScale(factor);
    if (desktopApi?.setWindowScale) {
      const applied = await desktopApi.setWindowScale(nextScale);
      setWindowScale(normalizeWindowScale(typeof applied === 'number' ? applied : nextScale));
      return;
    }
    setWindowScale(nextScale);
  }

  async function handleResetAllSettings() {
    const defaults = await resetUserSettings();
    skipNextSave.current = true;

    // Only hide the stage when the VRM actually reloads — same path never
    // re-fires onLoaded, which left the whole UI at opacity 0 (looked like a crash).
    const nextPath = resolveAvatarPath(defaults.avatarId, defaults.skinId);
    if (nextPath !== modelPath) {
      setAvatarReady(false);
    }

    applySettings(defaults);
    setDirectories(createDefaultDirectories());
    setDirectoriesNotice(null);
    setLibraryCustomEnvironments([]);
    revokeAvatarBlobUrls(libraryAvatarsRef.current);
    revokeThumbnailUrls();
    revokeAnimationBlobUrls(libraryAnimationsRef.current);
    revokeEnvironmentBlobUrls(libraryEnvironmentsRef.current);
    setLibraryAvatars([]);
    setLibraryAnimations([]);
    setLibraryEnvironments([]);
    setAudioFile(null);
    setAnimationRequest((count) => count + 1);

    try {
      if (desktopApi?.setOverlayMode) {
        await desktopApi.setOverlayMode(defaults.overlayMode);
      }
      if (desktopApi?.setWindowScale) {
        await desktopApi.setWindowScale(defaults.windowScale);
      }
    } catch {
      // Keep in-app defaults even if native window APIs fail.
    }

    skipNextSave.current = true;
    void saveUserSettings(createDefaultUserSettings());
  }

  return (
    <div className="avatar-stage">
      <div
        className={`avatar-hover-area ${avatarReady ? 'avatar-hover-area--ready' : ''}`}
        ref={hoverAreaRef}
        style={{ width: STAGE.width, height: STAGE.height, '--stage-bar-height': `${STAGE.barHeight}px` }}
      >
        <AvatarStageShell
          environmentSelection={selectedBg}
          commandMenuOpen={commandMenuOpen}
          onCommandMenuChange={handleCommandMenuChange}
          commandMenuRef={commandMenuRef}
          scaleMenuOpen={scaleMenuOpen}
          onScaleMenuChange={handleScaleMenuChange}
          scaleMenuRef={scaleMenuRef}
          windowScale={windowScale}
          onWindowScaleChange={handleWindowScaleChange}
          onOpenPanel={setOpenPanel}
          openPanel={openPanel}
          animationId={animationId}
          animationCatalog={animationCatalog}
          onAnimationChange={handleAnimationChange}
          overlayMode={overlayMode}
          onOverlayModeToggle={handleOverlayModeToggle}
          onCloseWindow={handleCloseWindow}
          lipSyncLive={lipSyncEnabled}
        >
          <Canvas
            camera={{ position: camera.position, fov: camera.fov }}
            className="avatar-canvas"
            gl={{ alpha: true, antialias: true }}
            style={{ visibility: avatarReady ? 'visible' : 'hidden' }}
          >
            <CameraController cameraState={camera} />
            <ambientLight intensity={light.intensity} />
            <directionalLight position={light.position} intensity={light.intensity} color={light.color} />
            <VrmAvatar
              modelPath={modelPath}
              animationId={animationId}
              animationCatalog={animationCatalog}
              animationRequest={animationRequest}
              avatarPosition={avatar.position}
              avatarRotation={avatar.rotation}
              audioLevel={level}
              lipSyncEnabled={lipSyncEnabled}
              speaking={speaking}
              onLoaded={handleAvatarLoaded}
            />
          </Canvas>
        </AvatarStageShell>

        <GlassDrawer
          open={Boolean(openPanel)}
          panelId={openPanel}
          onClose={() => setOpenPanel(null)}
          drawerRef={drawerRef}
        >
          {openPanel === 'palette' && (
            <PalettePanel
              openAccordion={openAccordion}
              setOpenAccordion={setOpenAccordion}
              avatarCatalog={avatarCatalog}
              customAvatarMode={customAvatarMode}
              selectedAvatarId={selectedAvatarId}
              onAvatarChange={handleAvatarChange}
              selectedBg={selectedBg}
              setSelectedBg={setSelectedBg}
              customEnvironmentList={appearanceCustomEnvironments}
              onSelectHubCharacter={handleSelectHubCharacter}
              onReactivateHubCharacter={handleReactivateHubCharacter}
              onHubCleared={handleHubCleared}
              hubAvatarId={hubAvatar?.id ?? null}
              hubAvatarActive={hubActive}
              onOpenSettingsForHub={() => setOpenPanel('settings')}
              hubSelectionState={hubSelectionState}
              onHubSelectionStart={handleHubSelectionStart}
              onHubSelectionError={handleHubSelectionError}
            />
          )}

          {openPanel === 'voice' && (
            <VoicePanel
              audioSourceId={audioSourceId}
              setAudioSourceId={setAudioSourceId}
              setAudioFile={setAudioFile}
              windowSourceId={windowSourceId}
              setWindowSourceId={setWindowSourceId}
              audioStatus={audioStatus}
              audioError={audioError}
              onRestartAudio={() => void restart()}
            />
          )}

          {openPanel === 'camera' && (
            <div
              ref={panelRef}
              onMouseEnter={() => {
                isPanelHovered.current = true;
              }}
              onMouseLeave={() => {
                isPanelHovered.current = false;
              }}
            >
              <CameraPanel
                openAccordion={openAccordion}
                setOpenAccordion={setOpenAccordion}
                camera={camera}
                setCamera={setCamera}
                light={light}
                setLight={setLight}
                avatar={avatar}
                setAvatar={setAvatar}
              />
            </div>
          )}

          {openPanel === 'settings' && (
            <div ref={panelRef}>
              {desktopMode && (
                <DesktopPanel overlayMode={overlayMode} onOverlayModeToggle={handleOverlayModeToggle} />
              )}
              {desktopMode && (
                <>
                  <Divider />
                  <p className="settings-section-title">Directories</p>
                  <DirectoriesPanel
                    directories={directories}
                    onBrowse={handleBrowseDirectory}
                    onOpenFolder={handleOpenDirectory}
                    onClear={handleClearDirectory}
                    notice={directoriesNotice}
                  />
                </>
              )}
              <Divider />
              <p className="settings-section-title">VRoid Hub</p>
              <VroidHubPanel
                mode="settings"
                onCharacterSelected={handleSelectHubCharacter}
                onReactivateHub={handleReactivateHubCharacter}
                onHubCleared={handleHubCleared}
                loadedCharacterId={hubAvatar?.id ?? null}
                loadedCharacterActive={hubActive}
                hubSelectionState={hubSelectionState}
                onHubSelectionStart={handleHubSelectionStart}
                onHubSelectionError={handleHubSelectionError}
              />
              <Divider />
              <p className="settings-section-title">System</p>
              <button
                type="button"
                className="panel-button panel-button--danger"
                onClick={() => void handleResetAllSettings()}
              >
                Reset all settings
              </button>
              <p className="panel-note panel-note--compact">
                Preferences are saved to {settingsPath ? 'config.yaml' : 'local storage'} and restored on
                launch.
              </p>
              {settingsPath && (
                <p className="panel-note panel-note--compact panel-note--mono">{settingsPath}</p>
              )}
            </div>
          )}
        </GlassDrawer>
      </div>
    </div>
  );
}
