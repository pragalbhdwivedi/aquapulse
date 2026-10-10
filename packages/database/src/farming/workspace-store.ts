import { Pool, type PoolConfig } from "pg";
import type { FarmWorkspace } from "@aquapulse/types";

export interface FarmWorkspaceStore {
  readonly mode: "memory" | "postgres";
  transaction<T>(
    work: (workspace: FarmWorkspace) => Promise<T> | T,
  ): Promise<T>;
  dispose(): Promise<void>;
}

/** Serial, copy-on-write transactions; failures never partially mutate local state. */
export class MemoryFarmWorkspaceStore implements FarmWorkspaceStore {
  readonly mode = "memory" as const;
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private workspace: FarmWorkspace) {}
  transaction<T>(
    work: (workspace: FarmWorkspace) => Promise<T> | T,
  ): Promise<T> {
    const next = this.tail.then(async () => {
      const copy = structuredClone(this.workspace);
      const result = await work(copy);
      this.workspace = copy;
      return structuredClone(result);
    });
    this.tail = next.catch(() => undefined);
    return next;
  }
  async dispose() {}
}

/** Bounded manual pilot: one locked JSONB aggregate per business. No fallback. */
export class PostgresFarmWorkspaceStore implements FarmWorkspaceStore {
  readonly mode = "postgres" as const;
  private readonly pool: Pool;
  constructor(
    config: PoolConfig,
    private readonly initial: FarmWorkspace,
  ) {
    this.pool = new Pool({
      ...config,
      max: 5,
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
      application_name: "aquapulse-farming",
    });
  }
  async transaction<T>(
    work: (workspace: FarmWorkspace) => Promise<T> | T,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO farm_workspaces (organization_id, state) VALUES ($1, $2::jsonb) ON CONFLICT (organization_id) DO NOTHING",
        [this.initial.organizationId, JSON.stringify(this.initial)],
      );
      const result = await client.query<{ state: FarmWorkspace }>(
        "SELECT state FROM farm_workspaces WHERE organization_id = $1 FOR UPDATE",
        [this.initial.organizationId],
      );
      const state = result.rows[0]?.state;
      if (
        !state ||
        state.schemaVersion !== 1 ||
        state.organizationId !== this.initial.organizationId ||
        !Array.isArray(state.memberships) ||
        !Array.isArray(state.receipts)
      )
        throw new Error(
          "Unsupported farming workspace schema. Restore or migrate before continuing.",
        );
      const value = await work(state);
      const serialized = JSON.stringify(state);
      if (Buffer.byteLength(serialized) > 32 * 1024 * 1024)
        throw new Error(
          "Manual pilot storage limit reached. Archive and migrate the workspace before continuing.",
        );
      await client.query(
        "UPDATE farm_workspaces SET state = $2::jsonb, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE organization_id = $1",
        [state.organizationId, serialized],
      );
      await client.query("COMMIT");
      return value;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async dispose() {
    await this.pool.end();
  }
}

export function createFarmWorkspaceStore(
  env: Record<string, string | undefined>,
  initial: FarmWorkspace,
): FarmWorkspaceStore {
  if (env.AQUAPULSE_FARM_STORAGE === "postgres") {
    if (!env.AQUAPULSE_FARM_DATABASE_URL)
      throw new Error("AQUAPULSE_FARM_DATABASE_URL is required.");
    const url = new URL(env.AQUAPULSE_FARM_DATABASE_URL);
    // Do not allow connection-string sslmode to weaken certificate verification.
    for (const key of [...url.searchParams.keys()])
      if (key.toLowerCase().startsWith("ssl"))
        throw new Error(
          "Configure farming TLS with AQUAPULSE_FARM_DATABASE_TLS, not URL SSL options.",
        );
    if (
      env.NODE_ENV === "production" &&
      env.AQUAPULSE_FARM_DATABASE_TLS !== "verify"
    )
      throw new Error("Verified database TLS is required in production.");
    return new PostgresFarmWorkspaceStore(
      {
        connectionString: url.toString(),
        ssl:
          env.AQUAPULSE_FARM_DATABASE_TLS === "verify"
            ? { rejectUnauthorized: true }
            : false,
      },
      initial,
    );
  }
  if (env.AQUAPULSE_FARM_STORAGE && env.AQUAPULSE_FARM_STORAGE !== "memory")
    throw new Error("Unknown farming storage mode.");
  return new MemoryFarmWorkspaceStore(initial);
}
