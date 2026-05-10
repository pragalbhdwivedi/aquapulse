import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PostgresDatabaseConnectionFactory,
  PostgresRowGateway,
  createCompiledQueryPlan,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory,
  type PondResponsibilityRow
} from "@aquapulse/database";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { PondResponsibilityRepositoryPort } from "../ports/pond-responsibility-repository.port";
import type { PondResponsibilityRecord } from "../pond-responsibility.models";

export interface PostgresPondResponsibilityRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

const POND_RESPONSIBILITY_SELECT_COLUMNS = `
  id,
  user_id,
  pond_id,
  responsibility_type,
  active,
  starts_at,
  ends_at,
  created_at,
  updated_at
`.trim();

function toPondResponsibilityRecord(row: PondResponsibilityRow): PondResponsibilityRecord {
  return {
    id: row.id,
    userId: row.user_id,
    pondId: row.pond_id,
    responsibilityType: row.responsibility_type,
    active: row.active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function buildListActivePondResponsibilitiesByUserQueryPlan(
  userId: string,
  at: string
): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "pondResponsibilities.listActiveByUserId",
    statement: `
      select
        ${POND_RESPONSIBILITY_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.pondResponsibilities}
      where user_id = $1
        and active = true
        and (starts_at is null or starts_at <= $2)
        and (ends_at is null or ends_at >= $2)
      order by pond_id asc, created_at asc, id asc
    `.trim(),
    params: [userId, at],
    filters: {
      userId,
      active: true,
      effectiveAt: at
    }
  });
}

export function buildActivePondResponsibilityByUserAndPondQueryPlan(
  userId: string,
  pondId: string,
  at: string
): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "pondResponsibilities.hasActiveResponsibility",
    statement: `
      select
        ${POND_RESPONSIBILITY_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.pondResponsibilities}
      where user_id = $1
        and pond_id = $2
        and active = true
        and (starts_at is null or starts_at <= $3)
        and (ends_at is null or ends_at >= $3)
      order by created_at asc, id asc
      limit 1
    `.trim(),
    params: [userId, pondId, at],
    filters: {
      userId,
      pondId,
      active: true,
      effectiveAt: at
    }
  });
}

@Injectable()
export class PostgresPondResponsibilityRepository implements PondResponsibilityRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PostgresDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresPondResponsibilityRepositoryDependencies = {}
  ): PostgresPondResponsibilityRepository {
    const repository = new PostgresPondResponsibilityRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async listActiveByUserId(userId: string, at: string): Promise<readonly PondResponsibilityRecord[]> {
    const rows = await this.gateway.executeRows<PondResponsibilityRow>(
      buildListActivePondResponsibilitiesByUserQueryPlan(userId, at)
    );
    return rows.map(toPondResponsibilityRecord);
  }

  async hasActiveResponsibility(userId: string, pondId: string, at: string): Promise<boolean> {
    const rows = await this.gateway.executeRows<PondResponsibilityRow>(
      buildActivePondResponsibilityByUserAndPondQueryPlan(userId, pondId, at)
    );

    return rows.length > 0;
  }

  private get gateway(): PostgresRowGateway {
    return new PostgresRowGateway({
      connectionFactory: this.connectionFactory,
      databaseConfig: this.databaseConfig
    });
  }
}

export const POSTGRES_POND_RESPONSIBILITY_IMPLEMENTATION_PLAN = {
  readMethods: ["listActiveByUserId", "hasActiveResponsibility"],
  writeMethods: [],
  rowSource: "pond_responsibilities",
  queryNotes: [
    "resolve active pond responsibility rows by user and effective timestamp",
    "support direct user plus pond existence checks for future canReadPond authorization seams",
    "preserve in-memory as the default runtime while Postgres remains opt-in"
  ],
  mappingNotes: [
    "map snake_case pond responsibility rows into internal authorization records",
    "keep read-only repository semantics because enforcement is not wired into product routes yet"
  ]
} as const;
