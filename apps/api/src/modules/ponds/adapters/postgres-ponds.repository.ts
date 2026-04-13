import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  createPlaceholderPondRow,
  pondRowMapper,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory,
  type PondRow
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
  return {
    key: "ponds.getById",
    statement: "ponds.getById",
    params: [id],
    filters: { id }
  };
}

export function buildPondsListQueryPlan(query: PondListQueryContract): CompiledQueryPlan {
  return {
    key: "ponds.list",
    statement: "ponds.list",
    params: [
      query.page,
      query.pageSize,
      query.farmId ?? null,
      query.status ?? null,
      query.kind ?? null,
      query.search ?? null
    ],
    pagination: { page: query.page, pageSize: query.pageSize },
    filters: {
      farmId: query.farmId,
      status: query.status,
      kind: query.kind,
      search: query.search
    },
    sort: query.sort
  };
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
    // TODO: Persist to ponds storage once write adapters are enabled.
    return pondRowMapper.toDomain(createPlaceholderPondRow());
  }

  async update(id: string, _input: UpdatePondsDto): Promise<PondSummary> {
    // TODO: Update ponds storage by id once write adapters are enabled.
    return pondRowMapper.toDomain(createPlaceholderPondRow({ id }));
  }

  async getById(id: string): Promise<PondSummary> {
    const rows = await this.queryRows<PondRow>(buildPondByIdQueryPlan(id));
    return pondRowMapper.toDomain(rows[0] ?? createPlaceholderPondRow({ id }));
  }

  async list(query: PondListQueryContract): Promise<ListResponse<PondSummary>> {
    const rows = await this.queryRows<PondRow>(buildPondsListQueryPlan(query));
    const items =
      rows.length > 0
        ? rows.map((row) => pondRowMapper.toDomain(row))
        : [pondRowMapper.toDomain(createPlaceholderPondRow())];

    return {
      items,
      page: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / query.pageSize))
      }
    };
  }

  private async queryRows<TRow>(plan: CompiledQueryPlan): Promise<TRow[]> {
    const client = await this.connectionFactory.create(this.databaseConfig);

    try {
      const result = await client.query<TRow>(plan.statement, plan.params);
      return result.rows;
    } finally {
      await client.dispose();
    }
  }
}

export const POSTGRES_PONDS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update"],
  rowSource: "ponds",
  queryNotes: [
    "translate pond lookup inputs into a compiled query plan",
    "apply farm/status/kind/search filters through the shared query contract",
    "preserve in-memory as the default runtime while read slices mature"
  ],
  mappingNotes: [
    "map snake_case pond rows into PondSummary via the shared row mapper",
    "keep placeholder fallback rows for no-op database clients"
  ]
} as const;
