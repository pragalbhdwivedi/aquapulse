import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  createListQueryPlan,
  createLookupQueryPlan,
  createMutationQueryPlan,
  createPlaceholderFeedRow,
  feedRowMapper,
  mapCreateFeedInputToRowWrite,
  mapUpdateFeedInputToRowPatch,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory,
  type FeedRow,
  type FeedRowPatch,
  type FeedRowWrite
} from "@aquapulse/database";
import type { FeedEntry, ListResponse } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateFeedDto, UpdateFeedDto } from "../dto";
import type { FeedRepositoryPort } from "../ports/feed-repository.port";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

export interface PostgresFeedRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

export function buildFeedByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("feed.getById", id);
}

export function buildFeedListQueryPlan(query: FeedListQueryContract): CompiledQueryPlan {
  return createListQueryPlan({
    key: "feed.list",
    query,
    params: [query.page, query.pageSize, query.pondId ?? null, query.batchId ?? null, query.feedType ?? null, query.search ?? null],
    filters: {
      pondId: query.pondId,
      batchId: query.batchId,
      feedType: query.feedType,
      search: query.search
    }
  });
}

export function buildCreateFeedQueryPlan(row: FeedRowWrite): CompiledQueryPlan {
  return createMutationQueryPlan("feed.create", row);
}

export function buildUpdateFeedQueryPlan(id: string, patch: FeedRowPatch): CompiledQueryPlan {
  return createMutationQueryPlan("feed.update", patch, {
    params: [id, patch],
    filters: { id }
  });
}

@Injectable()
export class PostgresFeedRepository implements FeedRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PlaceholderDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresFeedRepositoryDependencies = {}
  ): PostgresFeedRepository {
    const repository = new PostgresFeedRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: CreateFeedDto): Promise<FeedEntry> {
    const row = mapCreateFeedInputToRowWrite(input);
    return this.gateway.executeMappedMutation(
      buildCreateFeedQueryPlan(row),
      feedRowMapper,
      createPlaceholderFeedRow({ id: row.id })
    );
  }

  async update(id: string, input: UpdateFeedDto): Promise<FeedEntry> {
    const patch = mapUpdateFeedInputToRowPatch(id, input);
    return this.gateway.executeMappedMutation(
      buildUpdateFeedQueryPlan(id, patch),
      feedRowMapper,
      createPlaceholderFeedRow({ id })
    );
  }

  async getById(id: string): Promise<FeedEntry> {
    return this.gateway.executeMappedItem(
      buildFeedByIdQueryPlan(id),
      feedRowMapper,
      createPlaceholderFeedRow({ id })
    );
  }

  async list(query: FeedListQueryContract): Promise<ListResponse<FeedEntry>> {
    return this.gateway.executeMappedList(buildFeedListQueryPlan(query), feedRowMapper, {
      page: query.page,
      pageSize: query.pageSize,
      fallbackRows: [createPlaceholderFeedRow()]
    });
  }

  private get gateway(): PostgresRowGateway {
    return new PostgresRowGateway({
      connectionFactory: this.connectionFactory,
      databaseConfig: this.databaseConfig
    });
  }
}

export const POSTGRES_FEED_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update"],
  rowSource: "feed_entries",
  queryNotes: [
    "shape feed list retrieval through compiled list plans",
    "keep feed read and write execution on the shared Postgres row gateway"
  ],
  mappingNotes: [
    "map feed entry rows into FeedEntry via shared row mappers",
    "shape create/update DTO inputs into feed row payloads"
  ]
} as const;
