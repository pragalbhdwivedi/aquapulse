import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  farmCycleCount,
  farmMaterialBalance,
  farmEnterpriseCatalog,
  type FarmProductionCycle,
  type FarmWorkspace,
} from "@aquapulse/types";
import {
  MemoryFarmWorkspaceStore,
  createFarmWorkspaceStore,
} from "@aquapulse/database";
import { validateFarmActivityFields } from "@aquapulse/validation";
import { FarmingService, initialFarmWorkspace } from "./farming.service";

const start = "2026-01-01T00:00:00.000Z";
const recordedAt = "2026-02-01T00:00:00.000Z";
async function fixture(erp?: ConstructorParameters<typeof FarmingService>[2]) {
  const state = initialFarmWorkspace({ AQUAPULSE_FARM_OWNER_SUBJECT: "owner" });
  const store = new MemoryFarmWorkspaceStore(state);
  const service = new FarmingService(store, false, erp);
  const entity = (await service.create("owner", "legal-entities", {
    name: "Test Company",
    state: "Madhya Pradesh",
    erpCompany: "Test ERP Company",
  })) as { id: string };
  const farm = (await service.create("owner", "farms", {
    name: "Farm One",
    code: "ONE",
    legalEntityId: entity.id,
  })) as { id: string };
  const second = (await service.create("owner", "farms", {
    name: "Farm Two",
    code: "TWO",
    legalEntityId: entity.id,
  })) as { id: string };
  for (const [userId, role, farmIds] of [
    ["manager", "manager", [farm.id]],
    ["operator", "operator", [farm.id]],
    ["viewer", "viewer", [farm.id]],
    ["accountant", "accountant", [farm.id]],
    ["other", "manager", [second.id]],
  ] as const)
    await service.create("owner", "memberships", {
      userId,
      role,
      farmIds,
      active: true,
    });
  const unit = (await service.create("owner", "units", {
    farmId: farm.id,
    name: "Pond One",
    enterprise: "aquaculture",
    kind: "pond",
  })) as { id: string };
  const cycle = (await service.create("owner", "cycles", {
    unitId: unit.id,
    name: "Season One",
    species: "Test fish",
    startsAt: start,
    initialCount: 100,
  })) as FarmProductionCycle;
  return { service, store, farm, second, cycle, unit };
}
const activity = (
  cycleId: string,
  type = "feeding",
  fields: Record<string, unknown> = { feed: "Test feed", quantityKg: 2 },
) => ({ submissionId: randomUUID(), cycleId, type, fields, recordedAt });

