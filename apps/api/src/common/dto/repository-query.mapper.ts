import {
  normalizeRepositoryListQuery,
  type RepositoryListQuery,
  type RepositoryListQueryInput
} from "@aquapulse/database";

export function toRepositoryListQuery<TInput extends RepositoryListQueryInput, TExtra extends object>(
  input: TInput,
  extra: TExtra
): RepositoryListQuery & TExtra {
  return {
    ...normalizeRepositoryListQuery(input),
    ...extra
  };
}
