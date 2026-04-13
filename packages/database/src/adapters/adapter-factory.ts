import type {
  PersistenceAdapterKind,
  PersistenceRuntimeConfig,
  PersistenceSelection
} from "../contracts/persistence-runtime.js";

export interface PersistenceAdapterRegistry<TAdapter> {
  readonly inMemory: TAdapter;
  readonly postgres: TAdapter;
}

export function selectPersistenceAdapter<TAdapter>(
  config: PersistenceRuntimeConfig,
  registry: PersistenceAdapterRegistry<TAdapter>,
  requestedAdapter?: PersistenceAdapterKind
): TAdapter {
  const selection = resolvePersistenceSelection(config, requestedAdapter);
  return selection.adapter === "postgres" ? registry.postgres : registry.inMemory;
}

export function createDefaultPersistenceRuntimeConfig(): PersistenceRuntimeConfig {
  return {
    defaultAdapter: "in-memory",
    requestedAdapter: undefined,
    allowRuntimeSwitch: false
  };
}

export function resolvePersistenceSelection(
  config: PersistenceRuntimeConfig,
  requestedAdapter?: PersistenceAdapterKind
): PersistenceSelection {
  const desiredAdapter = requestedAdapter ?? config.requestedAdapter;

  if (!desiredAdapter || desiredAdapter === config.defaultAdapter) {
    return {
      adapter: config.defaultAdapter,
      reason: "default_adapter"
    };
  }

  if (!config.allowRuntimeSwitch) {
    return {
      adapter: config.defaultAdapter,
      reason: "runtime_switch_disabled"
    };
  }

  if (desiredAdapter === "postgres" && !config.postgresEnabled) {
    return {
      adapter: config.defaultAdapter,
      reason: "postgres_not_enabled"
    };
  }

  return {
    adapter: desiredAdapter,
    reason: "requested_adapter"
  };
}
