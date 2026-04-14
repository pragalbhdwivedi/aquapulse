import type { FeedEntry, FeedUpdateRequest } from "@aquapulse/types";
import { feedEntryUpdateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { SubmissionValidationError } from "./form-submission";
import {
  createMutationSyncSubmitter,
  type MutationSyncSubmissionResult,
  type MutationSyncSuccess
} from "./mutation-refresh";

export type FeedUpdateValidationError = SubmissionValidationError<keyof FeedUpdateRequest>;
export type FeedUpdateSuccess = MutationSyncSuccess<
  FeedEntry,
  Awaited<ReturnType<AquaPulseRepositories["feed"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["feed"]["getById"]>>["data"]
>;
export type FeedUpdateSubmissionResult = MutationSyncSubmissionResult<
  FeedEntry,
  keyof FeedUpdateRequest,
  Awaited<ReturnType<AquaPulseRepositories["feed"]["list"]>>["data"],
  Awaited<ReturnType<AquaPulseRepositories["feed"]["getById"]>>["data"]
>;

export function createFeedUpdateSubmitter(
  repositories: Pick<AquaPulseRepositories, "feed">
) {
  return (feedId: string) =>
    createMutationSyncSubmitter({
      schema: feedEntryUpdateSchema,
      fields: ["feedType", "quantityKg", "fedAt", "batchId"] as const,
      submit: async (input: FeedUpdateRequest) => {
        const response = await repositories.feed.update(feedId, input);
        return response.data;
      },
      refreshList: async (_input, data) => {
        const refreshed = await repositories.feed.list({
          page: 1,
          pageSize: 20,
          pondId: data.pondId
        });
        return refreshed.data;
      },
      refreshDetail: async (_input, data) => {
        const refreshed = await repositories.feed.getById(data.id);
        return refreshed.data;
      }
    });
}

export async function submitFeedUpdate(
  feedId: string,
  input: FeedUpdateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<FeedUpdateSubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createFeedUpdateSubmitter(repositories)(feedId);
  return submitter(input);
}
