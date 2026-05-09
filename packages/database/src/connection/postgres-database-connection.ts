import { Pool, type PoolClient, type PoolConfig, type QueryResult } from "pg";
import type { DatabaseConfig } from "../config/database-config.js";
import type { DatabaseClient, DatabaseQueryResult, DatabaseTransaction } from "./database-client.js";
import type {
  DatabaseConnectionFactory,
  DatabaseConnectionStatus
} from "./database-connection.js";

function toPoolConfig(config: DatabaseConfig): PoolConfig {
  const poolConfig: PoolConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    min: config.poolMin,
    max: config.poolMax,
    application_name: config.appName
  };

  if (config.sslMode === "require") {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  return poolConfig;
}

function toQueryResult<TRow>(result: QueryResult): DatabaseQueryResult<TRow> {
  return {
    rows: result.rows as TRow[],
    rowCount: result.rowCount ?? result.rows.length
  };
}

async function runTransaction<TResult>(
  pool: Pool,
  callback: (transaction: DatabaseTransaction) => Promise<TResult>
): Promise<TResult> {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const result = await callback({
      async query<TRow = Record<string, unknown>>(
        statement: string,
        params: readonly unknown[] = []
      ): Promise<DatabaseQueryResult<TRow>> {
        const queryResult = await client.query(statement, [...params]);
        return toQueryResult(queryResult);
      }
    });

    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export class PostgresDatabaseConnectionFactory implements DatabaseConnectionFactory {
  async create(config: DatabaseConfig): Promise<DatabaseClient> {
    const pool = new Pool(toPoolConfig(config));

    return {
      async query<TRow = Record<string, unknown>>(
        statement: string,
        params: readonly unknown[] = []
      ): Promise<DatabaseQueryResult<TRow>> {
        const result = await pool.query(statement, [...params]);
        return toQueryResult(result);
      },
      async transaction<TResult>(
        callback: (transaction: DatabaseTransaction) => Promise<TResult>
      ): Promise<TResult> {
        return runTransaction(pool, callback);
      },
      async dispose(): Promise<void> {
        await pool.end();
      }
    };
  }

  async checkReadiness(config: DatabaseConfig): Promise<DatabaseConnectionStatus> {
    const pool = new Pool(toPoolConfig(config));

    try {
      await pool.query("select 1");
      return {
        ready: true,
        message: "Database connectivity check succeeded.",
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        ready: false,
        message:
          error instanceof Error ? error.message : "Database connectivity check failed.",
        checkedAt: new Date().toISOString()
      };
    } finally {
      await pool.end();
    }
  }
}
