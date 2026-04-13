import { describe, expect, expectTypeOf, it } from "vitest";
import {
  PlaceholderDatabaseConnectionFactory,
  createDefaultPersistenceRuntimeConfig,
  createTestDatabaseConfig,
  parseDatabaseConfig,
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
});
