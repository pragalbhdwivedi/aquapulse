import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PostgresDatabaseConnectionFactory,
  PostgresRowGateway,
  createCompiledQueryPlan,
  createLookupQueryPlan,
  createPlaceholderWaterQualityRow,
  mapCreateWaterQualityInputToRowWrite,
  mapUpdateWaterQualityInputToRowPatch,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory,
  type WaterQualityRow,
  waterQualityRowMapper
} from "@aquapulse/database";
import type { ListResponse, WaterQualityCreateRequest, WaterQualityReading } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { UpdateWaterQualityDto } from "../dto";
import type { WaterQualityRepositoryPort } from "../ports/water-quality-repository.port";
import type { WaterQualityListQueryContract } from "../query-contracts/water-quality-query.contract";

export interface PostgresWaterQualityRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

interface WaterQualityListRow extends WaterQualityRow {
  readonly total_count: number;
}

const WATER_QUALITY_SELECT_COLUMNS = `
  id,
  pond_id,
  recorded_at,
  temperature_c,
  ph,
  created_at,
  updated_at
`.trim();

function createWaterQualityWhereClause(
  query: Omit<WaterQualityListQueryContract, "page" | "pageSize">
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

  if (query.metric === "temperatureC") {
    conditions.push("temperature_c is not null");
  }

  if (query.metric === "ph") {
    conditions.push("ph is not null");
  }

  return {
    clause: conditions.length > 0 ? `where ${conditions.join(" and ")}` : "",
    params
  };
}

export function buildWaterQualityByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("waterQuality.getById", id, {
    statement: `
      select
        ${WATER_QUALITY_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.waterQuality}
      where id = $1
      limit 1
    `.trim()
  });
}

export function buildWaterQualityListQueryPlan(
  query: WaterQualityListQueryContract
): CompiledQueryPlan {
  const where = createWaterQualityWhereClause(query);
  const limitParam = where.params.length + 1;
  const offsetParam = where.params.length + 2;
  const offset = (query.page - 1) * query.pageSize;

  return createCompiledQueryPlan({
    key: "waterQuality.list",
    statement: `
      select
        ${WATER_QUALITY_SELECT_COLUMNS},
        count(*) over()::int as total_count
      from ${AQUAPULSE_SCHEMA_TABLES.waterQuality}
      ${where.clause}
      order by recorded_at desc, id desc
      limit $${limitParam}
      offset $${offsetParam}
    `.trim(),
    params: [...where.params, query.pageSize, offset],
    filters: {
      pondId: query.pondId,
      metric: query.metric
    }
  });
}

export function buildWaterQualityListByPondQueryPlan(pondId: string): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "waterQuality.listByPond",
    statement: `
      select
        ${WATER_QUALITY_SELECT_COLUMNS},
        count(*) over()::int as total_count
      from ${AQUAPULSE_SCHEMA_TABLES.waterQuality}
      where pond_id = $1
      order by recorded_at desc, id desc
      limit $2
      offset $3
    `.trim(),
    params: [pondId, 20, 0],
    filters: { pondId }
  });
}

export function buildCreateWaterQualityQueryPlan(
  input: WaterQualityCreateRequest
): CompiledQueryPlan {
  const row = mapCreateWaterQualityInputToRowWrite(input);

  return createCompiledQueryPlan({
    key: "waterQuality.create",
    statement: `
      insert into ${AQUAPULSE_SCHEMA_TABLES.waterQuality} (
        id,
        pond_id,
        recorded_at,
        temperature_c,
        ph,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning ${WATER_QUALITY_SELECT_COLUMNS}
    `.trim(),
    params: [
      row.id,
      row.pond_id,
      row.recorded_at,
      row.temperature_c ?? null,
      row.ph ?? null,
      row.created_at,
      row.updated_at
    ],
    filters: {
      pondId: row.pond_id,
      recordedAt: row.recorded_at
    }
  });
}

export function buildUpdateWaterQualityQueryPlan(
  id: string,
  input: UpdateWaterQualityDto
): CompiledQueryPlan {
  const patch = mapUpdateWaterQualityInputToRowPatch(id, input as {
    readonly pondId?: string;
    readonly recordedAt?: string;
    readonly temperatureC?: number;
    readonly ph?: number;
  });

  return createCompiledQueryPlan({
    key: "waterQuality.update",
    statement: `
      update ${AQUAPULSE_SCHEMA_TABLES.waterQuality}
      set
        pond_id = coalesce($2, pond_id),
        recorded_at = coalesce($3, recorded_at),
        temperature_c = coalesce($4, temperature_c),
        ph = coalesce($5, ph),
        updated_at = $6
      where id = $1
      returning ${WATER_QUALITY_SELECT_COLUMNS}
    `.trim(),
    params: [
      id,
      patch.pond_id ?? null,
      patch.recorded_at ?? null,
      patch.temperature_c ?? null,
      patch.ph ?? null,
      patch.updated_at
    ],
    filters: {
      id
    }
  });
}

@Injectable()
export class PostgresWaterQualityRepository implements WaterQualityRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PostgresDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresWaterQualityRepositoryDependencies = {}
  ): PostgresWaterQualityRepository {
    const repository = new PostgresWaterQualityRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: WaterQualityCreateRequest): Promise<WaterQualityReading> {
    return this.gateway.executeMappedMutation(
      buildCreateWaterQualityQueryPlan(input),
      waterQualityRowMapper,
      createPlaceholderWaterQualityRow({
        pond_id: input.pondId,
        recorded_at: input.recordedAt,
        temperature_c: input.temperatureC,
        ph: input.ph,
        created_at: input.recordedAt,
        updated_at: input.recordedAt
      })
    );
  }

  async update(id: string, input: UpdateWaterQualityDto): Promise<WaterQualityReading> {
    return this.gateway.executeMappedMutation(
      buildUpdateWaterQualityQueryPlan(id, input),
      waterQualityRowMapper,
      createPlaceholderWaterQualityRow({ id })
    );
  }

  async getById(id: string): Promise<WaterQualityReading> {
    return this.gateway.executeMappedItem(
      buildWaterQualityByIdQueryPlan(id),
      waterQualityRowMapper,
      createPlaceholderWaterQualityRow({ id })
    );
  }

  async list(query: WaterQualityListQueryContract): Promise<ListResponse<WaterQualityReading>> {
    const rows = await this.gateway.executeRows<WaterQualityListRow>(
      buildWaterQualityListQueryPlan(query)
    );

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
      items: rows.map((row) => waterQualityRowMapper.toDomain(row)),
      page: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize))
      }
    };
  }

  async listByPond(pondId: string): Promise<ListResponse<WaterQualityReading>> {
    const rows = await this.gateway.executeRows<WaterQualityListRow>(
      buildWaterQualityListByPondQueryPlan(pondId)
    );

    if (rows.length === 0) {
      return {
        items: [],
        page: {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 1
        }
      };
    }

    const totalItems = rows[0]?.total_count ?? rows.length;

    return {
      items: rows.map((row) => waterQualityRowMapper.toDomain(row)),
      page: {
        page: 1,
        pageSize: 20,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / 20))
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

export const POSTGRES_WATER_QUALITY_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list", "listByPond"],
  writeMethods: ["create", "update"],
  rowSource: "water_quality",
  queryNotes: [
    "support pond filtering and simple metric presence filtering",
    "shape list ordering around recorded_at desc with stable id tiebreakers"
  ],
  mappingNotes: [
    "map water_quality rows into WaterQualityReading via the shared database package row mapper",
    "keep create/update payload shaping aligned to the existing water-quality create vertical slice"
  ]
} as const;
