import type { PaginationParams, SortOption } from "@aquapulse/types";
import type { CompiledQueryPlan } from "./query-contracts.js";

export interface QueryPlanDefinition {
  readonly key: string;
  readonly statement?: string;
  readonly params?: readonly unknown[];
  readonly filters?: Readonly<Record<string, unknown>>;
  readonly sort?: readonly SortOption[];
}

export function createCompiledQueryPlan(definition: QueryPlanDefinition): CompiledQueryPlan {
  return {
    key: definition.key,
    statement: definition.statement ?? definition.key,
    params: definition.params ?? [],
    filters: definition.filters,
    sort: definition.sort
  };
}

export function createLookupQueryPlan(
  key: string,
  id: string,
  extra: Partial<Omit<QueryPlanDefinition, "key">> = {}
): CompiledQueryPlan {
  return createCompiledQueryPlan({
    ...extra,
    key,
    params: extra.params ?? [id],
    filters: extra.filters ?? { id }
  });
}

export function createMutationQueryPlan<TPayload extends object>(
  key: string,
  payload: TPayload,
  extra: Partial<Omit<QueryPlanDefinition, "key">> = {}
): CompiledQueryPlan {
  return createCompiledQueryPlan({
    ...extra,
    key,
    params: extra.params ?? [payload],
    filters: extra.filters ?? (payload as Readonly<Record<string, unknown>>)
  });
}

export interface ListQueryInput extends PaginationParams {
  readonly sort?: readonly SortOption[];
}

export interface ListQueryPlanOptions<TQuery extends ListQueryInput> {
  readonly key: string;
  readonly query: TQuery;
  readonly params: readonly unknown[];
  readonly filters?: Readonly<Record<string, unknown>>;
}

export function createListQueryPlan<TQuery extends ListQueryInput>(
  options: ListQueryPlanOptions<TQuery>
): CompiledQueryPlan {
  return {
    key: options.key,
    statement: options.key,
    params: options.params,
    pagination: { page: options.query.page, pageSize: options.query.pageSize },
    filters: options.filters,
    sort: options.query.sort
  };
}
