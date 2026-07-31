import { useCallback, useEffect, useRef, useState } from 'react';

const SPEAKING_THRESHOLD = 0.012;
const SILENCE_HOLD_MS = 180;

/**
 * @param {AudioNode | null} sourceNode
 * @param {AudioContext | null} audioContext
 * @param {{ monitor?: boolean }} [options]
 */
function createAnalyserChain(sourceNode, audioContext, options = {}) {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.55;

  sourceNode.connect(analyser);
  if (options.monitor) {
    sourceNode.connect(audioContext.destination);
  }

  const buffer = new Float32Array(analyser.fftSize);
  return { analyser, buffer };
}

function measureLevel(analyser, buffer) {
  analyser.getFloatTimeDomainData(buffer);
  let sum = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    sum += buffer[index] * buffer[index];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Reads amplitude from an active Web Audio graph.
 *
 * @param {boolean} enabled
 */
export function useAudioAnalyser(enabled) {
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);
  const bufferRef = useRef(null);
  const lastSpeechRef = useRef(0);

  const attach = useCallback((sourceNode, audioContext, options = {}) => {
    if (!sourceNode || !audioContext) return;
    const { analyser, buffer } = createAnalyserChain(sourceNode, audioContext, options);
    analyserRef.current = analyser;
    bufferRef.current = buffer;
  }, []);

  const detach = useCallback(() => {
    analyserRef.current = null;
    bufferRef.current = null;
    setLevel(0);
    setSpeaking(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      detach();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return undefined;
    }

    const tick = () => {
      const analyser = analyserRef.current;
      const buffer = bufferRef.current;
      if (analyser && buffer) {
        const nextLevel = measureLevel(analyser, buffer);
        setLevel(nextLevel);
        const now = performance.now();
        if (nextLevel > SPEAKING_THRESHOLD) {
          lastSpeechRef.current = now;
          setSpeaking(true);
        } else if (now - lastSpeechRef.current > SILENCE_HOLD_MS) {
          setSpeaking(false);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [detach, enabled]);

  return { attach, detach, level, speaking };
}
