import type {
  AlertAssignActionRequest,
  AlertReviewStateActionRequest,
  AlertSummary,
  AlertUnassignActionRequest
} from "@aquapulse/types";
import {
  alertAssignActionSchema,
  alertReviewStateActionSchema,
  alertUnassignActionSchema
} from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { MutationSyncSubmissionResult, MutationSyncSuccess } from "./mutation-refresh";
import { createMutationSyncSubmitter } from "./mutation-refresh";

export type AlertTriageAction = "assign" | "unassign" | "setReviewState";
type AlertListData = Awaited<ReturnType<AquaPulseRepositories["alerts"]["list"]>>["data"];
type AlertDetailData = Awaited<ReturnType<AquaPulseRepositories["alerts"]["getById"]>>["data"];

export type AlertTriageSuccess = MutationSyncSuccess<AlertSummary, AlertListData, AlertDetailData>;
export type AlertAssignSubmissionResult = MutationSyncSubmissionResult<
  AlertSummary,
  keyof AlertAssignActionRequest,
  AlertListData,
  AlertDetailData
>;
export type AlertUnassignSubmissionResult = MutationSyncSubmissionResult<
  AlertSummary,
  keyof AlertUnassignActionRequest,
  AlertListData,
  AlertDetailData
>;
export type AlertReviewStateSubmissionResult = MutationSyncSubmissionResult<
  AlertSummary,
  keyof AlertReviewStateActionRequest,
  AlertListData,
  AlertDetailData
>;

export function createAlertAssignSubmitter(
  repositories: Pick<AquaPulseRepositories, "alerts">
) {
  return (alertId: string) =>
    createMutationSyncSubmitter({
      schema: alertAssignActionSchema,
      fields: ["assignedTo", "note"] as const,
      submit: async (input: AlertAssignActionRequest) => {
        const response = await repositories.alerts.assign(alertId, input);
        return response.data;
      },
      refreshList: async () => (await repositories.alerts.list({ page: 1, pageSize: 20 })).data,
      refreshDetail: async () => (await repositories.alerts.getById(alertId)).data
    });
}

export function createAlertUnassignSubmitter(
  repositories: Pick<AquaPulseRepositories, "alerts">
) {
  return (alertId: string) =>
    createMutationSyncSubmitter({
      schema: alertUnassignActionSchema,
      fields: ["note"] as const,
      submit: async (input: AlertUnassignActionRequest) => {
        const response = await repositories.alerts.unassign(alertId, input);
        return response.data;
      },
      refreshList: async () => (await repositories.alerts.list({ page: 1, pageSize: 20 })).data,
      refreshDetail: async () => (await repositories.alerts.getById(alertId)).data
    });
}

export function createAlertReviewStateSubmitter(
  repositories: Pick<AquaPulseRepositories, "alerts">
) {
  return (alertId: string) =>
    createMutationSyncSubmitter({
      schema: alertReviewStateActionSchema,
      fields: ["reviewState", "reviewLabel", "note"] as const,
      submit: async (input: AlertReviewStateActionRequest) => {
        const response = await repositories.alerts.setReviewState(alertId, input);
        return response.data;
      },
      refreshList: async () => (await repositories.alerts.list({ page: 1, pageSize: 20 })).data,
      refreshDetail: async () => (await repositories.alerts.getById(alertId)).data
    });
}

export async function submitAlertTriageAction(
  action: AlertTriageAction,
  alertId: string,
  input: AlertAssignActionRequest | AlertUnassignActionRequest | AlertReviewStateActionRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<
  AlertAssignSubmissionResult | AlertUnassignSubmissionResult | AlertReviewStateSubmissionResult
> {
  const repositories = createRepositories(createApiClients(runtime));

  if (action === "assign") {
    return createAlertAssignSubmitter(repositories)(alertId)(input as AlertAssignActionRequest);
  }

  if (action === "unassign") {
    return createAlertUnassignSubmitter(repositories)(alertId)(input as AlertUnassignActionRequest);
  }

  return createAlertReviewStateSubmitter(repositories)(alertId)(
    input as AlertReviewStateActionRequest
  );
}
