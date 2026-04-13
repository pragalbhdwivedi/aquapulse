import type { ApiSuccessEnvelope, ListResponse, TaskSummary } from "@aquapulse/types";
import type { CreateTasksDto, QueryTasksDto, UpdateTasksDto } from "../dto";

const task: TaskSummary = { id: "task-1", createdAt: "2026-04-13T00:00:00.000Z", updatedAt: "2026-04-13T00:00:00.000Z", title: "Inspect aeration equipment", status: "todo", assigneeId: "user-1", pondId: "pond-1" };

export class TasksApplicationService {
  async create(_input: CreateTasksDto): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: task }; }
  async update(_id: string, _input: UpdateTasksDto): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: task }; }
  async list(_query: QueryTasksDto): Promise<ApiSuccessEnvelope<ListResponse<TaskSummary>>> { return { ok: true, data: { items: [task], page: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } } }; }
  async getById(_id: string): Promise<ApiSuccessEnvelope<TaskSummary>> { return { ok: true, data: task }; }
}
