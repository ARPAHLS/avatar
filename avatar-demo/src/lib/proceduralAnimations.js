// Procedural animation logic for VRM avatars (fallback when no VRMA clip is active)

export function applyProceduralAnimation(humanoid, animationState, t) {
  resetVrmPose(humanoid);
  const blendshape = humanoid?.vrm?.expressionManager ?? humanoid?.blendShapeProxy;

  if (animationState === 'idle') {
    const chest = humanoid.getNormalizedBoneNode('chest');
    const spine = humanoid.getNormalizedBoneNode('spine');
    const breathing = Math.sin(t * 1.5) * 0.06;
    if (chest) chest.position.y = 0.1 + breathing;
    else if (spine) spine.position.y = 0.1 + breathing;

    const head = humanoid.getNormalizedBoneNode('head');
    if (head) {
      head.rotation.z = Math.sin(t * 0.7) * 0.07;
      head.rotation.x = Math.sin(t * 0.2) * 0.03;
    }

    const leftEye = humanoid.getNormalizedBoneNode('leftEye');
    const rightEye = humanoid.getNormalizedBoneNode('rightEye');
    const eyeMove = Math.sin(t * 0.5) * 0.1;
    if (leftEye) leftEye.rotation.y = eyeMove;
    if (rightEye) rightEye.rotation.y = eyeMove;

    const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
    const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
    const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
    const leftHand = humanoid.getNormalizedBoneNode('leftHand');
    const rightHand = humanoid.getNormalizedBoneNode('rightHand');

    if (leftUpperArm) {
      leftUpperArm.rotation.z = Math.PI / 7;
      leftUpperArm.rotation.x = 0.25;
    }
    if (rightUpperArm) {
      rightUpperArm.rotation.z = -Math.PI / 7;
      rightUpperArm.rotation.x = 0.25;
    }
    if (leftLowerArm) leftLowerArm.rotation.z = 0.1;
    if (rightLowerArm) rightLowerArm.rotation.z = -0.1;
    if (leftHand) leftHand.rotation.x = 0.15;
    if (rightHand) rightHand.rotation.x = 0.15;

    setFingers(humanoid, 0.1);

    const jaw = humanoid.getNormalizedBoneNode('jaw');
    if (jaw) jaw.rotation.x = 0;

    resetExpressions(blendshape);
  } else if (animationState === 'laugh') {
    const head = humanoid.getNormalizedBoneNode('head');
    if (head) {
      head.rotation.x = 0.7 + Math.sin(t * 2) * 0.08;
      head.rotation.z = Math.sin(t * 1.2) * 0.04;
    }

    const jaw = humanoid.getNormalizedBoneNode('jaw');
    if (jaw) jaw.rotation.x = 1.2 + Math.abs(Math.sin(t * 2)) * 0.1;

    const chest = humanoid.getNormalizedBoneNode('chest');
    if (chest) chest.position.y = 0.1 + Math.abs(Math.sin(t * 4)) * 0.08;

    const leftEye = humanoid.getNormalizedBoneNode('leftEye');
    const rightEye = humanoid.getNormalizedBoneNode('rightEye');
    if (leftEye) leftEye.rotation.x = 0.12;
    if (rightEye) rightEye.rotation.x = 0.12;

    const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
    const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
    const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
    const leftHand = humanoid.getNormalizedBoneNode('leftHand');
    const rightHand = humanoid.getNormalizedBoneNode('rightHand');

    if (leftUpperArm) {
      leftUpperArm.rotation.x = 1.0;
      leftUpperArm.rotation.z = 0.4;
    }
    if (rightUpperArm) {
      rightUpperArm.rotation.x = 1.0;
      rightUpperArm.rotation.z = -0.4;
    }
    if (leftLowerArm) leftLowerArm.rotation.z = 0.1;
    if (rightLowerArm) rightLowerArm.rotation.z = -0.1;
    if (leftHand) leftHand.rotation.x = 0.5;
    if (rightHand) rightHand.rotation.x = 0.5;

    setFingers(humanoid, 0.4);

    if (blendshape) {
      setExpression(blendshape, 'happy', 1);
      setExpression(blendshape, 'aa', 0.6);
      setExpression(blendshape, 'ee', 0.3);
      setExpression(blendshape, 'blink', 0.1);
    }
  } else if (animationState === 'test') {
    const tSlow = t * 0.15;
    const tMicro = t * 0.7;

    const hips = humanoid.getNormalizedBoneNode('hips');
    if (hips) {
      hips.position.x = Math.sin(tSlow) * 0.02;
      hips.position.z = Math.cos(tSlow) * 0.01;
    }

    const chest = humanoid.getNormalizedBoneNode('chest');
    if (chest) chest.position.y = 0.1 + Math.sin(t * 0.8) * 0.02;

    const head = humanoid.getNormalizedBoneNode('head');
    if (head) {
      head.rotation.x = Math.sin(tSlow) * 0.03;
      head.rotation.z = Math.cos(tSlow) * 0.02;
    }

    const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm');
    const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm');
    const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm');
    const leftHand = humanoid.getNormalizedBoneNode('leftHand');
    const rightHand = humanoid.getNormalizedBoneNode('rightHand');

    if (leftUpperArm) {
      leftUpperArm.rotation.z = Math.PI / 7 + Math.sin(tSlow) * 0.02;
      leftUpperArm.rotation.x = 0.18 + Math.cos(tSlow) * 0.01;
    }
    if (leftLowerArm) leftLowerArm.rotation.z = 0.08;
    if (leftHand) leftHand.rotation.x = 0.12;

    if (rightUpperArm) {
      rightUpperArm.rotation.z = -Math.PI / 2.2;
      rightUpperArm.rotation.x = 0.35;
    }
    if (rightLowerArm) rightLowerArm.rotation.z = -1.1;
    if (rightHand) rightHand.rotation.x = 0.2;

    setFingers(humanoid, 0.08 + Math.sin(tMicro) * 0.02);

    if (blendshape) {
      setExpression(blendshape, 'blink', Math.abs(Math.sin(t * 0.25)) > 0.98 ? 1 : 0);
      setExpression(blendshape, 'happy', 0.05);
    }
  }
}

