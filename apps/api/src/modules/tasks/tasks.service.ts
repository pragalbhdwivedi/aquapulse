import { Injectable } from "@nestjs/common";

@Injectable()
export class TasksService { async getPlaceholder() { return { ok: true, data: { module: "tasks", status: "placeholder" } }; } }
