import { Module } from "@nestjs/common";
import { AiApplicationService } from "./application/ai.application-service";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({ controllers: [AiController], providers: [AiService, AiApplicationService], exports: [AiService, AiApplicationService] })
export class AiModule {}
