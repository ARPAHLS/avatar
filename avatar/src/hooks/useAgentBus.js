import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAgentBusApi } from '../lib/desktopMode';

/**
 * The window's half of the local agent bus (Refs #6).
 *
 * Three one-way hops, no request/response channel: this reports what is on
 * stage, the main process validates an incoming request against that report
 * and answers the caller itself, and whatever it accepted comes back here to
 * be applied. Acceptance happens in main, application happens here — which is
 * why a 200 means "accepted", not "the model has finished loading".
 *
 * Desktop only: `getAgentBusApi()` is null in the browser build and every
 * effect below turns into a no-op.
 *
 * @param {Object} args
 * @param {import('../config/agentBus').AgentBusSettings} args.settings
 * @param {{ context: unknown, state: unknown }} args.snapshot What the bus may
 * be asked for, and what it is allowed to ask for.
 * @param {(action: import('../lib/stageCommands').StageAction) => void} args.applyAction
 * @param {boolean} args.ready False until config.yaml has been read — starting
 * the server before that would bind the default port, then rebind to the
 * user's.
 */
export function useAgentBus({ settings, snapshot, applyAction, ready }) {
  const api = useMemo(() => getAgentBusApi(), []);
  const [status, setStatus] = useState(null);

  // The listener is registered once; keeping the callback in a ref means a
  // re-render cannot drop an action arriving mid-swap.
  const applyRef = useRef(applyAction);
  useEffect(() => {
    applyRef.current = applyAction;
  }, [applyAction]);

  const { enabled, port, requireToken } = settings;

  useEffect(() => {
    if (!api || !ready) return undefined;

    let cancelled = false;
    void api
      .configure({ enabled, port, requireToken })
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [api, ready, enabled, port, requireToken]);

  // Every change to the catalog or the selection, whatever caused it. Until
  // the first one lands, the bus answers 503 rather than guessing — which is
  // also why `enabled` is a dependency and not just a guard: switching the bus
  // on has to send the report the running server is about to need.
  useEffect(() => {
    if (!api || !enabled) return;
    api.report(snapshot);
  }, [api, enabled, snapshot]);

  useEffect(() => {
    if (!api?.onAction) return undefined;
    return api.onAction((action) => applyRef.current?.(action));
  }, [api]);

  const rotateToken = useCallback(async () => {
    if (!api?.rotateToken) return null;
    const next = await api.rotateToken();
    setStatus(next);
    return next;
  }, [api]);

  return { status, rotateToken };
}
