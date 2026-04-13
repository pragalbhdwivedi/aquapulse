import type { PersistenceAdapterKind, PersistenceRuntimeConfig } from "../contracts/persistence-runtime.js";

export interface PersistenceAdapterRegistry<TAdapter> {
  readonly inMemory: TAdapter;
  readonly postgres: TAdapter;
}

export function selectPersistenceAdapter<TAdapter>(
  config: PersistenceRuntimeConfig,
  registry: PersistenceAdapterRegistry<TAdapter>,
  requestedAdapter?: PersistenceAdapterKind
): TAdapter {
  const adapterKind = requestedAdapter && config.allowRuntimeSwitch ? requestedAdapter : config.defaultAdapter;
  return adapterKind === "postgres" ? registry.postgres : registry.inMemory;
}

export function createDefaultPersistenceRuntimeConfig(): PersistenceRuntimeConfig {
  return {
    defaultAdapter: "in-memory",
    allowRuntimeSwitch: false
  };
}
