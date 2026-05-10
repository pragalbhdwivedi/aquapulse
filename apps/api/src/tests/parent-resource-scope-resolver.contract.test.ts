import { describe, expect, it } from "vitest";
import { AiApplicationService } from "../modules/ai/application/ai.application-service";
import { InMemoryAiRepository } from "../modules/ai/repositories/in-memory-ai.repository";
import { AlertsApplicationService } from "../modules/alerts/application/alerts.application-service";
import { InMemoryAlertsRepository } from "../modules/alerts/repositories/in-memory-alerts.repository";
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

describe("Parent resource scope resolver foundation", () => {
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

  it("allows scoped parent reads for supported resource types when the keycloak actor can read the parent", async () => {
    const resolver = createResolver();

    const alertResult = await resolver.canReadResource(
      { id: "user-1", provider: "keycloak", roles: ["operator"] },
      "alerts",
      "alert-1"
    );
    const feedResult = await resolver.canReadResource(
      { id: "user-1", provider: "keycloak", roles: ["operator"] },
      "feed",
      "feed-1"
    );

    expect(alertResult).toEqual({
      decision: "allow",
      resourceType: "alerts",
      resourceId: "alert-1",
      canonicalResourceType: "alert",
      reason: "scoped_parent_read_allowed"
    });
    expect(feedResult).toEqual({
      decision: "allow",
      resourceType: "feed",
      resourceId: "feed-1",
      canonicalResourceType: "feed",
      reason: "scoped_parent_read_allowed"
    });
  });

  it("denies supported parent reads when the keycloak actor is out of scope for the parent", async () => {
    const resolver = createResolver();

    const taskResult = await resolver.canReadResource(
      { id: "user-2", provider: "keycloak", roles: ["operator"] },
      "task",
      "task-1"
    );
    const aiResult = await resolver.canReadResource(
      { id: "user-2", provider: "keycloak", roles: ["operator"] },
      "ai",
      "ai-response-1"
    );
    const pondResult = await resolver.canReadResource(
      { id: "user-2", provider: "keycloak", roles: ["operator"] },
      "pond",
      "pond-1"
    );

    expect(taskResult.decision).toBe("deny");
    expect(taskResult.canonicalResourceType).toBe("task");
    expect(aiResult.decision).toBe("deny");
    expect(aiResult.canonicalResourceType).toBe("ai");
    expect(pondResult.decision).toBe("deny");
    expect(pondResult.canonicalResourceType).toBe("pond");
  });

  it("returns unknown for unsupported parent resource types in active keycloak mode", async () => {
    const resolver = createResolver();

    const result = await resolver.canReadResource(
      { id: "user-1", provider: "keycloak", roles: ["operator"] },
      "attachment",
      "attachment-1"
    );

    expect(result).toEqual({
      decision: "unknown",
      resourceType: "attachment",
      resourceId: "attachment-1",
      reason: "unsupported_resource_type"
    });
  });

  it("keeps local-safe parent resolution broad without changing current attachment behavior", async () => {
    const resolver = createResolver();

    const result = await resolver.canReadResource(
      { id: "local-operator", provider: "local", roles: ["operator"] },
      "attachment",
      "attachment-1"
    );

    expect(result).toEqual({
      decision: "defer_local_safe_allow",
      resourceType: "attachment",
      resourceId: "attachment-1",
      canonicalResourceType: undefined,
      reason: "local_safe_broad_mode"
    });
  });
});
