import type { FeedCreateRequest, FeedEntry } from "@aquapulse/types";
import { feedEntryCreateSchema } from "@aquapulse/validation";
import { createApiClients, type AquaPulseClientSource } from "../clients";
import { createRepositories, type AquaPulseRepositories } from "../repositories";
import type { SubmissionValidationError } from "./form-submission";
import {
  createMutationSubmitter,
  type MutationSubmissionResult,
  type MutationSuccess
} from "./mutation-refresh";

export type FeedEntryValidationError = SubmissionValidationError<keyof FeedCreateRequest>;
export type FeedEntrySuccess = MutationSuccess<
  FeedEntry,
  Awaited<ReturnType<AquaPulseRepositories["feed"]["list"]>>["data"]
>;
export type FeedEntrySubmissionResult = MutationSubmissionResult<
  FeedEntry,
  keyof FeedCreateRequest,
  Awaited<ReturnType<AquaPulseRepositories["feed"]["list"]>>["data"]
>;

export function createFeedEntrySubmitter(
  repositories: Pick<AquaPulseRepositories, "feed">
) {
  return createMutationSubmitter({
    schema: feedEntryCreateSchema,
    fields: ["pondId", "batchId", "feedType", "quantityKg", "fedAt"] as const,
    submit: async (input: FeedCreateRequest) => {
      const response = await repositories.feed.create(input);
      return response.data;
    },
    refreshList: async (input) => {
      const refreshed = await repositories.feed.list({
        page: 1,
        pageSize: 20,
        pondId: input.pondId
      });
      return refreshed.data;
    }
  });
}

export async function submitFeedEntry(
  input: FeedCreateRequest,
  runtime: AquaPulseClientSource = "mock"
): Promise<FeedEntrySubmissionResult> {
  const repositories = createRepositories(createApiClients(runtime));
  const submitter = createFeedEntrySubmitter(repositories);
  return submitter(input);
}
