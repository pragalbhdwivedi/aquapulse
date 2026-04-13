import { Module } from "@nestjs/common";
import { TasksApplicationService } from "./application/tasks.application-service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({ controllers: [TasksController], providers: [TasksService, TasksApplicationService], exports: [TasksService, TasksApplicationService] })
export class TasksModule {}
