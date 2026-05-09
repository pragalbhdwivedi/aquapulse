import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  AQUAPULSE_SCHEMA_TABLES,
  aquaPulseSchemaTables,
  databaseMigrationManifest,
  getDatabaseTableDefinition
} from "../index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../migrations");

describe("Schema and migrations foundation", () => {
  it("exposes a real schema definition aligned with the current prototype modules", () => {
    expect(aquaPulseSchemaTables.map((table) => table.name)).toEqual([
      AQUAPULSE_SCHEMA_TABLES.ponds,
      AQUAPULSE_SCHEMA_TABLES.waterQuality,
      AQUAPULSE_SCHEMA_TABLES.feedEntries,
      AQUAPULSE_SCHEMA_TABLES.tasks,
      AQUAPULSE_SCHEMA_TABLES.alerts,
      AQUAPULSE_SCHEMA_TABLES.alertActionHistory,
      AQUAPULSE_SCHEMA_TABLES.savedAlertViews,
      AQUAPULSE_SCHEMA_TABLES.auditEvents,
      AQUAPULSE_SCHEMA_TABLES.auditEventMetadata,
      AQUAPULSE_SCHEMA_TABLES.aiRequests,
      AQUAPULSE_SCHEMA_TABLES.aiResponses
    ]);

    expect(getDatabaseTableDefinition(AQUAPULSE_SCHEMA_TABLES.alerts)?.columns.some((column) => column.name === "assigned_to")).toBe(true);
    expect(getDatabaseTableDefinition(AQUAPULSE_SCHEMA_TABLES.alerts)?.columns.some((column) => column.name === "latest_note")).toBe(true);
    expect(getDatabaseTableDefinition(AQUAPULSE_SCHEMA_TABLES.alertActionHistory)?.foreignKeys?.[0]).toMatchObject({
      column: "alert_id",
      referencesTable: "alerts",
      referencesColumn: "id"
    });
  });

  it("keeps the migration manifest and SQL files in sync", async () => {
    expect(databaseMigrationManifest.schemaVersion).toBe("0003_ai_log_persistence_foundation");
    expect(databaseMigrationManifest.migrations).toHaveLength(3);

    for (const migration of databaseMigrationManifest.migrations) {
      await access(path.join(migrationsDir, migration.file));
    }

    const [coreSql, auditSql, aiSql] = await Promise.all([
      readFile(path.join(migrationsDir, databaseMigrationManifest.migrations[0]!.file), "utf8"),
      readFile(path.join(migrationsDir, databaseMigrationManifest.migrations[1]!.file), "utf8"),
      readFile(path.join(migrationsDir, databaseMigrationManifest.migrations[2]!.file), "utf8")
    ]);

    expect(coreSql).toContain("CREATE TABLE IF NOT EXISTS ponds");
    expect(coreSql).toContain("CREATE TABLE IF NOT EXISTS alerts");
    expect(coreSql).toContain("CREATE TABLE IF NOT EXISTS alert_action_history");
    expect(auditSql).toContain("CREATE TABLE IF NOT EXISTS audit_events");
    expect(auditSql).toContain("CREATE TABLE IF NOT EXISTS audit_event_metadata");
    expect(aiSql).toContain("CREATE TABLE IF NOT EXISTS ai_requests");
    expect(aiSql).toContain("CREATE TABLE IF NOT EXISTS ai_responses");
  });
});
