import { Module } from "@nestjs/common";
import { TasksApplicationService } from "./application/tasks.application-service";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

const TASKS_PROVIDERS = [TasksService, TasksApplicationService];
const TASKS_EXPORTS = [TasksService, TasksApplicationService];

@Module({
  imports: [],
  controllers: [TasksController],
  providers: TASKS_PROVIDERS,
  exports: TASKS_EXPORTS
})
export class TasksModule {}
