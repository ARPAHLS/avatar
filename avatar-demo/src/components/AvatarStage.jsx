import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { defaultAnimationId } from '../config/animations';
import { getDefaultAudioSourceId } from '../config/audioSources';
import { defaultColor } from '../config/environments';
import { defaultAvatarId, defaultSkinId, resolveAvatarPath, listSkinsForAvatar } from '../config/avatars';
import { defaultAvatar, defaultCamera, defaultLight, STAGE } from '../config/defaults';
import { defaultWindowScale, normalizeWindowScale } from '../config/windowScale';
import { useAudioSource } from '../hooks/useAudioSource';
import { getDesktopApi, isDesktopMode } from '../lib/desktopMode';
import { VrmAvatar } from './avatar/VrmAvatar';
import { AvatarStageShell } from './avatar/AvatarStageShell';
import { CameraController } from './ui/CameraController';
import { GlassDrawer } from './ui/GlassDrawer';
import { PalettePanel } from './panels/PalettePanel';
import { VoicePanel } from './panels/VoicePanel';
import { CameraPanel } from './panels/CameraPanel';
import { DesktopPanel } from './panels/DesktopPanel';

const desktopMode = isDesktopMode();

export function AvatarStage() {
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
  const panelRef = useRef(null);
  const drawerRef = useRef(null);
  const commandMenuRef = useRef(null);
  const scaleMenuRef = useRef(null);
  const isPanelHovered = useRef(false);

  const desktopApi = getDesktopApi();

  const { level, speaking, status: audioStatus, error: audioError, restart } = useAudioSource(
    audioSourceId,
    audioFile,
    { windowSourceId },
  );

  const lipSyncEnabled = audioSourceId !== 'none' && audioStatus === 'active';

  useEffect(() => {
    if (!desktopApi?.getOverlayMode) return;
    void desktopApi.getOverlayMode().then((mode) => {
      setOverlayMode(mode);
      document.documentElement.classList.toggle('vox-desktop-windowed', !mode);
    });
  }, [desktopApi]);

  useEffect(() => {
    if (!desktopApi?.getWindowScale) return;
    void desktopApi.getWindowScale().then((scale) => {
      setWindowScale(normalizeWindowScale(scale));
    });
  }, [desktopApi]);

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
    setSelectedSkinId(skinId);
  }, []);

  const modelPath = resolveAvatarPath(selectedAvatarId, selectedSkinId);

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

  return (
    <div className="avatar-stage">
      <div
        className={`avatar-hover-area ${avatarReady ? 'avatar-hover-area--ready' : ''}`}
        ref={hoverAreaRef}
        style={{ width: STAGE.width, height: STAGE.height }}
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
              <p className="panel-note panel-note--compact">
                Expression triggers and keyword-driven animations are planned for a later milestone.
              </p>
            </div>
          )}
        </GlassDrawer>
      </div>
    </div>
  );
}
