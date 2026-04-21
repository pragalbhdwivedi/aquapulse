import type {
  BackendHealthDiagnostics,
  BackendRuntimeDiagnostics,
  BackendRuntimeProbeDiagnostics,
  FrontendRuntimeDiagnostics,
  RuntimeWarning
} from "@aquapulse/types";
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

export interface RuntimeProbeEnvSource {
  readonly AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES?: string;
  readonly NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES?: string;
  readonly AQUAPULSE_WEB_RUNTIME_PROBE_TIMEOUT_MS?: string;
}

export interface RuntimeProbeConfig {
  readonly enabled: boolean;
  readonly timeoutMs: number;
  readonly targetBaseUrl: string;
  readonly warnings: readonly RuntimeWarning[];
}

export interface AlertsEndToEndRuntimeStatus {
  readonly requestedMode: FrontendRuntimeDiagnostics["alerts"]["requestedMode"];
  readonly effectiveFrontendMode: FrontendRuntimeDiagnostics["alerts"]["effectiveMode"];
  readonly backendReachability: BackendRuntimeProbeDiagnostics["status"] | "not_requested";
  readonly backendAdapter: BackendRuntimeDiagnostics["alerts"]["effectiveAdapter"] | "unknown";
  readonly localBridgeActive: boolean;
  readonly cutoverActive: boolean;
  readonly statusLabel: string;
  readonly warnings: readonly RuntimeWarning[];
}

export interface WaterQualityEndToEndRuntimeStatus {
  readonly requestedMode: FrontendRuntimeDiagnostics["waterQuality"]["requestedMode"];
  readonly effectiveFrontendMode: FrontendRuntimeDiagnostics["waterQuality"]["effectiveMode"];
  readonly backendReachability: BackendRuntimeProbeDiagnostics["status"] | "not_requested";
  readonly backendAdapter: BackendRuntimeDiagnostics["waterQuality"]["effectiveAdapter"] | "unknown";
  readonly localBridgeActive: boolean;
  readonly cutoverActive: boolean;
  readonly statusLabel: string;
  readonly warnings: readonly RuntimeWarning[];
}

export interface FeedEndToEndRuntimeStatus {
  readonly requestedMode: FrontendRuntimeDiagnostics["feed"]["requestedMode"];
  readonly effectiveFrontendMode: FrontendRuntimeDiagnostics["feed"]["effectiveMode"];
  readonly backendReachability: BackendRuntimeProbeDiagnostics["status"] | "not_requested";
  readonly backendAdapter: NonNullable<BackendRuntimeDiagnostics["feed"]>["effectiveAdapter"] | "unknown";
  readonly localBridgeActive: boolean;
  readonly cutoverActive: boolean;
  readonly statusLabel: string;
  readonly warnings: readonly RuntimeWarning[];
}

export interface TasksEndToEndRuntimeStatus {
  readonly requestedMode: FrontendRuntimeDiagnostics["tasks"]["requestedMode"];
  readonly effectiveFrontendMode: FrontendRuntimeDiagnostics["tasks"]["effectiveMode"];
  readonly backendReachability: BackendRuntimeProbeDiagnostics["status"] | "not_requested";
  readonly backendAdapter: NonNullable<BackendRuntimeDiagnostics["tasks"]>["effectiveAdapter"] | "unknown";
  readonly localBridgeActive: boolean;
  readonly cutoverActive: boolean;
  readonly statusLabel: string;
  readonly warnings: readonly RuntimeWarning[];
}

function parseBooleanFlag(value: string | undefined): boolean {
  const normalizedValue = value?.trim().toLowerCase();
  return normalizedValue === "1" || normalizedValue === "true" || normalizedValue === "yes" || normalizedValue === "on";
}

function parseTimeoutMs(value: string | undefined): number {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 100 || parsedValue > 10000) {
    return 1500;
  }

  return parsedValue;
}

export function readFrontendRuntimeDiagnostics(
  env: FrontendRuntimeEnvSource = process.env
): FrontendRuntimeDiagnostics {
  const runtimeConfig = parseClientRuntimeConfig(env);
  const localBridgeConfig = readAlertsLocalProxyConfig(env);

  return getFrontendRuntimeDiagnostics(runtimeConfig, localBridgeConfig);
}

