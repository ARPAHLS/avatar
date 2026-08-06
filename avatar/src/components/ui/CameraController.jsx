import { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

export function CameraController({ cameraState }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...cameraState.position);
    camera.fov = cameraState.fov;
    camera.updateProjectionMatrix();
  }, [camera, cameraState]);

  useFrame(() => {
    camera.lookAt(...cameraState.lookAt);
  });

  return null;
}
