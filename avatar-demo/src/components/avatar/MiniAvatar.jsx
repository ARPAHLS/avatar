import { Canvas } from '@react-three/fiber';
import { VrmAvatar } from './VrmAvatar';

export function MiniAvatar({ modelPath, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`mini-avatar ${selected ? 'mini-avatar--selected' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
    >
      <div className="mini-avatar__canvas-wrap">
        <Canvas
          camera={{ position: [0, 1.1, 0.7], fov: 24 }}
          style={{ width: 56, height: 56, background: 'transparent' }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 1.0, 0);
          }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[1, 2, 2]} intensity={0.7} color="#fff" />
          <VrmAvatar
            modelPath={modelPath}
            animationId="idle"
            avatarPosition={[0, -0.54, 0]}
            avatarRotation={[0, 0, 0]}
          />
        </Canvas>
      </div>
    </div>
  );
}
