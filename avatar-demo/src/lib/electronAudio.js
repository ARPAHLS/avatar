/**
 * Capture audio from a specific desktop/window source (Electron).
 * @param {string} sourceId
 */
export async function captureDesktopSource(sourceId) {
  if (!sourceId) {
    throw new Error('No window or screen selected.');
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
      },
    },
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
      },
    },
  });
}

/** System loopback via Chromium display capture (Electron handler supplies loopback audio). */
export async function captureSystemLoopback() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  });

  for (const track of stream.getVideoTracks()) {
    track.stop();
  }

  if (stream.getAudioTracks().length === 0) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    throw new Error('No system audio track available. Try picking a specific window instead.');
  }

  return stream;
}

/** @param {MediaStream} stream */
export function stopMediaStream(stream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
