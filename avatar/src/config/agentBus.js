/**
 * The user-visible half of the local agent bus (Refs #6), free of asset imports
 * so `node --test` can load it.
 *
 * The token is deliberately absent: `config.yaml` is a snapshot of live stage
 * state, rewritten by the renderer on every change, while the token has to be
 * readable by the main process before a window exists. It lives encrypted
 * beside the VRoid Hub credentials instead — see electron/agent-bus-token.cjs.
 */

/** Keep in step with DEFAULT_AGENT_BUS_PORT in electron/agent-bus.cjs. */
export const defaultAgentBusPort = 47903;

const MIN_PORT = 1024;
const MAX_PORT = 65535;

/** @typedef {{ enabled: boolean, port: number, requireToken: boolean }} AgentBusSettings */

/** @returns {AgentBusSettings} */
export function createDefaultAgentBus() {
  return { enabled: false, port: defaultAgentBusPort, requireToken: true };
}

/** @param {unknown} value */
export function normalizeAgentBusPort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) return defaultAgentBusPort;
  return port;
}

/**
 * @param {unknown} raw
 * @returns {AgentBusSettings}
 */
export function normalizeAgentBus(raw) {
  const defaults = createDefaultAgentBus();
  if (!raw || typeof raw !== 'object') return defaults;

  const data = /** @type {Record<string, unknown>} */ (raw);
  return {
    // Opt-in: an absent or malformed section leaves the bus off.
    enabled: data.enabled === true,
    port: normalizeAgentBusPort(data.port),
    // Only an explicit false turns the token off, so a hand-edited file that
    // drops the key stays authenticated.
    requireToken: data.requireToken !== false,
  };
}