export function readRuntimeProbeConfig(
  env: FrontendRuntimeEnvSource & RuntimeProbeEnvSource = process.env
): RuntimeProbeConfig {
  const localBridgeConfig = readAlertsLocalProxyConfig(env);
  const warnings: RuntimeWarning[] = [];
  const enabled = parseBooleanFlag(
    env.AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES ?? env.NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES
  );
  const timeoutMs = parseTimeoutMs(env.AQUAPULSE_WEB_RUNTIME_PROBE_TIMEOUT_MS);

  if (!enabled) {
    warnings.push({
      code: "PROBE_DISABLED",
      message:
        "Runtime probing is disabled by default. Enable AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES to probe backend health endpoints from the web diagnostics page."
    });
  }

  return {
    enabled,
    timeoutMs,
    targetBaseUrl: localBridgeConfig.backendBaseUrl,
    warnings
  };
}

export function deriveAlertsEndToEndRuntimeStatus(
  diagnostics: FrontendRuntimeDiagnostics,
  backendProbe?: BackendRuntimeProbeDiagnostics
): AlertsEndToEndRuntimeStatus {
  const warnings: RuntimeWarning[] = [...diagnostics.warnings, ...(backendProbe?.warnings ?? [])];
  const backendReachability = backendProbe?.status ?? "not_requested";
  const backendAdapter = backendProbe?.runtime?.alerts.effectiveAdapter ?? "unknown";
  const cutoverActive =
    diagnostics.alerts.effectiveMode === "http" &&
    (backendProbe?.status === "reachable" || backendProbe?.status === "partial") &&
    backendProbe?.runtime?.alerts.cutoverActive === true;

  if (diagnostics.alerts.effectiveMode !== "http") {
    return {
      requestedMode: diagnostics.alerts.requestedMode,
      effectiveFrontendMode: diagnostics.alerts.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.alerts.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "Mock runtime active",
      warnings
    };
  }

  if (!backendProbe || backendProbe.status === "disabled") {
    return {
      requestedMode: diagnostics.alerts.requestedMode,
      effectiveFrontendMode: diagnostics.alerts.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.alerts.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode requested; backend adapter not yet verified",
      warnings
    };
  }

  if (backendProbe.status === "unreachable") {
    return {
      requestedMode: diagnostics.alerts.requestedMode,
      effectiveFrontendMode: diagnostics.alerts.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.alerts.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode active; backend not reached",
      warnings
    };
  }

  if (cutoverActive) {
    return {
      requestedMode: diagnostics.alerts.requestedMode,
      effectiveFrontendMode: diagnostics.alerts.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.alerts.usesLocalProxy,
      cutoverActive,
      statusLabel: "HTTP + Postgres alerts cutover verified",
      warnings
    };
  }

  return {
    requestedMode: diagnostics.alerts.requestedMode,
    effectiveFrontendMode: diagnostics.alerts.effectiveMode,
    backendReachability,
    backendAdapter,
    localBridgeActive: diagnostics.alerts.usesLocalProxy,
    cutoverActive: false,
    statusLabel:
      backendAdapter === "in-memory"
        ? "HTTP mode active; backend alerts still use in-memory"
        : "HTTP mode active; backend alerts cutover not fully verified",
    warnings
  };
}

