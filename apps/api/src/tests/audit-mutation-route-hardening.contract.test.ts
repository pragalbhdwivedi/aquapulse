import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AuditApplicationService } from "../modules/audit/application/audit.application-service";
import { InMemoryAuditRepository } from "../modules/audit/repositories/in-memory-audit.repository";

describe("Audit mutation route hardening", () => {
  it("blocks POST-style audit creation for ordinary keycloak operators", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    await expect(
      service.create({}, { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("blocks PATCH-style audit updates for ordinary keycloak operators", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    await expect(
      service.update("audit-1", {}, { id: "user-1", provider: "keycloak" })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("keeps local-safe audit mutation behavior available for development flows", async () => {
    const service = new AuditApplicationService(new InMemoryAuditRepository());

    const created = await service.create({}, { id: "local-operator", provider: "local" });
    const updated = await service.update("audit-1", {}, { id: "local-operator", provider: "local" });

    expect(created.ok).toBe(true);
    expect(created.data.id).toBeTruthy();
    expect(updated.ok).toBe(true);
    expect(updated.data.id).toBe("audit-1");
  });
});
