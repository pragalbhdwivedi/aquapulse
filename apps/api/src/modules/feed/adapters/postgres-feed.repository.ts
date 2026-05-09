import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PostgresDatabaseConnectionFactory,
  PostgresRowGateway,
  createCompiledQueryPlan,
  createLookupQueryPlan,
  createPlaceholderFeedRow,
  feedRowMapper,
  mapCreateFeedInputToRowWrite,
  mapUpdateFeedInputToRowPatch,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory,
  type FeedRow
} from "@aquapulse/database";
import type { FeedCreateRequest, FeedEntry, FeedUpdateRequest, ListResponse } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { FeedRepositoryPort } from "../ports/feed-repository.port";
import type { FeedListQueryContract } from "../query-contracts/feed-query.contract";

export interface PostgresFeedRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

interface FeedListRow extends FeedRow {
  readonly total_count: number;
}

const FEED_SELECT_COLUMNS = `
  id,
  pond_id,
  batch_id,
  feed_type,
  quantity_kg,
  fed_at,
  created_at,
  updated_at
`.trim();

function createFeedWhereClause(
  query: Omit<FeedListQueryContract, "page" | "pageSize">
): { clause: string; params: readonly unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  function addCondition(sql: string, value: unknown) {
    params.push(value);
    conditions.push(sql.replace("?", `$${params.length}`));
  }

  if (query.pondId) {
    addCondition("pond_id = ?", query.pondId);
  }

  if (query.readablePondIds) {
    addCondition("pond_id = any(?)", query.readablePondIds);
  }

  if (query.batchId) {
    addCondition("batch_id = ?", query.batchId);
  }

  if (query.feedType) {
    addCondition("feed_type = ?", query.feedType);
  }

  if (query.search?.trim()) {
    addCondition("lower(feed_type) like ?", `%${query.search.trim().toLowerCase()}%`);
  }

  return {
    clause: conditions.length > 0 ? `where ${conditions.join(" and ")}` : "",
    params
  };
}

export function buildFeedByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("feed.getById", id, {
    statement: `
      select
        ${FEED_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.feedEntries}
      where id = $1
      limit 1
    `.trim()
  });
}

export function buildFeedListQueryPlan(query: FeedListQueryContract): CompiledQueryPlan {
  const where = createFeedWhereClause(query);
  const limitParam = where.params.length + 1;
  const offsetParam = where.params.length + 2;
  const offset = (query.page - 1) * query.pageSize;

  return createCompiledQueryPlan({
    key: "feed.list",
    statement: `
      select
        ${FEED_SELECT_COLUMNS},
        count(*) over()::int as total_count
      from ${AQUAPULSE_SCHEMA_TABLES.feedEntries}
      ${where.clause}
      order by fed_at desc, id desc
      limit $${limitParam}
      offset $${offsetParam}
    `.trim(),
    params: [...where.params, query.pageSize, offset],
    filters: {
      readablePondIds: query.readablePondIds,
      pondId: query.pondId,
      batchId: query.batchId,
      feedType: query.feedType,
      search: query.search
    }
  });
}

export function buildCreateFeedQueryPlan(input: FeedCreateRequest): CompiledQueryPlan {
  const row = mapCreateFeedInputToRowWrite(input);

  return createCompiledQueryPlan({
    key: "feed.create",
    statement: `
      insert into ${AQUAPULSE_SCHEMA_TABLES.feedEntries} (
        id,
        pond_id,
        batch_id,
        feed_type,
        quantity_kg,
        fed_at,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning ${FEED_SELECT_COLUMNS}
    `.trim(),
    params: [
      row.id,
      row.pond_id,
      row.batch_id ?? null,
      row.feed_type,
      row.quantity_kg,
      row.fed_at,
      row.created_at,
      row.updated_at
    ],
    filters: {
      pondId: row.pond_id,
      batchId: row.batch_id,
      feedType: row.feed_type,
      fedAt: row.fed_at
    }
  });
}

export function buildUpdateFeedQueryPlan(
  id: string,
  input: FeedUpdateRequest
): CompiledQueryPlan {
  const patch = mapUpdateFeedInputToRowPatch(id, input);

  return createCompiledQueryPlan({
    key: "feed.update",
    statement: `
      update ${AQUAPULSE_SCHEMA_TABLES.feedEntries}
      set
        batch_id = coalesce($2, batch_id),
        feed_type = coalesce($3, feed_type),
        quantity_kg = coalesce($4, quantity_kg),
        fed_at = coalesce($5, fed_at),
        updated_at = $6
      where id = $1
      returning ${FEED_SELECT_COLUMNS}
    `.trim(),
    params: [
      id,
      patch.batch_id ?? null,
      patch.feed_type ?? null,
      patch.quantity_kg ?? null,
      patch.fed_at ?? null,
      patch.updated_at
    ],
    filters: {
      id
    }
  });
}

@Injectable()
export class PostgresFeedRepository implements FeedRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PostgresDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresFeedRepositoryDependencies = {}
  ): PostgresFeedRepository {
    const repository = new PostgresFeedRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: FeedCreateRequest): Promise<FeedEntry> {
    const row = mapCreateFeedInputToRowWrite(input);

    return this.gateway.executeMappedMutation(
      buildCreateFeedQueryPlan(input),
      feedRowMapper,
      createPlaceholderFeedRow({
        id: row.id,
        pond_id: input.pondId,
        batch_id: input.batchId,
        feed_type: input.feedType,
        quantity_kg: input.quantityKg,
        fed_at: input.fedAt,
        created_at: input.fedAt,
        updated_at: input.fedAt
      })
    );
  }

  async update(id: string, input: FeedUpdateRequest): Promise<FeedEntry> {
    return this.gateway.executeMappedMutation(
      buildUpdateFeedQueryPlan(id, input),
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
    const rows = await this.gateway.executeRows<FeedListRow>(buildFeedListQueryPlan(query));

    if (rows.length === 0) {
      return {
        items: [],
        page: {
          page: query.page,
          pageSize: query.pageSize,
          totalItems: 0,
          totalPages: 1
        }
      };
    }

    const totalItems = rows[0]?.total_count ?? rows.length;

    return {
      items: rows.map((row) => feedRowMapper.toDomain(row)),
      page: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize))
      }
    };
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
    "support readable pond, pond, batch, feed-type, and search filtering with stable fed_at desc ordering",
    "keep feed read and write execution on the shared Postgres row gateway"
  ],
  mappingNotes: [
    "map feed_entries rows into FeedEntry via the shared database row mapper",
    "keep create/update payload shaping aligned to the existing feed vertical slices"
  ]
} as const;
