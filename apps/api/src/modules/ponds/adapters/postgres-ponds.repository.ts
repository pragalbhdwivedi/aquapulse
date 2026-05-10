import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PostgresDatabaseConnectionFactory,
  PostgresRowGateway,
  createCompiledQueryPlan,
  createLookupQueryPlan,
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

interface PondListRow extends PondRow {
  readonly total_count: number;
}

const POND_SELECT_COLUMNS = `
  id,
  name,
  code,
  farm_id,
  kind,
  status,
  created_at,
  updated_at
`.trim();

function createPondsWhereClause(
  query: Omit<PondListQueryContract, "page" | "pageSize">
): { clause: string; params: readonly unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  function addCondition(sql: string, value: unknown) {
    params.push(value);
    conditions.push(sql.replace("?", `$${params.length}`));
  }

  if (query.farmId) {
    addCondition("farm_id = ?", query.farmId);
  }

  if (query.readablePondIds) {
    if (query.readablePondIds.length === 0) {
      conditions.push("1 = 0");
    } else {
      params.push(query.readablePondIds);
      conditions.push(`id = any($${params.length}::text[])`);
    }
  }

  if (query.status) {
    addCondition("status = ?", query.status);
  }

  if (query.kind) {
    addCondition("kind = ?", query.kind);
  }

  if (query.search?.trim()) {
    const normalizedSearch = `%${query.search.trim().toLowerCase()}%`;
    params.push(normalizedSearch);
    const nameParam = `$${params.length}`;
    params.push(normalizedSearch);
    const codeParam = `$${params.length}`;
    conditions.push(`(lower(name) like ${nameParam} or lower(code) like ${codeParam})`);
  }

  return {
    clause: conditions.length > 0 ? `where ${conditions.join(" and ")}` : "",
    params
  };
}

export function buildPondByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("ponds.getById", id, {
    statement: `
      select
        ${POND_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.ponds}
      where id = $1
      limit 1
    `.trim()
  });
}

export function buildPondsListQueryPlan(query: PondListQueryContract): CompiledQueryPlan {
  const where = createPondsWhereClause(query);
  const limitParam = where.params.length + 1;
  const offsetParam = where.params.length + 2;
  const offset = (query.page - 1) * query.pageSize;

  return createCompiledQueryPlan({
    key: "ponds.list",
    statement: `
      select
        ${POND_SELECT_COLUMNS},
        count(*) over()::int as total_count
      from ${AQUAPULSE_SCHEMA_TABLES.ponds}
      ${where.clause}
      order by name asc, id asc
      limit $${limitParam}
      offset $${offsetParam}
    `.trim(),
    params: [...where.params, query.pageSize, offset],
    filters: {
      readablePondIds: query.readablePondIds,
      farmId: query.farmId,
      status: query.status,
      kind: query.kind,
      search: query.search
    }
  });
}

export function buildCreatePondQueryPlan(row: PondRowWrite): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "ponds.create",
    statement: `
      insert into ${AQUAPULSE_SCHEMA_TABLES.ponds} (
        id,
        name,
        code,
        farm_id,
        kind,
        status,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning ${POND_SELECT_COLUMNS}
    `.trim(),
    params: [
      row.id,
      row.name,
      row.code,
      row.farm_id,
      row.kind,
      row.status,
      row.created_at,
      row.updated_at
    ],
    filters: {
      farmId: row.farm_id,
      kind: row.kind,
      status: row.status
    }
  });
}

export function buildUpdatePondQueryPlan(id: string, patch: PondRowPatch): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "ponds.update",
    statement: `
      update ${AQUAPULSE_SCHEMA_TABLES.ponds}
      set
        name = coalesce($2, name),
        code = coalesce($3, code),
        farm_id = coalesce($4, farm_id),
        kind = coalesce($5, kind),
        status = coalesce($6, status),
        updated_at = $7
      where id = $1
      returning ${POND_SELECT_COLUMNS}
    `.trim(),
    params: [
      id,
      patch.name ?? null,
      patch.code ?? null,
      patch.farm_id ?? null,
      patch.kind ?? null,
      patch.status ?? null,
      patch.updated_at
    ],
    filters: { id }
  });
}

@Injectable()
export class PostgresPondsRepository implements PondsRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PostgresDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresPondsRepositoryDependencies = {}
  ): PostgresPondsRepository {
    const repository = new PostgresPondsRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: CreatePondsDto): Promise<PondSummary> {
    const row = mapCreatePondInputToRowWrite(input);

    return this.gateway.executeMappedMutation(
      buildCreatePondQueryPlan(row),
      pondRowMapper,
      createPlaceholderPondRow({ id: row.id })
    );
  }

  async update(id: string, input: UpdatePondsDto): Promise<PondSummary> {
    const patch = mapUpdatePondInputToRowPatch(id, input);

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
    const rows = await this.gateway.executeRows<PondListRow>(buildPondsListQueryPlan(query));

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
      items: rows.map((row) => pondRowMapper.toDomain(row)),
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

export const POSTGRES_PONDS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update"],
  rowSource: "ponds",
  queryNotes: [
    "translate pond lookup inputs into compiled SQL plans against the ponds table",
    "support farm/status/kind filters plus bounded name/code search",
    "keep list ordering deterministic with name asc and id asc tiebreakers",
    "preserve in-memory as the default runtime while ponds Postgres remains opt-in"
  ],
  mappingNotes: [
    "map snake_case pond rows into PondSummary via the shared row mapper",
    "shape create/update DTO inputs into pond row write payloads",
    "keep placeholder fallback rows for no-op database clients"
  ]
} as const;