export function deriveFeedEndToEndRuntimeStatus(
  diagnostics: FrontendRuntimeDiagnostics,
  backendProbe?: BackendRuntimeProbeDiagnostics
): FeedEndToEndRuntimeStatus {
  const warnings: RuntimeWarning[] = [...diagnostics.warnings, ...(backendProbe?.warnings ?? [])];
  const backendReachability = backendProbe?.status ?? "not_requested";
  const backendAdapter = backendProbe?.runtime?.feed?.effectiveAdapter ?? "unknown";
  const cutoverActive =
    diagnostics.feed.effectiveMode === "http" &&
    (backendProbe?.status === "reachable" || backendProbe?.status === "partial") &&
    backendProbe?.runtime?.feed?.cutoverActive === true;

  if (diagnostics.feed.effectiveMode !== "http") {
    return {
      requestedMode: diagnostics.feed.requestedMode,
      effectiveFrontendMode: diagnostics.feed.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.feed.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "Mock runtime active",
      warnings
    };
  }

  if (!backendProbe || backendProbe.status === "disabled") {
    return {
      requestedMode: diagnostics.feed.requestedMode,
      effectiveFrontendMode: diagnostics.feed.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.feed.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode requested; backend adapter not yet verified",
      warnings
    };
  }

  if (backendProbe.status === "unreachable") {
    return {
      requestedMode: diagnostics.feed.requestedMode,
      effectiveFrontendMode: diagnostics.feed.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.feed.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode active; backend not reached",
      warnings
    };
  }

  if (cutoverActive) {
    return {
      requestedMode: diagnostics.feed.requestedMode,
      effectiveFrontendMode: diagnostics.feed.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.feed.usesLocalProxy,
      cutoverActive,
      statusLabel: "HTTP + Postgres feed cutover verified",
      warnings
    };
  }

  return {
    requestedMode: diagnostics.feed.requestedMode,
    effectiveFrontendMode: diagnostics.feed.effectiveMode,
    backendReachability,
    backendAdapter,
    localBridgeActive: diagnostics.feed.usesLocalProxy,
    cutoverActive: false,
    statusLabel:
      backendAdapter === "in-memory"
        ? "HTTP mode active; backend feed still uses in-memory"
        : "HTTP mode active; backend feed cutover not fully verified",
    warnings
  };
}

export function deriveTasksEndToEndRuntimeStatus(
  diagnostics: FrontendRuntimeDiagnostics,
  backendProbe?: BackendRuntimeProbeDiagnostics
): TasksEndToEndRuntimeStatus {
  const warnings: RuntimeWarning[] = [...diagnostics.warnings, ...(backendProbe?.warnings ?? [])];
  const backendReachability = backendProbe?.status ?? "not_requested";
  const backendAdapter = backendProbe?.runtime?.tasks?.effectiveAdapter ?? "unknown";
  const cutoverActive =
    diagnostics.tasks.effectiveMode === "http" &&
    (backendProbe?.status === "reachable" || backendProbe?.status === "partial") &&
    backendProbe?.runtime?.tasks?.cutoverActive === true;

  if (diagnostics.tasks.effectiveMode !== "http") {
    return {
      requestedMode: diagnostics.tasks.requestedMode,
      effectiveFrontendMode: diagnostics.tasks.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.tasks.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "Mock runtime active",
      warnings
    };
  }

  if (!backendProbe || backendProbe.status === "disabled") {
    return {
      requestedMode: diagnostics.tasks.requestedMode,
      effectiveFrontendMode: diagnostics.tasks.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.tasks.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode requested; backend adapter not yet verified",
      warnings
    };
  }

  if (backendProbe.status === "unreachable") {
    return {
      requestedMode: diagnostics.tasks.requestedMode,
      effectiveFrontendMode: diagnostics.tasks.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.tasks.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode active; backend not reached",
      warnings
    };
  }

  if (cutoverActive) {
    return {
      requestedMode: diagnostics.tasks.requestedMode,
      effectiveFrontendMode: diagnostics.tasks.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.tasks.usesLocalProxy,
      cutoverActive,
      statusLabel: "HTTP + Postgres tasks cutover verified",
      warnings
    };
  }

  return {
    requestedMode: diagnostics.tasks.requestedMode,
    effectiveFrontendMode: diagnostics.tasks.effectiveMode,
    backendReachability,
    backendAdapter,
    localBridgeActive: diagnostics.tasks.usesLocalProxy,
    cutoverActive: false,
    statusLabel:
      backendAdapter === "in-memory"
        ? "HTTP mode active; backend tasks still use in-memory"
        : "HTTP mode active; backend tasks cutover not fully verified",
    warnings
  };
}

