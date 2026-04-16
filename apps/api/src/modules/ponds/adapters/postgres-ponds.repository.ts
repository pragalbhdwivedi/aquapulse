import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  createLookupQueryPlan,
  createMutationQueryPlan,
  createListQueryPlan,
  createPlaceholderPondRow,
  mapCreatePondInputToRowWrite,
  mapUpdatePondInputToRowPatch,
  pondRowMapper,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory,
  type PondRow,
  type PondRowPatch,
  type PondRowWrite
} from "@aquapulse/database";
import type { ListResponse, PondSummary } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreatePondsDto, UpdatePondsDto } from "../dto";
import type { PondsRepositoryPort } from "../ports/ponds-repository.port";
import type { PondListQueryContract } from "../query-contracts/ponds-query.contract";

export interface PostgresPondsRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

export function buildPondByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("ponds.getById", id);
}

export function buildPondsListQueryPlan(query: PondListQueryContract): CompiledQueryPlan {
  return createListQueryPlan({
    key: "ponds.list",
    query,
    params: [
      query.page,
      query.pageSize,
      query.farmId ?? null,
      query.status ?? null,
      query.kind ?? null,
      query.search ?? null
    ],
    filters: {
      farmId: query.farmId,
      status: query.status,
      kind: query.kind,
      search: query.search
    }
  });
}

export function buildCreatePondQueryPlan(row: PondRowWrite): CompiledQueryPlan {
  return createMutationQueryPlan("ponds.create", row);
}

export function buildUpdatePondQueryPlan(id: string, patch: PondRowPatch): CompiledQueryPlan {
  return createMutationQueryPlan("ponds.update", patch, {
    params: [id, patch],
    filters: { id }
  });
}

@Injectable()
export class PostgresPondsRepository implements PondsRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PlaceholderDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresPondsRepositoryDependencies = {}
  ): PostgresPondsRepository {
    const repository = new PostgresPondsRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(_input: CreatePondsDto): Promise<PondSummary> {
    const row = mapCreatePondInputToRowWrite(_input);
    return this.gateway.executeMappedMutation(
      buildCreatePondQueryPlan(row),
      pondRowMapper,
      createPlaceholderPondRow({ id: row.id })
    );
  }

  async update(id: string, _input: UpdatePondsDto): Promise<PondSummary> {
    const patch = mapUpdatePondInputToRowPatch(id, _input);
    return this.gateway.executeMappedMutation(
      buildUpdatePondQueryPlan(id, patch),
      pondRowMapper,
      createPlaceholderPondRow({ id })
    );
  }

  async getById(id: string): Promise<PondSummary> {
    return this.gateway.executeMappedItem(
      buildPondByIdQueryPlan(id),
      pondRowMapper,
      createPlaceholderPondRow({ id })
    );
  }

  async list(query: PondListQueryContract): Promise<ListResponse<PondSummary>> {
    return this.gateway.executeMappedList(buildPondsListQueryPlan(query), pondRowMapper, {
      page: query.page,
      pageSize: query.pageSize,
      fallbackRows: [createPlaceholderPondRow()]
    });
  }

  private get gateway(): PostgresRowGateway {
    return new PostgresRowGateway({
      connectionFactory: this.connectionFactory,
      databaseConfig: this.databaseConfig
    });
  }
}

export const POSTGRES_PONDS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update"],
  rowSource: "ponds",
  queryNotes: [
    "translate pond lookup inputs into a compiled query plan",
    "shape create and update payloads into mutation plans without requiring live SQL",
    "apply farm/status/kind/search filters through the shared query contract",
    "preserve in-memory as the default runtime while read slices mature"
  ],
  mappingNotes: [
    "map snake_case pond rows into PondSummary via the shared row mapper",
    "shape create/update DTO inputs into pond row write payloads",
    "keep placeholder fallback rows for no-op database clients"
  ]
} as const;
