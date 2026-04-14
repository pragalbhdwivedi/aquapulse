import type { TaskCreateRequest, TaskSummary } from "@aquapulse/types";
import { taskCreateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import {
  type SubmissionValidationError
} from "./form-submission";
import {
  createMutationSubmitter,
  type MutationSubmissionResult,
  type MutationSuccess
} from "./mutation-refresh";

export type TaskCreateValidationError = SubmissionValidationError<keyof TaskCreateRequest>;
export type TaskCreateSuccess = MutationSuccess<
  TaskSummary,
  Awaited<ReturnType<AquaPulseRepositories["tasks"]["list"]>>["data"]
>;
export type TaskCreateSubmissionResult = MutationSubmissionResult<
  TaskSummary,
  keyof TaskCreateRequest,
  Awaited<ReturnType<AquaPulseRepositories["tasks"]["list"]>>["data"]
>;

export function createTaskSubmitter(
  repositories: Pick<AquaPulseRepositories, "tasks">
) {
  return createMutationSubmitter({
    schema: taskCreateSchema,
    fields: ["title", "assigneeId", "pondId"] as const,
    submit: async (input: TaskCreateRequest) => {
      const response = await repositories.tasks.create(input);
      return response.data;
    },
    refreshList: async (input) => {
      const refreshed = await repositories.tasks.list({
        page: 1,
        pageSize: 20,
        pondId: input.pondId
      });
      return refreshed.data;
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
