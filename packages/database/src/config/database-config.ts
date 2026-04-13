export type DatabaseDialect = "postgres";
export type DatabaseSslMode = "disable" | "prefer" | "require";

export interface DatabaseConfig {
  readonly dialect: DatabaseDialect;
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly schema?: string;
  readonly user: string;
  readonly password?: string;
  readonly sslMode: DatabaseSslMode;
  readonly poolMin: number;
  readonly poolMax: number;
  readonly appName: string;
}

export interface DatabaseEnvSource {
  readonly DATABASE_DIALECT?: string;
  readonly DATABASE_HOST?: string;
  readonly DATABASE_PORT?: string;
  readonly DATABASE_NAME?: string;
  readonly DATABASE_SCHEMA?: string;
  readonly DATABASE_USER?: string;
  readonly DATABASE_PASSWORD?: string;
  readonly DATABASE_SSL_MODE?: string;
  readonly DATABASE_POOL_MIN?: string;
  readonly DATABASE_POOL_MAX?: string;
  readonly DATABASE_APP_NAME?: string;
}

export function parseDatabaseConfig(env: DatabaseEnvSource): DatabaseConfig {
  return {
    dialect: "postgres",
    host: env.DATABASE_HOST ?? "localhost",
    port: Number(env.DATABASE_PORT ?? "5432"),
    database: env.DATABASE_NAME ?? "aquapulse",
    schema: env.DATABASE_SCHEMA ?? "public",
    user: env.DATABASE_USER ?? "aquapulse",
    password: env.DATABASE_PASSWORD,
    sslMode: normalizeSslMode(env.DATABASE_SSL_MODE),
    poolMin: Number(env.DATABASE_POOL_MIN ?? "1"),
    poolMax: Number(env.DATABASE_POOL_MAX ?? "10"),
    appName: env.DATABASE_APP_NAME ?? "aquapulse-api"
  };
}

function normalizeSslMode(value?: string): DatabaseSslMode {
  if (value === "require" || value === "disable") {
    return value;
  }

  return "prefer";
}
