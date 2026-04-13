import type { DatabaseConfig } from "../config/database-config.js";

export function createTestDatabaseConfig(overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
  return {
    dialect: "postgres",
    host: "localhost",
    port: 5432,
    database: "aquapulse_test",
    schema: "public",
    user: "aquapulse",
    password: "placeholder",
    sslMode: "disable",
    poolMin: 1,
    poolMax: 2,
    appName: "aquapulse-test",
    ...overrides
  };
}
