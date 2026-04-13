import type { DatabaseConfig } from "../config/database-config.js";
import type { DatabaseConnectionFactory } from "../connection/database-connection.js";
import type { RowMapper } from "../mapping/row-mapper.js";
import type { CompiledQueryPlan } from "../query/query-contracts.js";
import type { ListResponse } from "@aquapulse/types";

export interface PostgresRowGatewayDependencies {
  readonly connectionFactory: DatabaseConnectionFactory;
  readonly databaseConfig: DatabaseConfig;
}

export interface PostgresListExecutionOptions<TRow> {
  readonly page: number;
  readonly pageSize: number;
  readonly fallbackRows: readonly TRow[];
}

export class PostgresRowGateway {
  constructor(private readonly dependencies: PostgresRowGatewayDependencies) {}

  async executeRows<TRow>(plan: CompiledQueryPlan): Promise<TRow[]> {
    const client = await this.dependencies.connectionFactory.create(this.dependencies.databaseConfig);

    try {
      const result = await client.query<TRow>(plan.statement, plan.params);
      return result.rows;
    } finally {
      await client.dispose();
    }
  }

  async executeMappedItem<TRow, TDomain>(
    plan: CompiledQueryPlan,
    mapper: RowMapper<TRow, TDomain>,
    fallbackRow: TRow
  ): Promise<TDomain> {
    const rows = await this.executeRows<TRow>(plan);
    return mapper.toDomain(normalizeSingleRow(rows, fallbackRow));
  }

  async executeMappedMutation<TRow, TDomain>(
    plan: CompiledQueryPlan,
    mapper: RowMapper<TRow, TDomain>,
    fallbackRow: TRow
  ): Promise<TDomain> {
    return this.executeMappedItem(plan, mapper, fallbackRow);
  }

  async executeMappedList<TRow, TDomain>(
    plan: CompiledQueryPlan,
    mapper: RowMapper<TRow, TDomain>,
    options: PostgresListExecutionOptions<TRow>
  ): Promise<ListResponse<TDomain>> {
    const rows = await this.executeRows<TRow>(plan);
    const normalizedRows = normalizeRowList(rows, options.fallbackRows);

    return {
      items: normalizedRows.map((row) => mapper.toDomain(row)),
      page: {
        page: options.page,
        pageSize: options.pageSize,
        totalItems: normalizedRows.length,
        totalPages: Math.max(1, Math.ceil(normalizedRows.length / options.pageSize))
      }
    };
  }
}

export function normalizeSingleRow<TRow>(rows: readonly TRow[], fallbackRow: TRow): TRow {
  return rows[0] ?? fallbackRow;
}

export function normalizeRowList<TRow>(rows: readonly TRow[], fallbackRows: readonly TRow[]): TRow[] {
  return rows.length > 0 ? [...rows] : [...fallbackRows];
}