describe("integrated farming authorization and transactions", () => {
  it("scopes reads and rejects forged cross-farm writes and missing memberships", async () => {
    const { service, farm, second, cycle } = await fixture();
    expect(
      (await service.view("manager")).farms.map((entry) => entry.id),
    ).toEqual([farm.id]);
    expect((await service.view("manager")).memberships).toBeUndefined();
    expect((await service.view("manager")).legalEntities).toHaveLength(1);
    await expect(service.view("unknown")).rejects.toThrow("membership");
    await expect(
      service.create("other", "activities", activity(cycle.id)),
    ).rejects.toThrow("not found");
    await expect(
      service.create("manager", "units", {
        farmId: second.id,
        name: "Forbidden",
        enterprise: "aquaculture",
        kind: "pond",
      }),
    ).rejects.toThrow("not found");
    await expect(
      service.create("viewer", "activities", activity(cycle.id)),
    ).rejects.toThrow("role");
    await expect(
      service.create("operator", "memberships", {
        userId: "operator",
        role: "owner",
        active: true,
        farmIds: [],
      }),
    ).rejects.toThrow("role");
    await expect(
      service.create("owner", "memberships", {
        userId: "owner",
        role: "viewer",
        farmIds: [],
        active: true,
      }),
    ).rejects.toThrow("last active owner");
  });
  it("rechecks revoked memberships even for previously accepted submission IDs", async () => {
    const { service, farm, cycle } = await fixture();
    const input = activity(cycle.id);
    await service.create("operator", "activities", input);
    await service.create("owner", "memberships", {
      userId: "operator",
      role: "operator",
      farmIds: [farm.id],
      active: false,
    });
    await expect(
      service.create("operator", "activities", input),
    ).rejects.toThrow("membership");
  });
  it("deduplicates concurrent retries and conflicts on edited payloads or actors", async () => {
    const { service, cycle } = await fixture();
    const input = activity(cycle.id);
    const results = await Promise.all([
      service.create("operator", "activities", input),
      service.create("operator", "activities", {
        ...input,
        fields: { quantityKg: 2, feed: "Test feed" },
      }),
    ]);
    expect(results[0]).toEqual(results[1]);
    expect((await service.view("owner")).activities).toHaveLength(1);
    await expect(
      service.create("operator", "activities", {
        ...input,
        fields: { ...input.fields, quantityKg: 3 },
      }),
    ).rejects.toThrow("different content");
    await expect(
      service.create("manager", "activities", input),
    ).rejects.toThrow("different content");
  });
  it("rolls back invalid changes and prevents negative count and invalid voids", async () => {
    const { service, cycle } = await fixture();
    const stocking = (await service.create(
      "operator",
      "activities",
      activity(cycle.id, "stocking", { count: 10, source: "hatchery" }),
    )) as { id: string };
    await service.create(
      "operator",
      "activities",
      activity(cycle.id, "mortality", { count: 105 }),
    );
    await expect(
      service.create(
        "operator",
        "activities",
        activity(cycle.id, "mortality", { count: 6 }),
      ),
    ).rejects.toThrow("negative");
    await expect(
      service.decide("manager", "activities", stocking.id, {
        decision: "void",
        reason: "Wrong receipt",
      }),
    ).rejects.toThrow("negative");
    const state = await service.view("owner");
    expect(farmCycleCount(cycle, state.activities)).toBe(5);
    expect(state.activities).toHaveLength(2);
  });
  it("rejects closed-cycle captures but acknowledges an identical replay", async () => {
    const { service, cycle } = await fixture();
    const input = activity(cycle.id);
    const first = await service.create("operator", "activities", input);
    await service.closeCycle("manager", cycle.id, {
      reason: "Completed season",
    });
    await expect(
      service.create("operator", "activities", activity(cycle.id)),
    ).rejects.toThrow("closed");
    expect(await service.create("operator", "activities", input)).toEqual(
      first,
    );
  });
  it("requires independent treatment review and blocks outputs within withdrawal", async () => {
    const { service, cycle } = await fixture();
    const treatment = (await service.create(
      "manager",
      "activities",
      activity(cycle.id, "treatment", {
        product: "Recorded product",
        professional: "Veterinarian",
        instructions: "See signed note",
        withdrawalUntil: "2026-03-01",
      }),
    )) as { id: string };
    await expect(
      service.decide("manager", "activities", treatment.id, {
        decision: "approve",
        reason: "Checked",
      }),
    ).rejects.toThrow("different manager");
    await expect(
      service.closeCycle("manager", cycle.id, { reason: "Finish" }),
    ).rejects.toThrow("pending");
    await service.decide("owner", "activities", treatment.id, {
      decision: "approve",
      reason: "Signed instructions verified",
    });
    await expect(
      service.create(
        "operator",
        "activities",
        activity(cycle.id, "harvest", { quantityKg: 10, lot: "LOT-1" }),
      ),
    ).rejects.toThrow("withdrawal");
    await service.create("operator", "activities", {
      ...activity(cycle.id, "harvest", {
        quantityKg: 10,
        count: 20,
        lot: "LOT-2",
      }),
      recordedAt: "2026-03-02T00:00:00.000Z",
    });
    expect(
      farmCycleCount(cycle, (await service.view("owner")).activities),
    ).toBe(80);
  });
  it("checks stock under concurrency and gives the receiving farm its balance", async () => {
    const { service, farm, second } = await fixture();
    const source = (await service.create("owner", "materials", {
      farmId: farm.id,
      name: "Compost",
      unit: "kg",
    })) as { id: string };
    const dest = (await service.create("owner", "materials", {
      farmId: second.id,
      name: "Compost",
      unit: "kg",
    })) as { id: string };
    const movement = (kind: string, quantity: number, extra = {}) => ({
      submissionId: randomUUID(),
      materialId: source.id,
      kind,
      quantity,
      lot: "COMPOST-1",
      recordedAt,
      ...extra,
    });
    await service.create("manager", "movements", movement("receipt", 10));
    await expect(
      service.create(
        "manager",
        "movements",
        movement("transfer", 2, { destinationMaterialId: dest.id }),
      ),
    ).rejects.toThrow("not found");
    await service.create(
      "owner",
      "movements",
      movement("transfer", 2, { destinationMaterialId: dest.id }),
    );
    const received = await service.view("other");
    expect(farmMaterialBalance(dest.id, received.movements)).toBe(2);
    expect(received.movements[0].materialId).toBe("restricted");
    const results = await Promise.allSettled([
      service.create("manager", "movements", movement("issue", 6)),
      service.create("manager", "movements", movement("issue", 6)),
    ]);
    expect(
      results.filter((entry) => entry.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      farmMaterialBalance(source.id, (await service.view("manager")).movements),
    ).toBe(2);
  });
  it("persists task updates once and restricts updates to the assignee", async () => {
    const { service, farm, cycle } = await fixture();
    const task = (await service.create("manager", "tasks", {
      farmId: farm.id,
      cycleId: cycle.id,
      title: "Take water sample",
      dueAt: recordedAt,
      assignedTo: "operator",
    })) as { id: string };
    const update = {
      submissionId: randomUUID(),
      taskId: task.id,
      status: "done",
      note: "Sample collected",
      recordedAt,
    };
    await service.create("operator", "task-updates", update);
    await service.create("operator", "task-updates", update);
    expect((await service.view("operator")).tasks[0].status).toBe("done");
    expect((await service.view("operator")).taskUpdates).toHaveLength(1);
    await expect(
      service.create("other", "task-updates", update),
    ).rejects.toThrow("not found");
  });
  it("scopes and validates photos without including their bytes in workspace snapshots", async () => {
    const { service, cycle } = await fixture();
    const row = (await service.create(
      "operator",
      "activities",
      activity(cycle.id),
    )) as { id: string };
    const photo = {
      submissionId: randomUUID(),
      activityId: row.id,
      caption: "Water sample",
      dataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=",
    };
    const saved = (await service.create("operator", "photos", photo)) as {
      id: string;
    };
    expect((await service.view("operator")).photos[0]).not.toHaveProperty(
      "dataUrl",
    );
    await expect(service.photo("other", saved.id)).rejects.toThrow("not found");
    await expect(
      service.create("operator", "photos", {
        ...photo,
        submissionId: randomUUID(),
        dataUrl: "data:image/png;base64,SGVsbG8=",
      }),
    ).rejects.toThrow("PNG");
  });
  it("never falls back from a requested PostgreSQL configuration", () => {
    expect(() =>
      createFarmWorkspaceStore(
        { AQUAPULSE_FARM_STORAGE: "postgres" },
        initialFarmWorkspace({}),
      ),
    ).toThrow("DATABASE_URL");
    expect(() =>
      createFarmWorkspaceStore(
        {
          NODE_ENV: "production",
          AQUAPULSE_FARM_STORAGE: "postgres",
          AQUAPULSE_FARM_DATABASE_URL: "postgres://localhost/test",
        },
        initialFarmWorkspace({}),
      ),
    ).toThrow("TLS");
  });
  it("isolates failed memory transactions and exported result references", async () => {
    const state = initialFarmWorkspace({});
    const store = new MemoryFarmWorkspaceStore(state);
    await expect(
      store.transaction((workspace) => {
        workspace.organizationName = "Changed";
        throw new Error("Abort");
      }),
    ).rejects.toThrow("Abort");
    const copy = await store.transaction((workspace) => workspace);
    copy.organizationName = "Mutated";
    expect(
      (await store.transaction((workspace) => workspace)).organizationName,
    ).toBe(state.organizationName);
  });
});

describe("enterprise-specific capture contracts", () => {
  for (const enterprise of farmEnterpriseCatalog)
    it(`validates all ${enterprise.id} activities and rejects unknown fields`, () => {
      for (const activity of enterprise.activities) {
        const fields = Object.fromEntries(
          activity.fields
            .filter((field) => field.required)
            .map((field) => [
              field.key,
              field.kind === "number"
                ? Math.max(1, field.min || 0)
                : field.kind === "date"
                  ? "2026-02-01"
                  : "Test record",
            ]),
        );
        if (!Object.keys(fields).length) {
          const field = activity.fields[0];
          fields[field.key] = field.kind === "number" ? 1 : "Test record";
        }
        expect(
          validateFarmActivityFields(enterprise.id, activity.id, fields)
            .success,
        ).toBe(true);
        expect(
          validateFarmActivityFields(enterprise.id, activity.id, {
            ...fields,
            forgedField: "not accepted",
          }).success,
        ).toBe(false);
      }
    });
  it("rejects impossible hatch rates, fractional counts and pH values", () => {
    expect(
      validateFarmActivityFields("poultry", "incubation", {
        eggsSet: 10,
        hatched: 11,
        lot: "LOT",
      }).success,
    ).toBe(false);
    expect(
      validateFarmActivityFields("poultry", "eggs", {
        eggs: 2.5,
        grade: "A",
        lot: "LOT",
      }).success,
    ).toBe(false);
    expect(
      validateFarmActivityFields("aquaculture", "water_sample", { ph: 15 })
        .success,
    ).toBe(false);
    expect(
      validateFarmActivityFields("aquaculture", "water_sample", {}).success,
    ).toBe(false);
  });
});

describe("durable ERP draft queue", () => {
  async function jobFixture(gateway: { ensureDraft: () => Promise<string> }) {
    const context = await fixture(gateway);
    const job = (await context.service.create("manager", "erp-jobs", {
      submissionId: randomUUID(),
      farmId: context.farm.id,
      kind: "Sales Invoice",
      party: "Test Customer",
      postingDate: "2026-02-01",
      lines: [{ itemCode: "FISH", quantity: 10, rate: 100 }],
    })) as { id: string };
    return { ...context, job };
  }
  it("requires independent approval, serializes dispatch and saves provider receipts", async () => {
    let sends = 0;
    let finish!: (name: string) => void;
    const { service, job } = await jobFixture({
      ensureDraft: async () => {
        sends++;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    });
    await expect(service.dispatchErp("accountant", job.id)).rejects.toThrow(
      "Approve",
    );
    await expect(
      service.decide("manager", "erp-jobs", job.id, {
        decision: "approve",
        reason: "Checked",
      }),
    ).rejects.toThrow();
    await service.decide("accountant", "erp-jobs", job.id, {
      decision: "approve",
      reason: "Invoice checked",
    });
    const first = service.dispatchErp("accountant", job.id);
    while (!finish) await new Promise((resolve) => setTimeout(resolve, 1));
    await expect(service.dispatchErp("accountant", job.id)).rejects.toThrow(
      "already",
    );
    finish("SINV-TEST");
    expect((await first).status).toBe("draft_created");
    expect((await service.dispatchErp("accountant", job.id)).externalName).toBe(
      "SINV-TEST",
    );
    expect(sends).toBe(1);
  });
  it("retains a confirmed receipt when the caller is revoked in flight", async () => {
    let finish!: (name: string) => void;
    const { service, job, farm } = await jobFixture({
      ensureDraft: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    });
    await service.decide("accountant", "erp-jobs", job.id, {
      decision: "approve",
      reason: "Checked invoice",
    });
    const pending = service.dispatchErp("accountant", job.id);
    while (!finish) await new Promise((resolve) => setTimeout(resolve, 1));
    await service.create("owner", "memberships", {
      userId: "accountant",
      role: "accountant",
      farmIds: [farm.id],
      active: false,
    });
    finish("SINV-TEST");
    await expect(pending).rejects.toThrow("membership");
    expect((await service.view("owner")).erpJobs[0].externalName).toBe(
      "SINV-TEST",
    );
  });
  it("redacts provider failures and rejects revoked approvals on retry", async () => {
    const { service, job, farm } = await jobFixture({
      ensureDraft: async () => {
        throw new Error("secret=do-not-store");
      },
    });
    await service.decide("accountant", "erp-jobs", job.id, {
      decision: "approve",
      reason: "Invoice checked",
    });
    const failed = await service.dispatchErp("accountant", job.id);
    expect(failed.status).toBe("failed");
    expect(JSON.stringify(failed)).not.toContain("do-not-store");
    await service.create("owner", "memberships", {
      userId: "accountant",
      role: "accountant",
      farmIds: [farm.id],
      active: false,
    });
    await expect(service.dispatchErp("owner", job.id)).rejects.toThrow(
      "membership",
    );
  });
  it("does not send an approved request after its Company mapping changes", async () => {
    let sends = 0;
    const { service, job } = await jobFixture({
      ensureDraft: async () => {
        sends++;
        return "SINV";
      },
    });
    await service.decide("accountant", "erp-jobs", job.id, {
      decision: "approve",
      reason: "Invoice checked",
    });
    const entity = (await service.view("owner")).legalEntities[0];
    await service.configureErpCompany("owner", entity.id, {
      erpCompany: "Different ERP Company",
    });
    await expect(service.dispatchErp("accountant", job.id)).rejects.toThrow(
      "mapping changed",
    );
    expect(sends).toBe(0);
    await service.decide("accountant", "erp-jobs", job.id, {
      decision: "reject",
      reason: "Create a request for the new mapping",
    });
  });
});
