import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  batchRowMapper,
  createListQueryPlan,
  createLookupQueryPlan,
  createMutationQueryPlan,
  createPlaceholderBatchRow,
  mapCreateBatchInputToRowWrite,
  mapUpdateBatchInputToRowPatch,
  type BatchRow,
  type BatchRowPatch,
  type BatchRowWrite,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory
} from "@aquapulse/database";
import type { BatchSummary, ListResponse } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateBatchesDto, QueryBatchesDto, UpdateBatchesDto } from "../dto";
import type { BatchesRepositoryPort } from "../ports/batches-repository.port";

export interface PostgresBatchesRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

export function buildBatchByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("batches.getById", id);
}

export function buildBatchesListQueryPlan(query: QueryBatchesDto): CompiledQueryPlan {
  return createListQueryPlan({
    key: "batches.list",
    query,
    params: [query.page, query.pageSize, query.search ?? null],
    filters: { search: query.search }
  });
}

export function buildCreateBatchQueryPlan(row: BatchRowWrite): CompiledQueryPlan {
  return createMutationQueryPlan("batches.create", row);
}

export function buildUpdateBatchQueryPlan(id: string, patch: BatchRowPatch): CompiledQueryPlan {
  return createMutationQueryPlan("batches.update", patch, {
    params: [id, patch],
    filters: { id }
  });
}

@Injectable()
export class PostgresBatchesRepository implements BatchesRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PlaceholderDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresBatchesRepositoryDependencies = {}
  ): PostgresBatchesRepository {
    const repository = new PostgresBatchesRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: CreateBatchesDto): Promise<BatchSummary> {
    const row = mapCreateBatchInputToRowWrite(input);
    return this.gateway.executeMappedMutation(
      buildCreateBatchQueryPlan(row),
      batchRowMapper,
      createPlaceholderBatchRow({ id: row.id })
    );
  }

  async update(id: string, input: UpdateBatchesDto): Promise<BatchSummary> {
    const patch = mapUpdateBatchInputToRowPatch(id, input);
    return this.gateway.executeMappedMutation(
      buildUpdateBatchQueryPlan(id, patch),
      batchRowMapper,
      createPlaceholderBatchRow({ id })
    );
  }

  async getById(id: string): Promise<BatchSummary> {
    return this.gateway.executeMappedItem(
      buildBatchByIdQueryPlan(id),
      batchRowMapper,
      createPlaceholderBatchRow({ id })
    );
  }

  async list(query: QueryBatchesDto): Promise<ListResponse<BatchSummary>> {
    return this.gateway.executeMappedList(buildBatchesListQueryPlan(query), batchRowMapper, {
      page: query.page,
      pageSize: query.pageSize,
      fallbackRows: [createPlaceholderBatchRow()]
    });
  }

  private get gateway(): PostgresRowGateway {
    return new PostgresRowGateway({
      connectionFactory: this.connectionFactory,
      databaseConfig: this.databaseConfig
    });
  }
}

export const POSTGRES_BATCHES_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update"],
  rowSource: "batches",
  queryNotes: [
    "shape search-driven batch list retrieval through compiled list plans",
    "keep read and mutation execution on the shared Postgres row gateway"
  ],
  mappingNotes: [
    "map batch lifecycle fields into BatchSummary via shared row mappers",
    "shape create/update DTO inputs into batch row payloads"
  ]
} as const;
