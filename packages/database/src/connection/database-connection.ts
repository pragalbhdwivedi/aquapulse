import type { DatabaseConfig } from "../config/database-config.js";
import type { DatabaseClient } from "./database-client.js";

export interface DatabaseConnectionStatus {
  readonly ready: boolean;
  readonly message: string;
  readonly checkedAt: string;
}

export interface DatabaseConnectionFactory {
  create(config: DatabaseConfig): Promise<DatabaseClient>;
  checkReadiness(config: DatabaseConfig): Promise<DatabaseConnectionStatus>;
}

export class PlaceholderDatabaseConnectionFactory implements DatabaseConnectionFactory {
  async create(_config: DatabaseConfig): Promise<DatabaseClient> {
    return {
      async query() {
        return { rows: [], rowCount: 0 };
      },
      async transaction(callback) {
        return callback({
          async query() {
            return { rows: [], rowCount: 0 };
          }
        });
      },
      async dispose() {
        return;
      }
    };
  }

  async checkReadiness(_config: DatabaseConfig): Promise<DatabaseConnectionStatus> {
    return {
      ready: false,
      message: "Database connection is not wired yet.",
      checkedAt: new Date(0).toISOString()
    };
  }
}
