import type { TaskCreateRequest, TaskSummary } from "@aquapulse/types";
import { taskCreateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import {
  createValidatedSubmitter,
  type SubmissionResult,
  type SubmissionSuccess,
  type SubmissionValidationError
} from "./form-submission";

export type TaskCreateValidationError = SubmissionValidationError<keyof TaskCreateRequest>;
export type TaskCreateSuccess = SubmissionSuccess<TaskSummary>;
export type TaskCreateSubmissionResult = SubmissionResult<TaskSummary, keyof TaskCreateRequest>;

export function createTaskSubmitter(
  repositories: Pick<AquaPulseRepositories, "tasks">
) {
  return createValidatedSubmitter({
    schema: taskCreateSchema,
    fields: ["title", "assigneeId", "pondId"] as const,
    submit: async (input: TaskCreateRequest) => {
      const response = await repositories.tasks.create(input);
      return response.data;
    }
  });
}

export async function submitTask(
  input: TaskCreateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<TaskCreateSubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createTaskSubmitter(repositories);
  return submitter(input);
}
