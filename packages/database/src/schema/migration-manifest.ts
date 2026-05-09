export interface DatabaseMigrationDefinition {
  readonly id: string;
  readonly name: string;
  readonly file: string;
  readonly description: string;
}

export interface DatabaseMigrationManifest {
  readonly schemaVersion: string;
  readonly migrations: readonly DatabaseMigrationDefinition[];
}

export const databaseMigrationManifest: DatabaseMigrationManifest = {
  schemaVersion: "0003_ai_log_persistence_foundation",
  migrations: [
    {
      id: "0001_core_schema",
      name: "core schema foundation",
      file: "0001_core_schema.sql",
      description:
        "Create the first AquaPulse relational schema foundation for ponds, water quality, feed, tasks, alerts, alert history, and saved alert views."
    },
    {
      id: "0002_audit_persistence_foundation",
      name: "audit persistence foundation",
      file: "0002_audit_persistence_foundation.sql",
      description:
        "Add durable audit event storage and request-context metadata for bounded internal runtime auditing."
    },
    {
      id: "0003_ai_log_persistence_foundation",
      name: "ai log persistence foundation",
      file: "0003_ai_log_persistence_foundation.sql",
      description:
        "Add durable AI request and response log storage for bounded advisory-only operator assistance history."
    }
  ]
} as const;
