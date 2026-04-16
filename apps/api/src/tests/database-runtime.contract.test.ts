import { describe, expect, it } from "vitest";
import { readApiDatabaseRuntimeConfig } from "../common/config/database-runtime.config";
import { resolveConfiguredPersistenceAdapter } from "../common/persistence/persistence-adapter.types";
import { PONDS_REPOSITORY } from "../modules/ponds/ports/ponds-repository.port";
import { InMemoryPondsRepository } from "../modules/ponds/repositories/in-memory-ponds.repository";
import { PostgresPondsRepository } from "../modules/ponds/adapters/postgres-ponds.repository";

describe("API database runtime wiring", () => {
  it("maps app env into the shared DB runtime config", () => {
    const runtime = readApiDatabaseRuntimeConfig({
      DATABASE_HOST: "api-db.internal",
      DATABASE_PORT: "5433",
      DATABASE_NAME: "aquapulse_api",
      AQUAPULSE_PERSISTENCE_MODE: "postgres",
      AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "false"
    });

    expect(runtime.database.host).toBe("api-db.internal");
    expect(runtime.database.port).toBe(5433);
    expect(runtime.database.database).toBe("aquapulse_api");
    expect(runtime.persistence.requestedAdapter).toBe("postgres");
    expect(runtime.persistence.postgresEnabled).toBe(false);
  });

  it("keeps in-memory active unless Postgres is explicitly and safely enabled", () => {
    const registry = { inMemory: InMemoryPondsRepository, postgres: PostgresPondsRepository };
    const options = { token: PONDS_REPOSITORY, defaultAdapter: "in-memory" as const, allowRuntimeSwitch: true };

    const defaultAdapter = resolveConfiguredPersistenceAdapter(registry, options, {});
    const blockedPostgresAdapter = resolveConfiguredPersistenceAdapter(registry, options, {
      AQUAPULSE_PERSISTENCE_MODE: "postgres",
      AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "false"
    });
    const enabledPostgresAdapter = resolveConfiguredPersistenceAdapter(registry, options, {
      AQUAPULSE_PERSISTENCE_MODE: "postgres",
      AQUAPULSE_ENABLE_POSTGRES_ADAPTERS: "true"
    });

    expect(defaultAdapter).toBe(InMemoryPondsRepository);
    expect(blockedPostgresAdapter).toBe(InMemoryPondsRepository);
    expect(enabledPostgresAdapter).toBe(PostgresPondsRepository);
  });
});
