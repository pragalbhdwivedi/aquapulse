import {
  parseDatabaseRuntimeConfig,
  type DatabaseRuntimeConfig,
  type DatabaseRuntimeEnvSource
} from "@aquapulse/database";

export type ApiDatabaseRuntimeEnvSource = DatabaseRuntimeEnvSource;
export type ApiDatabaseRuntimeConfig = DatabaseRuntimeConfig;

export function readApiDatabaseRuntimeConfig(
  env: ApiDatabaseRuntimeEnvSource = process.env
): ApiDatabaseRuntimeConfig {
  return parseDatabaseRuntimeConfig(env);
}
