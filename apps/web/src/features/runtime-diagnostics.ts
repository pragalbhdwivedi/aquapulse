import type { FrontendRuntimeDiagnostics } from "@aquapulse/types";
import {
  getFrontendRuntimeDiagnostics,
  parseClientRuntimeConfig,
  type AquaPulseClientRuntimeEnv
} from "../clients/runtime-config";
import {
  readAlertsLocalProxyConfig,
  type AlertsLocalProxyEnv
} from "../server/alerts-local-proxy";

export type FrontendRuntimeEnvSource = AquaPulseClientRuntimeEnv & AlertsLocalProxyEnv;

export function readFrontendRuntimeDiagnostics(
  env: FrontendRuntimeEnvSource = process.env
): FrontendRuntimeDiagnostics {
  const runtimeConfig = parseClientRuntimeConfig(env);
  const localBridgeConfig = readAlertsLocalProxyConfig(env);

  return getFrontendRuntimeDiagnostics(runtimeConfig, localBridgeConfig);
}
