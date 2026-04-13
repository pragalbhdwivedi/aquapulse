import { describe, expect, it } from "vitest";
import {
  createCompiledQueryPlan,
  createListQueryPlan,
  createLookupQueryPlan,
  createMutationQueryPlan,
  mapCreateAlertInputToRowWrite,
  mapCreatePondInputToRowWrite,
  mapUpdateAlertInputToRowPatch,
  mapUpdatePondInputToRowPatch
} from "../index.js";

describe("Shared query builders and write mappers", () => {
  it("builds stable lookup, list, and mutation query plans", () => {
    expect(createLookupQueryPlan("ponds.getById", "pond-1")).toEqual({
      key: "ponds.getById",
      statement: "ponds.getById",
      params: ["pond-1"],
      filters: { id: "pond-1" },
      sort: undefined
    });

    expect(
      createListQueryPlan({
        key: "alerts.list",
        query: { page: 2, pageSize: 25, sort: [{ field: "createdAt", direction: "desc" }] },
        params: [2, 25, "high"],
        filters: { severity: "high" }
      })
    ).toEqual({
      key: "alerts.list",
      statement: "alerts.list",
      params: [2, 25, "high"],
      pagination: { page: 2, pageSize: 25 },
      filters: { severity: "high" },
      sort: [{ field: "createdAt", direction: "desc" }]
    });

    expect(
      createMutationQueryPlan("alerts.update", { id: "alert-1", status: "acknowledged" }, { params: ["alert-1"] })
    ).toEqual({
      key: "alerts.update",
      statement: "alerts.update",
      params: ["alert-1"],
      filters: { id: "alert-1", status: "acknowledged" },
      sort: undefined
    });

    expect(
      createCompiledQueryPlan({
        key: "alerts.listOpen",
        params: [],
        filters: { status: "open" }
      })
    ).toEqual({
      key: "alerts.listOpen",
      statement: "alerts.listOpen",
      params: [],
      filters: { status: "open" },
      sort: undefined
    });
  });

  it("maps pond and alert writes into row-shaped payloads", () => {
    expect(mapCreatePondInputToRowWrite({ id: "pond-77" })).toMatchObject({
      id: "pond-77",
      code: "NP-01",
      farm_id: "farm-1",
      status: "active"
    });
    expect(mapUpdatePondInputToRowPatch("pond-77", {})).toEqual({
      id: "pond-77",
      updated_at: "2026-04-13T00:00:00.000Z"
    });

    expect(mapCreateAlertInputToRowWrite({ id: "alert-77" })).toMatchObject({
      id: "alert-77",
      source: "water-quality",
      status: "open"
    });
    expect(mapUpdateAlertInputToRowPatch("alert-77", {})).toEqual({
      id: "alert-77",
      updated_at: "2026-04-13T00:00:00.000Z"
    });
  });
});
