import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { defaultAnimationId } from '../config/animations';
import { getDefaultAudioSourceId } from '../config/audioSources';
import { defaultColor } from '../config/environments';
import { defaultAvatarId, defaultSkinId, resolveAvatarPath, listSkinsForAvatar } from '../config/avatars';
import { defaultAvatar, defaultCamera, defaultLight, STAGE } from '../config/defaults';
import { defaultWindowScale, normalizeWindowScale } from '../config/windowScale';
import { createDefaultUserSettings, snapshotUserSettings } from '../config/userSettings';
import { useAudioSource } from '../hooks/useAudioSource';
import { getDesktopApi, isDesktopMode } from '../lib/desktopMode';
import { loadUserSettings, resetUserSettings, saveUserSettings } from '../lib/userSettingsStore';
import { VrmAvatar } from './avatar/VrmAvatar';
import { AvatarStageShell } from './avatar/AvatarStageShell';
import { CameraController } from './ui/CameraController';
import { GlassDrawer } from './ui/GlassDrawer';
import { Divider } from './ui/PanelPrimitives';
import { PalettePanel } from './panels/PalettePanel';
import { VoicePanel } from './panels/VoicePanel';
import { CameraPanel } from './panels/CameraPanel';
import { DesktopPanel } from './panels/DesktopPanel';
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

  const handleAvatarChange = useCallback(
    (avatarId) => {
      setAvatarReady(false);
      setHubActive(false);
      setSelectedAvatarId(avatarId);
      const skins = listSkinsForAvatar(avatarId);
      const nextSkin =
        skins.find((skin) => skin.id === selectedSkinId)?.id ??
        skins.find((skin) => skin.id === defaultSkinId)?.id ??
        skins[0]?.id ??
        defaultSkinId;
      setSelectedSkinId(nextSkin);
    },
    [selectedSkinId],
  );

  const handleSkinChange = useCallback((skinId) => {
    setAvatarReady(false);
    setHubActive(false);
    setSelectedSkinId(skinId);
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
    hubActive && hubAvatar ? hubAvatar.blobUrl : resolveAvatarPath(selectedAvatarId, selectedSkinId);

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
              selectedAvatarId={selectedAvatarId}
              onAvatarChange={handleAvatarChange}
              selectedSkinId={selectedSkinId}
              onSkinChange={handleSkinChange}
              selectedBg={selectedBg}
              setSelectedBg={setSelectedBg}
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
              audioFile={audioFile}
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
              <Divider />
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
