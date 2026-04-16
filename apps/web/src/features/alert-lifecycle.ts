import type { AlertLifecycleActionRequest, AlertSummary } from "@aquapulse/types";
import { alertLifecycleActionSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { SubmissionValidationError } from "./form-submission";
import {
  createMutationSyncSubmitter,
  type MutationSyncSubmissionResult,
  type MutationSyncSuccess
} from "./mutation-refresh";

export type AlertLifecycleAction = "acknowledge" | "resolve";
export type AlertLifecycleValidationError = SubmissionValidationError<keyof AlertLifecycleActionRequest>;
export type AlertLifecycleSuccess = MutationSyncSuccess<
  AlertSummary,
  Awaited<ReturnType<AquaPulseRepositories["alerts"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["alerts"]["getById"]>>["data"]
>;
export type AlertLifecycleSubmissionResult = MutationSyncSubmissionResult<
  AlertSummary,
  keyof AlertLifecycleActionRequest,
  Awaited<ReturnType<AquaPulseRepositories["alerts"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["alerts"]["getById"]>>["data"]
>;

export function createAlertLifecycleSubmitter(
  repositories: Pick<AquaPulseRepositories, "alerts">,
  action: AlertLifecycleAction
) {
  return (alertId: string) =>
    createMutationSyncSubmitter({
      schema: alertLifecycleActionSchema,
      fields: ["note"] as const,
      submit: async (input: AlertLifecycleActionRequest) => {
        const response =
          action === "acknowledge"
            ? await repositories.alerts.acknowledge(alertId, input)
            : await repositories.alerts.resolve(alertId, input);
        return response.data;
      },
      refreshList: async () => {
        const refreshed = await repositories.alerts.list({
          page: 1,
          pageSize: 20
        });
        return refreshed.data;
      },
      refreshDetail: async () => {
        const refreshed = await repositories.alerts.getById(alertId);
        return refreshed.data;
      }
    });
}

export async function submitAlertLifecycleAction(
  action: AlertLifecycleAction,
  alertId: string,
  input: AlertLifecycleActionRequest = {},
  runtime: AquaPulseClientSource = "mock"
): Promise<AlertLifecycleSubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createAlertLifecycleSubmitter(repositories, action)(alertId);
  return submitter(input);
}
