import { createDefaultPersistenceRuntimeConfig } from "../adapters/adapter-factory.js";
import type { PersistenceAdapterKind, PersistenceRuntimeConfig } from "../contracts/persistence-runtime.js";
import { parseDatabaseConfig, type DatabaseConfig, type DatabaseEnvSource } from "./database-config.js";

export interface DatabaseRuntimeEnvSource extends DatabaseEnvSource {
  readonly AQUAPULSE_PERSISTENCE_MODE?: string;
  readonly AQUAPULSE_ENABLE_POSTGRES_ADAPTERS?: string;
  readonly AQUAPULSE_DB_HEALTHCHECK_ON_BOOT?: string;
}

export interface DatabaseRuntimeConfig {
  readonly database: DatabaseConfig;
  readonly persistence: PersistenceRuntimeConfig;
  readonly healthcheckOnBoot: boolean;
}

export function parseDatabaseRuntimeConfig(env: DatabaseRuntimeEnvSource): DatabaseRuntimeConfig {
  return {
    database: parseDatabaseConfig(env),
    persistence: parsePersistenceRuntimeConfigFromEnv(env),
    healthcheckOnBoot: parseBoolean(env.AQUAPULSE_DB_HEALTHCHECK_ON_BOOT, false)
  };
}

export function parsePersistenceRuntimeConfigFromEnv(
  env: Pick<DatabaseRuntimeEnvSource, "AQUAPULSE_PERSISTENCE_MODE" | "AQUAPULSE_ENABLE_POSTGRES_ADAPTERS">
): PersistenceRuntimeConfig {
  const defaults = createDefaultPersistenceRuntimeConfig();
  const requestedAdapter = normalizeAdapterKind(env.AQUAPULSE_PERSISTENCE_MODE);
  const postgresEnabled = parseBoolean(env.AQUAPULSE_ENABLE_POSTGRES_ADAPTERS, false);

  return {
    defaultAdapter: defaults.defaultAdapter,
    requestedAdapter,
    allowRuntimeSwitch: defaults.allowRuntimeSwitch,
    postgresEnabled
  };
}

function normalizeAdapterKind(value?: string): PersistenceAdapterKind | undefined {
  if (value === "postgres" || value === "in-memory") {
    return value;
  }

  return undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}
