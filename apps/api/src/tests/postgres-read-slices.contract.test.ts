import {
  createPlaceholderAlertRow,
  createPlaceholderPondRow,
  createTestDatabaseConfig,
  type DatabaseClient,
  type DatabaseQueryResult,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import { describe, expect, it } from "vitest";
import {
  PostgresAlertsRepository,
  buildAlertByIdQueryPlan,
  buildAlertsListQueryPlan,
  buildOpenAlertsQueryPlan
} from "../modules/alerts/adapters/postgres-alerts.repository";
import type { AlertsRepositoryPort } from "../modules/alerts/ports/alerts-repository.port";
import {
  PostgresPondsRepository,
  buildPondByIdQueryPlan,
  buildPondsListQueryPlan
} from "../modules/ponds/adapters/postgres-ponds.repository";
import type { PondsRepositoryPort } from "../modules/ponds/ports/ponds-repository.port";

interface RecordedQuery {
  readonly statement: string;
  readonly params: readonly unknown[];
}

function createRecordingFactory<TRow>(
  rows: TRow[],
  recordedQueries: RecordedQuery[]
): DatabaseConnectionFactory {
  function createResult<TExpectedRow>(): DatabaseQueryResult<TExpectedRow> {
    return {
      rows: rows as unknown as TExpectedRow[],
      rowCount: rows.length
    };
  }

  return {
    async create() {
      const client: DatabaseClient = {
        async query(statement, params = []) {
          recordedQueries.push({ statement, params });
          return createResult();
        },
        async transaction(callback) {
          return callback({
            async query(statement, params = []) {
              recordedQueries.push({ statement, params });
              return createResult();
            }
          });
        },
        async dispose() {
          return;
        }
      };

      return client;
    },
    async checkReadiness() {
      return {
        ready: false,
        message: "Test factory does not open a live database connection.",
        checkedAt: new Date(0).toISOString()
      };
    }
  };
}

describe("Postgres read adapter slices", () => {
  it("ponds adapter keeps the repository contract while using shared row mapping", async () => {
    const recordedQueries: RecordedQuery[] = [];
    const repository: PondsRepositoryPort = PostgresPondsRepository.forTesting({
      connectionFactory: createRecordingFactory(
        [createPlaceholderPondRow({ id: "pond-42", farm_id: "farm-42" })],
        recordedQueries
      ),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("pond-42");
    const list = await repository.list({
      page: 2,
      pageSize: 10,
      farmId: "farm-42",
      status: "active",
      kind: "pond",
      search: "north"
    });

    expect(item.id).toBe("pond-42");
    expect(item.farmId).toBe("farm-42");
    expect(list.items[0]?.id).toBe("pond-42");
    expect(recordedQueries).toEqual([
      { statement: "ponds.getById", params: ["pond-42"] },
      { statement: "ponds.list", params: [2, 10, "farm-42", "active", "pond", "north"] }
    ]);
    expect(buildPondByIdQueryPlan("pond-42").filters).toEqual({ id: "pond-42" });
    expect(buildPondsListQueryPlan({ page: 1, pageSize: 20, status: "active" }).filters).toEqual({
      farmId: undefined,
      status: "active",
      kind: undefined,
      search: undefined
    });
  });

  it("alerts adapter keeps the repository contract and translates query inputs consistently", async () => {
    const recordedQueries: RecordedQuery[] = [];
    const repository: AlertsRepositoryPort = PostgresAlertsRepository.forTesting({
      connectionFactory: createRecordingFactory(
        [createPlaceholderAlertRow({ id: "alert-42", pond_id: "pond-42", status: "open" })],
        recordedQueries
      ),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await repository.getById("alert-42");
    const list = await repository.list({
      page: 1,
      pageSize: 15,
      pondId: "pond-42",
      severity: "high",
      status: "open",
      source: "water-quality",
      search: "oxygen"
    });
    const open = await repository.listOpen();

    expect(item.id).toBe("alert-42");
    expect(list.items[0]?.pondId).toBe("pond-42");
    expect(open.items[0]?.status).toBe("open");
    expect(recordedQueries).toEqual([
      { statement: "alerts.getById", params: ["alert-42"] },
      { statement: "alerts.list", params: [1, 15, "pond-42", "high", "open", "water-quality", "oxygen"] },
      { statement: "alerts.listOpen", params: [] }
    ]);
    expect(buildAlertByIdQueryPlan("alert-42").filters).toEqual({ id: "alert-42" });
    expect(buildAlertsListQueryPlan({ page: 1, pageSize: 20, severity: "high" }).filters).toEqual({
      pondId: undefined,
      severity: "high",
      status: undefined,
      source: undefined,
      search: undefined
    });
    expect(buildOpenAlertsQueryPlan().filters).toEqual({ status: "open" });
  });
});
