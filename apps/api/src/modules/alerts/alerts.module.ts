import { Module } from "@nestjs/common";
import { AlertsApplicationService } from "./application/alerts.application-service";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";

@Module({ controllers: [AlertsController], providers: [AlertsService, AlertsApplicationService], exports: [AlertsService, AlertsApplicationService] })
export class AlertsModule {}
