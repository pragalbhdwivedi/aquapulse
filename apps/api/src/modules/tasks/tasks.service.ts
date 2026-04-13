import { Injectable } from "@nestjs/common";

@Injectable()
export class TasksService {
  getPlaceholder() {
    return {
      module: "tasks",
      status: "placeholder",
      todo: [
        "Define operational task templates and assignment flow.",
        "Add due dates, completion tracking, and escalations.",
      ],
    };
  }
}
