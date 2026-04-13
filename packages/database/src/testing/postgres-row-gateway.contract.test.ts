import { describe, expect, it } from "vitest";
import {
  PostgresRowGateway,
  createPlaceholderPondRow,
  createRecordingConnectionFactory,
  createTestDatabaseConfig,
  normalizeRowList,
  normalizeSingleRow,
  pondRowMapper,
  type RecordedDatabasePlan
} from "../index.js";

describe("Postgres row gateway", () => {
  it("executes mapped read and mutation flows without a live database", async () => {
    const recordedPlans: RecordedDatabasePlan[] = [];
    const gateway = new PostgresRowGateway({
      connectionFactory: createRecordingConnectionFactory(recordedPlans, {
        rows: [createPlaceholderPondRow({ id: "pond-88" })]
      }),
      databaseConfig: createTestDatabaseConfig()
    });

    const item = await gateway.executeMappedItem(
      { key: "ponds.getById", statement: "ponds.getById", params: ["pond-88"] },
      pondRowMapper,
      createPlaceholderPondRow()
    );
    const created = await gateway.executeMappedMutation(
      { key: "ponds.create", statement: "ponds.create", params: [{ id: "pond-88" }] },
      pondRowMapper,
      createPlaceholderPondRow()
    );

    expect(item.id).toBe("pond-88");
    expect(created.id).toBe("pond-88");
    expect(recordedPlans).toEqual([
      { statement: "ponds.getById", params: ["pond-88"] },
      { statement: "ponds.create", params: [{ id: "pond-88" }] }
    ]);
  });

  it("normalizes single-row and list fallbacks predictably", () => {
    expect(normalizeSingleRow([], createPlaceholderPondRow({ id: "fallback-1" })).id).toBe("fallback-1");
    expect(normalizeRowList([], [createPlaceholderPondRow({ id: "fallback-2" })])[0]?.id).toBe("fallback-2");
  });
});
