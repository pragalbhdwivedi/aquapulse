import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AiApplicationService } from "../modules/ai/application/ai.application-service";
import { InMemoryAiRepository } from "../modules/ai/repositories/in-memory-ai.repository";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
import { AttachmentsApplicationService } from "../modules/attachments/application/attachments.application-service";
import { InMemoryAttachmentsRepository } from "../modules/attachments/repositories/in-memory-attachments.repository";
import { AuditApplicationService } from "../modules/audit/application/audit.application-service";
import { InMemoryAuditRepository } from "../modules/audit/repositories/in-memory-audit.repository";
import { BatchesApplicationService } from "../modules/batches/application/batches.application-service";
import { InMemoryBatchesRepository } from "../modules/batches/repositories/in-memory-batches.repository";
import { FeedApplicationService } from "../modules/feed/application/feed.application-service";
import { InMemoryFeedRepository } from "../modules/feed/repositories/in-memory-feed.repository";
import { PondReadAuthorizationService } from "../modules/pond-responsibility/application/pond-read-authorization.service";
import { InMemoryPondResponsibilityRepository } from "../modules/pond-responsibility/repositories/in-memory-pond-responsibility.repository";
import { PondsApplicationService } from "../modules/ponds/application/ponds.application-service";
import { InMemoryPondsRepository } from "../modules/ponds/repositories/in-memory-ponds.repository";
import { ParentResourceScopeResolverService } from "../modules/resource-scope/application/parent-resource-scope-resolver.service";
import { TasksApplicationService } from "../modules/tasks/application/tasks.application-service";
import { InMemoryTasksRepository } from "../modules/tasks/repositories/in-memory-tasks.repository";
import { WaterQualityApplicationService } from "../modules/water-quality/application/water-quality.application-service";
import { InMemoryWaterQualityRepository } from "../modules/water-quality/repositories/in-memory-water-quality.repository";

describe("Attachment read-scope by parent resource", () => {
  function createResolver() {
    const alerts = new AlertsApplicationService(new InMemoryAlertsRepository());
    const pondReadAuthorizationService = new PondReadAuthorizationService(
      new InMemoryPondResponsibilityRepository()
    );

    return new ParentResourceScopeResolverService(
      alerts,
      new TasksApplicationService(new InMemoryTasksRepository()),
      new PondsApplicationService(new InMemoryPondsRepository(), pondReadAuthorizationService),
      new BatchesApplicationService(new InMemoryBatchesRepository(), pondReadAuthorizationService),
      new FeedApplicationService(new InMemoryFeedRepository(), alerts, pondReadAuthorizationService),
      new WaterQualityApplicationService(
        new InMemoryWaterQualityRepository(),
        alerts,
        pondReadAuthorizationService
      ),
      new AiApplicationService(new InMemoryAiRepository()),
      new AuditApplicationService(new InMemoryAuditRepository())
    );
  }

  function createService(repository = new InMemoryAttachmentsRepository()) {
    return new AttachmentsApplicationService(repository, createResolver());
  }

  it("scopes attachment list reads to parents readable by the requesting keycloak operator", async () => {
    const service = createService();

    const attachments = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(attachments.data.items).toHaveLength(1);
    expect(attachments.data.items[0]?.id).toBe("attachment-1");
    expect(attachments.data.items[0]?.resourceType).toBe("alert");
    expect(attachments.data.items[0]?.resourceId).toBe("alert-1");
  });

  it("returns an empty attachment list when the keycloak actor cannot read any linked parents", async () => {
    const service = createService();

    const attachments = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-9", provider: "keycloak", roles: ["operator"] }
    );

    expect(attachments.data.items).toHaveLength(0);
    expect(attachments.data.page.totalItems).toBe(0);
    expect(attachments.data.page.totalPages).toBe(1);
  });

  it("returns not found when a keycloak operator requests an out-of-scope attachment detail", async () => {
    const service = createService();

    await expect(
      service.getById("attachment-1", { id: "user-2", provider: "keycloak", roles: ["operator"] })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("hides unsupported parent-resource links in active auth mode", async () => {
    const repository = {
      create: async () => ({
        id: "attachment-unsupported",
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
        resourceType: "unknown-parent",
        resourceId: "parent-1",
        fileName: "unknown.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      }),
      update: async () => ({
        id: "attachment-unsupported",
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
        resourceType: "unknown-parent",
        resourceId: "parent-1",
        fileName: "unknown.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      }),
      getById: async () => ({
        id: "attachment-unsupported",
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
        resourceType: "unknown-parent",
        resourceId: "parent-1",
        fileName: "unknown.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      }),
      list: async () => ({
        items: [
          {
            id: "attachment-unsupported",
            createdAt: "2026-04-13T00:00:00.000Z",
            updatedAt: "2026-04-13T00:00:00.000Z",
            resourceType: "unknown-parent",
            resourceId: "parent-1",
            fileName: "unknown.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1024
          }
        ],
        page: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1
        }
      }),
      listByResource: async () => ({
        items: [],
        page: {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1
        }
      })
    };
    const service = createService(repository);

    const attachments = await service.list(
      { page: 1, pageSize: 20 },
      { id: "user-1", provider: "keycloak", roles: ["operator"] }
    );

    expect(attachments.data.items).toHaveLength(0);
    await expect(
      service.getById("attachment-unsupported", {
        id: "user-1",
        provider: "keycloak",
        roles: ["operator"]
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("keeps local-safe attachment reads broad for development flows", async () => {
    const service = createService();

    const attachments = await service.list(
      { page: 1, pageSize: 20 },
      { id: "local-operator", provider: "local", roles: ["operator"] }
    );
    const attachment = await service.getById("attachment-1", {
      id: "local-operator",
      provider: "local",
      roles: ["operator"]
    });

    expect(attachments.data.items.some((item) => item.id === "attachment-1")).toBe(true);
    expect(attachment.data.id).toBe("attachment-1");
  });
});
