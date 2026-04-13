import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { AiModule } from "./modules/ai/ai.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { AuditModule } from "./modules/audit/audit.module";
import { BatchesModule } from "./modules/batches/batches.module";
import { FeedModule } from "./modules/feed/feed.module";
import { PondsModule } from "./modules/ponds/ponds.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { WaterQualityModule } from "./modules/water-quality/water-quality.module";

const CORE_MODULES = [
  PondsModule,
  BatchesModule,
  WaterQualityModule,
  FeedModule,
  TasksModule,
  AlertsModule,
  AttachmentsModule,
  AuditModule,
  AiModule
];

@Module({
  imports: CORE_MODULES,
  controllers: [HealthController]
})
export class AppModule {}
