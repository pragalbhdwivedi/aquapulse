import type { DatabaseConfig } from "../config/database-config.js";
import type { DatabaseQueryResult } from "../connection/database-client.js";
import type { DatabaseConnectionFactory } from "../connection/database-connection.js";

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

export interface RecordedDatabasePlan {
  readonly statement: string;
  readonly params: readonly unknown[];
}

export interface RecordingConnectionFactoryOptions<TRow> {
  readonly rows?: readonly TRow[];
  readonly resolveRows?: (statement: string, params: readonly unknown[]) => readonly TRow[];
}

export function createRecordingConnectionFactory<TRow>(
  recordedPlans: RecordedDatabasePlan[],
  options: RecordingConnectionFactoryOptions<TRow> = {}
): DatabaseConnectionFactory {
  function createResult<TExpectedRow>(
    statement: string,
    params: readonly unknown[]
  ): DatabaseQueryResult<TExpectedRow> {
    const rows = options.resolveRows?.(statement, params) ?? options.rows ?? [];

    return {
      rows: rows as unknown as TExpectedRow[],
      rowCount: rows.length
    };
  }

  return {
    async create() {
      return {
        async query(statement, params = []) {
          recordedPlans.push({ statement, params });
          return createResult(statement, params);
        },
        async transaction(callback) {
          return callback({
            async query(statement, params = []) {
              recordedPlans.push({ statement, params });
              return createResult(statement, params);
            }
          });
        },
        async dispose() {
          return;
        }
      };
    },
    async checkReadiness() {
      return {
        ready: false,
        message: "Recording factory does not open a live database connection.",
        checkedAt: new Date(0).toISOString()
      };
    }
  };
}