export function deriveWaterQualityEndToEndRuntimeStatus(
  diagnostics: FrontendRuntimeDiagnostics,
  backendProbe?: BackendRuntimeProbeDiagnostics
): WaterQualityEndToEndRuntimeStatus {
  const warnings: RuntimeWarning[] = [...diagnostics.warnings, ...(backendProbe?.warnings ?? [])];
  const backendReachability = backendProbe?.status ?? "not_requested";
  const backendAdapter = backendProbe?.runtime?.waterQuality.effectiveAdapter ?? "unknown";
  const cutoverActive =
    diagnostics.waterQuality.effectiveMode === "http" &&
    (backendProbe?.status === "reachable" || backendProbe?.status === "partial") &&
    backendProbe?.runtime?.waterQuality.cutoverActive === true;

  if (diagnostics.waterQuality.effectiveMode !== "http") {
    return {
      requestedMode: diagnostics.waterQuality.requestedMode,
      effectiveFrontendMode: diagnostics.waterQuality.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.waterQuality.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "Mock runtime active",
      warnings
    };
  }

  if (!backendProbe || backendProbe.status === "disabled") {
    return {
      requestedMode: diagnostics.waterQuality.requestedMode,
      effectiveFrontendMode: diagnostics.waterQuality.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.waterQuality.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode requested; backend adapter not yet verified",
      warnings
    };
  }

  if (backendProbe.status === "unreachable") {
    return {
      requestedMode: diagnostics.waterQuality.requestedMode,
      effectiveFrontendMode: diagnostics.waterQuality.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.waterQuality.usesLocalProxy,
      cutoverActive: false,
      statusLabel: "HTTP mode active; backend not reached",
      warnings
    };
  }

  if (cutoverActive) {
    return {
      requestedMode: diagnostics.waterQuality.requestedMode,
      effectiveFrontendMode: diagnostics.waterQuality.effectiveMode,
      backendReachability,
      backendAdapter,
      localBridgeActive: diagnostics.waterQuality.usesLocalProxy,
      cutoverActive,
      statusLabel: "HTTP + Postgres water-quality cutover verified",
      warnings
    };
  }

  return {
    requestedMode: diagnostics.waterQuality.requestedMode,
    effectiveFrontendMode: diagnostics.waterQuality.effectiveMode,
    backendReachability,
    backendAdapter,
    localBridgeActive: diagnostics.waterQuality.usesLocalProxy,
    cutoverActive: false,
    statusLabel:
      backendAdapter === "in-memory"
        ? "HTTP mode active; backend water-quality still uses in-memory"
        : "HTTP mode active; backend water-quality cutover not fully verified",
    warnings
  };
}

function jsonHeaders(): HeadersInit {
  return {
    accept: "application/json"
  };
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch
): Promise<Response> {
  const controller = typeof AbortController === "function" ? new AbortController() : undefined;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : undefined;

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller?.signal
    });
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export async function probeBackendRuntimeDiagnostics(
  config: RuntimeProbeConfig,
  fetchImpl: typeof fetch = fetch
): Promise<BackendRuntimeProbeDiagnostics> {
  if (!config.enabled) {
    return {
      enabled: false,
      status: "disabled",
      targetLabel: config.targetBaseUrl,
      warnings: [...config.warnings]
    };
  }

  const checkedAt = new Date().toISOString();

  try {
    const [healthResponse, runtimeResponse] = await Promise.all([
      fetchWithTimeout(`${config.targetBaseUrl}/api/health`, { method: "GET", headers: jsonHeaders() }, config.timeoutMs, fetchImpl),
      fetchWithTimeout(`${config.targetBaseUrl}/api/diagnostics/runtime`, { method: "GET", headers: jsonHeaders() }, config.timeoutMs, fetchImpl)
    ]);

    const health = (await healthResponse.json()) as BackendHealthDiagnostics;
    const runtime = (await runtimeResponse.json()) as BackendRuntimeDiagnostics;
    const warnings: RuntimeWarning[] = [...config.warnings];
    const allOk = healthResponse.ok && runtimeResponse.ok;

    if (!healthResponse.ok || !runtimeResponse.ok) {
      warnings.push({
        code: "PROBE_PARTIAL_RESPONSE",
        message:
          "The backend responded, but one or more diagnostics endpoints did not return a successful response."
      });
    }

    return {
      enabled: true,
      status: allOk ? "reachable" : "partial",
      targetLabel: config.targetBaseUrl,
      checkedAt,
      health,
      runtime,
      warnings
    };
  } catch (error) {
    return {
      enabled: true,
      status: "unreachable",
      targetLabel: config.targetBaseUrl,
      checkedAt,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Runtime diagnostics probe could not reach the backend.",
      warnings: [
        ...config.warnings,
        {
          code: "PROBE_UNREACHABLE",
          message:
            "The frontend diagnostics probe could not reach the backend health endpoints. Local runtime diagnostics still reflect safe frontend assumptions."
        }
      ]
    };
  }
}
