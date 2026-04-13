import {
  createDefaultPersistenceRuntimeConfig,
  resolvePersistenceSelection,
  selectPersistenceAdapter,
  type PersistenceAdapterKind,
  type PersistenceAdapterRegistry,
  type PersistenceRuntimeConfig
} from "@aquapulse/database";
import { readApiDatabaseRuntimeConfig, type ApiDatabaseRuntimeEnvSource } from "../config/database-runtime.config";

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

export function resolveConfiguredPersistenceAdapter<TAdapter>(
  registry: PersistenceAdapterRegistry<TAdapter>,
  options: PersistenceAdapterProviderOptions,
  env: ApiDatabaseRuntimeEnvSource = process.env,
  requestedAdapter?: PersistenceAdapterKind
): TAdapter {
  const runtime = readApiDatabaseRuntimeConfig(env);
  const runtimeConfig: PersistenceRuntimeConfig = {
    ...createPersistenceRuntimeConfig(options),
    requestedAdapter: runtime.persistence.requestedAdapter,
    postgresEnabled: runtime.persistence.postgresEnabled
  };

  const selection = resolvePersistenceSelection(runtimeConfig, requestedAdapter);
  return selection.adapter === "postgres" ? registry.postgres : registry.inMemory;
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
