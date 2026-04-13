export class UpdateTaskDto {
  title?: string;
  status?: "todo" | "in_progress" | "done" | "cancelled";
}
