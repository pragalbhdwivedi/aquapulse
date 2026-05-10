import { Injectable, NotFoundException } from "@nestjs/common";
import { AiApplicationService } from "../../ai/application/ai.application-service";
import { AlertsApplicationService } from "../../alerts/application/alerts.application-service";
import { AuditApplicationService } from "../../audit/application/audit.application-service";
import { BatchesApplicationService } from "../../batches/application/batches.application-service";
import { FeedApplicationService } from "../../feed/application/feed.application-service";
import { PondsApplicationService } from "../../ponds/application/ponds.application-service";
import { TasksApplicationService } from "../../tasks/application/tasks.application-service";
import { WaterQualityApplicationService } from "../../water-quality/application/water-quality.application-service";
import type {
  ParentResourceReadScopeResult,
  ParentResourceScopeActor,
  SupportedParentResourceType
} from "../resource-scope.models";

const RESOURCE_TYPE_ALIASES: Record<string, SupportedParentResourceType> = {
  alert: "alert",
  alerts: "alert",
  task: "task",
  tasks: "task",
  pond: "pond",
  ponds: "pond",
  batch: "batch",
  batches: "batch",
  feed: "feed",
  "water-quality": "water-quality",
  water_quality: "water-quality",
  waterquality: "water-quality",
  ai: "ai",
  "ai-history": "ai",
  ai_history: "ai",
  audit: "audit",
  "audit-event": "audit",
  audit_event: "audit"
};

function normalizeParentResourceType(
  resourceType: string
): SupportedParentResourceType | undefined {
  return RESOURCE_TYPE_ALIASES[resourceType.trim().toLowerCase()];
}

@Injectable()
export class ParentResourceScopeResolverService {
  constructor(
    private readonly alertsApplicationService: AlertsApplicationService,
    private readonly tasksApplicationService: TasksApplicationService,
    private readonly pondsApplicationService: PondsApplicationService,
    private readonly batchesApplicationService: BatchesApplicationService,
    private readonly feedApplicationService: FeedApplicationService,
    private readonly waterQualityApplicationService: WaterQualityApplicationService,
    private readonly aiApplicationService: AiApplicationService,
    private readonly auditApplicationService: AuditApplicationService
  ) {}

  async canReadResource(
    actor: ParentResourceScopeActor | undefined,
    resourceType: string,
    resourceId: string
  ): Promise<ParentResourceReadScopeResult> {
    const canonicalResourceType = normalizeParentResourceType(resourceType);

    if (actor?.provider !== "keycloak") {
      return {
        decision: "defer_local_safe_allow",
        resourceType,
        resourceId,
        canonicalResourceType,
        reason: "local_safe_broad_mode"
      };
    }

    if (!canonicalResourceType) {
      return {
        decision: "unknown",
        resourceType,
        resourceId,
        reason: "unsupported_resource_type"
      };
    }

    const allowed = await this.readScopedParentResource(actor, canonicalResourceType, resourceId);

    return {
      decision: allowed ? "allow" : "deny",
      resourceType,
      resourceId,
      canonicalResourceType,
      reason: allowed ? "scoped_parent_read_allowed" : "scoped_parent_read_denied"
    };
  }

  private async readScopedParentResource(
    actor: ParentResourceScopeActor,
    resourceType: SupportedParentResourceType,
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case "alert":
          await this.alertsApplicationService.getById(resourceId, actor);
          return true;
        case "task":
          await this.tasksApplicationService.getById(resourceId, actor);
          return true;
        case "pond":
          await this.pondsApplicationService.getById(resourceId, actor);
          return true;
        case "batch":
          await this.batchesApplicationService.getById(resourceId, actor);
          return true;
        case "feed":
          await this.feedApplicationService.getById(resourceId, actor);
          return true;
        case "water-quality":
          await this.waterQualityApplicationService.getById(resourceId, actor);
          return true;
        case "ai":
          await this.aiApplicationService.getById(resourceId, actor);
          return true;
        case "audit":
          await this.auditApplicationService.getById(resourceId, actor);
          return true;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }

      throw error;
    }
  }
}
