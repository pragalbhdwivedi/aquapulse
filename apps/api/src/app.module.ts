import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PondsModule } from "./modules/ponds/ponds.module";
import { BatchesModule } from "./modules/batches/batches.module";
import { WaterQualityModule } from "./modules/water-quality/water-quality.module";
import { FeedModule } from "./modules/feed/feed.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { MortalityModule } from "./modules/mortality/mortality.module";
import { TreatmentsModule } from "./modules/treatments/treatments.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { HarvestModule } from "./modules/harvest/harvest.module";
import { SalesModule } from "./modules/sales/sales.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { AiModule } from "./modules/ai/ai.module";
import { AuditModule } from "./modules/audit/audit.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MapsModule } from "./modules/maps/maps.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PondsModule,
    BatchesModule,
    WaterQualityModule,
    FeedModule,
    InventoryModule,
    MortalityModule,
    TreatmentsModule,
    ExpensesModule,
    HarvestModule,
    SalesModule,
    TasksModule,
    AttachmentsModule,
    AlertsModule,
    ApprovalsModule,
    ReportsModule,
    AiModule,
    AuditModule,
    NotificationsModule,
    MapsModule,
    IntegrationsModule
  ],
  controllers: [HealthController],
})
export class AppModule {}

