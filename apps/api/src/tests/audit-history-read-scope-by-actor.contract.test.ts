import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuditApplicationService } from "../modules/audit/application/audit.application-service";
import { InMemoryAuditRepository } from "../modules/audit/repositories/in-memory-audit.repository";

describe("Audit history read-scope by actor", () => {
  it("scopes audit list reads to the requesting keycloak operator actor id", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    const audit = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak" }
    );

    expect(audit.data.items.length).toBeGreaterThan(0);
    expect(audit.data.items.some((item) => item.id === "audit-1")).toBe(true);
    expect(audit.data.items.some((item) => item.id === "audit-2")).toBe(false);
    expect(audit.data.items.some((item) => item.id === "audit-3")).toBe(false);
  });

  it("allows audit detail reads for the matching keycloak operator actor id", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    const audit = await service.getById("audit-2", {
      id: "user-2",
      provider: "keycloak"
    });

    expect(audit.data.id).toBe("audit-2");
  });

  it("returns not found when a keycloak operator requests another actor's audit event", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    await expect(
      service.getById("audit-2", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("hides metadata-less audit rows from keycloak-scoped audit reads", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    const audit = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak" }
    );

    expect(audit.data.items.some((item) => item.id === "audit-3")).toBe(false);
    await expect(
      service.getById("audit-3", { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("keeps local-safe audit reads broad for development flows", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    const audit = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local" }
    );

    expect(audit.data.items.some((item) => item.id === "audit-1")).toBe(true);
    expect(audit.data.items.some((item) => item.id === "audit-2")).toBe(true);
    expect(audit.data.items.some((item) => item.id === "audit-3")).toBe(true);
  });
});