function setExpression(manager, name, value) {
  if (manager.setValue(name, value) === undefined) {
    manager.setValue(name.charAt(0).toUpperCase() + name.slice(1), value);
  }
}

function resetExpressions(blendshape) {
  if (!blendshape) return;
  const names = ['happy', 'angry', 'sad', 'relaxed', 'aa', 'ih', 'ou', 'ee', 'oh', 'blink'];
  for (const name of names) {
    setExpression(blendshape, name, 0);
  }
}

function resetVrmPose(humanoid) {
  const bones = [
    'hips', 'chest', 'spine', 'head', 'jaw',
    'leftEye', 'rightEye',
    'leftHand', 'rightHand',
    'leftUpperArm', 'rightUpperArm',
    'leftLowerArm', 'rightLowerArm',
    'leftThumbProximal', 'leftThumbIntermediate', 'leftThumbDistal',
    'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
    'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
    'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
    'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
    'rightThumbProximal', 'rightThumbIntermediate', 'rightThumbDistal',
    'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
    'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
    'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
    'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal',
  ];

  for (const bone of bones) {
    const node = humanoid.getNormalizedBoneNode(bone);
    if (node) {
      node.position.set(0, 0, 0);
      node.rotation.set(0, 0, 0);
    }
  }
}

function setFingers(humanoid, curl) {
  const fingers = [
    'leftThumbProximal', 'leftThumbIntermediate', 'leftThumbDistal',
    'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
    'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
    'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
    'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
    'rightThumbProximal', 'rightThumbIntermediate', 'rightThumbDistal',
    'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
    'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
    'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
    'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal',
  ];

  for (const bone of fingers) {
    const node = humanoid.getNormalizedBoneNode(bone);
    if (node) node.rotation.x = curl;
  }
}
