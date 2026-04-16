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
  schemaVersion: "0001_core_schema",
  migrations: [
    {
      id: "0001_core_schema",
      name: "core schema foundation",
      file: "0001_core_schema.sql",
      description:
        "Create the first AquaPulse relational schema foundation for ponds, water quality, feed, tasks, alerts, alert history, and saved alert views."
    }
  ]
} as const;
