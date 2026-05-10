import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AlertsModule } from "../alerts/alerts.module";
import { AuditModule } from "../audit/audit.module";
import { BatchesModule } from "../batches/batches.module";
import { FeedModule } from "../feed/feed.module";
import { PondsModule } from "../ponds/ponds.module";
import { TasksModule } from "../tasks/tasks.module";
import { WaterQualityModule } from "../water-quality/water-quality.module";
import { ParentResourceScopeResolverService } from "./application/parent-resource-scope-resolver.service";

const RESOURCE_SCOPE_PROVIDERS = [ParentResourceScopeResolverService];
const RESOURCE_SCOPE_EXPORTS = [ParentResourceScopeResolverService];

@Module({
  imports: [
    AlertsModule,
    TasksModule,
    PondsModule,
    BatchesModule,
    FeedModule,
    WaterQualityModule,
    AiModule,
    AuditModule
  ],
  providers: RESOURCE_SCOPE_PROVIDERS,
  exports: RESOURCE_SCOPE_EXPORTS
})
export class ResourceScopeModule {}
