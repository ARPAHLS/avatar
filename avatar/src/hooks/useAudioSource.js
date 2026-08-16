import { useCallback, useEffect, useRef, useState } from 'react';
import { formatAudioCaptureError } from '../lib/audioCaptureCopy';
import { captureDesktopSource, captureSystemLoopback } from '../lib/electronAudio';
import { useAudioAnalyser } from './useAudioAnalyser';

/**
 * @param {'none' | 'microphone' | 'tab' | 'file' | 'system' | 'window'} sourceId
 * @param {File | null} [audioFile]
 * @param {{ windowSourceId?: string | null }} [options]
 */
export function useAudioSource(sourceId, audioFile = null, options = {}) {
  const { windowSourceId = null } = options;
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const audioElementRef = useRef(null);
  const enabled = sourceId !== 'none';

  const { attach, detach, level, speaking } = useAudioAnalyser(enabled);

  const cleanup = useCallback(async () => {
    detach();

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // already disconnected
      }
      sourceNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // ignore close race
      }
      audioContextRef.current = null;
    }
  }, [detach]);

  const start = useCallback(async () => {
    await cleanup();
    setError(null);

    if (sourceId === 'none') {
      setStatus('idle');
      return;
    }

    setStatus('starting');

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      let stream;

      if (sourceId === 'microphone') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else if (sourceId === 'tab') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          audio: true,
          video: true,
        });
        for (const track of stream.getVideoTracks()) {
          track.stop();
        }
      } else if (sourceId === 'system') {
        stream = await captureSystemLoopback();
      } else if (sourceId === 'window') {
        if (!windowSourceId) {
          setStatus('awaiting-window');
          await audioContext.close();
          audioContextRef.current = null;
          return;
        }
        stream = await captureDesktopSource(windowSourceId);
        for (const track of stream.getVideoTracks()) {
          track.stop();
        }
      } else if (sourceId === 'file') {
        if (!audioFile) {
          setStatus('awaiting-file');
          await audioContext.close();
          audioContextRef.current = null;
          return;
        }
        const objectUrl = URL.createObjectURL(audioFile);
        const audio = new Audio(objectUrl);
        audio.crossOrigin = 'anonymous';
        audio.loop = true;
        audioElementRef.current = audio;
        await audio.play();
        const source = audioContext.createMediaElementSource(audio);
        sourceNodeRef.current = source;
        attach(source, audioContext, { monitor: true });

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        setStatus('active');
        return;
      } else {
        throw new Error('Unknown audio source.');
      }

      if (!stream || stream.getAudioTracks().length === 0) {
        throw new Error('No audio track available from the selected source.');
      }

      mediaStreamRef.current = stream;
      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      attach(source, audioContext, { monitor: false });

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      setStatus('active');
    } catch (cause) {
      setError(formatAudioCaptureError(cause));
      setStatus('error');
      await cleanup();
    }
  }, [attach, audioFile, cleanup, sourceId, windowSourceId]);

  useEffect(() => {
    void start();
    return () => {
      void cleanup();
    };
  }, [cleanup, start]);

  return {
    level,
    speaking,
    status,
    error,
    restart: start,
  };
}
