import type { DatabaseConnectionStatus } from "@aquapulse/database";

let cachedDatabaseConnectionStatus: DatabaseConnectionStatus | undefined;

export function setCachedDatabaseConnectionStatus(
  status: DatabaseConnectionStatus | undefined
): void {
  cachedDatabaseConnectionStatus = status;
}

export function getCachedDatabaseConnectionStatus():
  | DatabaseConnectionStatus
  | undefined {
  return cachedDatabaseConnectionStatus;
}
