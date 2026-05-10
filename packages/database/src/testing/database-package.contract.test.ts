import { describe, expect, expectTypeOf, it } from "vitest";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PlaceholderDatabaseConnectionFactory,
  createDefaultPersistenceRuntimeConfig,
  createTestDatabaseConfig,
  databaseMigrationManifest,
  parseDatabaseRuntimeConfig,
  parsePersistenceRuntimeConfigFromEnv,
  parseDatabaseConfig,
  resolvePersistenceSelection,
  selectPersistenceAdapter,
  type DatabaseClient,
  type DatabaseConfig,
  type PersistenceAdapterRegistry,
  type RepositoryListQuery
} from "../index.js";

describe("Database package foundation", () => {
  it("exports stable config and adapter-factory contracts", () => {
    const config = parseDatabaseConfig({});
    const runtime = createDefaultPersistenceRuntimeConfig();
    const registry: PersistenceAdapterRegistry<string> = {
      inMemory: "memory",
      postgres: "postgres"
    };

    expect(config.database).toBe("aquapulse");
    expect(runtime.defaultAdapter).toBe("in-memory");
    expect(selectPersistenceAdapter(runtime, registry)).toBe("memory");
    expect(databaseMigrationManifest.schemaVersion).toBe("0005_ai_feedback_persistence_foundation");
    expect(AQUAPULSE_SCHEMA_TABLES.alerts).toBe("alerts");
    expect(AQUAPULSE_SCHEMA_TABLES.aiResponses).toBe("ai_responses");
    expect(AQUAPULSE_SCHEMA_TABLES.aiFeedback).toBe("ai_feedback");
    expect(AQUAPULSE_SCHEMA_TABLES.pondResponsibilities).toBe("pond_responsibilities");

    expectTypeOf(config).toEqualTypeOf<DatabaseConfig>();
    expectTypeOf<RepositoryListQuery>().toMatchTypeOf<{ page: number; pageSize: number }>();
  });

  it("provides a compile-safe placeholder connection factory", async () => {
    const factory = new PlaceholderDatabaseConnectionFactory();
    const config = createTestDatabaseConfig();
    const client = await factory.create(config);
    const readiness = await factory.checkReadiness(config);

    const result = await client.query("select 1");

    expect(result.rowCount).toBe(0);
    expect(readiness.ready).toBe(false);
    expect(readiness.message).toContain("not wired");

    expectTypeOf(client).toEqualTypeOf<DatabaseClient>();
  });

  it("maps env into database and persistence runtime config safely", () => {
    const runtime = parseDatabaseRuntimeConfig({
      DATABASE_HOST: "db.internal",
      DATABASE_PORT: "6543",
      AQUAPULSE_PERSISTENCE_MODE: "postgres",
      AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "false"
    });

    expect(runtime.database.host).toBe("db.internal");
    expect(runtime.database.port).toBe(6543);
    expect(runtime.persistence.requestedAdapter).toBe("postgres");
    expect(runtime.persistence.postgresEnabled).toBe(false);
    expect(runtime.healthcheckOnBoot).toBe(false);

    const selection = resolvePersistenceSelection(runtime.persistence);
    expect(selection.adapter).toBe("in-memory");
    expect(selection.reason).toBe("runtime_switch_disabled");

    const switchable = parsePersistenceRuntimeConfigFromEnv({
      AQUAPULSE_PERSISTENCE_MODE: "postgres",
      AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "true"
    });
    expect(switchable.requestedAdapter).toBe("postgres");
  });
});
