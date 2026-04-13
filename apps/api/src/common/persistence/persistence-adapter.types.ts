import {
  createDefaultPersistenceRuntimeConfig,
  selectPersistenceAdapter,
  type PersistenceAdapterKind,
  type PersistenceAdapterRegistry,
  type PersistenceRuntimeConfig
} from "@aquapulse/database";

export type { PersistenceAdapterKind, PersistenceAdapterRegistry, PersistenceRuntimeConfig };

export interface PersistenceAdapterProviderOptions {
  readonly token: symbol;
  readonly defaultAdapter?: PersistenceAdapterKind;
  readonly allowRuntimeSwitch?: boolean;
}

export function createPersistenceRuntimeConfig(
  options: PersistenceAdapterProviderOptions
): PersistenceRuntimeConfig {
  const defaults = createDefaultPersistenceRuntimeConfig();

  return {
    defaultAdapter: options.defaultAdapter ?? defaults.defaultAdapter,
    allowRuntimeSwitch: options.allowRuntimeSwitch ?? defaults.allowRuntimeSwitch
  };
}

export function resolvePersistenceAdapter<TAdapter>(
  registry: PersistenceAdapterRegistry<TAdapter>,
  options: PersistenceAdapterProviderOptions,
  requestedAdapter?: PersistenceAdapterKind
): TAdapter {
  return selectPersistenceAdapter(createPersistenceRuntimeConfig(options), registry, requestedAdapter);
}

export function createPersistenceAdapterProvider(
  token: symbol,
  activeAdapterToken: unknown,
  options?: PersistenceAdapterProviderOptions
) {
  return {
    provide: token,
    useExisting: activeAdapterToken,
    meta: options ?? { token }
  };
}
