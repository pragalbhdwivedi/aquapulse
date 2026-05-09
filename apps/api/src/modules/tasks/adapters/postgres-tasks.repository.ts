import { Injectable } from "@nestjs/common";
import {
  AQUAPULSE_SCHEMA_TABLES,
  PostgresDatabaseConnectionFactory,
  PostgresRowGateway,
  createCompiledQueryPlan,
  createLookupQueryPlan,
  createPlaceholderTaskRow,
  mapCreateTaskInputToRowWrite,
  mapUpdateTaskInputToRowPatch,
  taskRowMapper,
  type CompiledQueryPlan,
  type DatabaseConfig,
  type DatabaseConnectionFactory,
  type TaskRow,
  type TaskRowPatch,
  type TaskRowWrite
} from "@aquapulse/database";
import type { ListResponse, TaskCreateRequest, TaskSummary, TaskUpdateRequest } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { TasksRepositoryPort } from "../ports/tasks-repository.port";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

export interface PostgresTasksRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

interface TaskListRow extends TaskRow {
  readonly total_count: number;
}

const TASK_SELECT_COLUMNS = `
  id,
  title,
  status,
  assignee_id,
  pond_id,
  created_at,
  updated_at
`.trim();

export function buildTaskByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("tasks.getById", id, {
    statement: `
      select
        ${TASK_SELECT_COLUMNS}
      from ${AQUAPULSE_SCHEMA_TABLES.tasks}
      where id = $1
      limit 1
    `.trim()
  });
}

export function buildTasksListQueryPlan(query: TasksListQueryContract): CompiledQueryPlan {
  const conditions: string[] = [];
  const params: unknown[] = [];

  function addCondition(sql: string, value: unknown) {
    params.push(value);
    conditions.push(sql.replace("?", `$${params.length}`));
  }

  if (query.assigneeId) {
    addCondition("assignee_id = ?", query.assigneeId);
  }

  if (query.taskId) {
    addCondition("id = ?", query.taskId);
  }

  if (query.pondId) {
    addCondition("pond_id = ?", query.pondId);
  }

  if (query.status) {
    addCondition("status = ?", query.status);
  }

  if (query.search?.trim()) {
    addCondition("lower(title) like ?", `%${query.search.trim().toLowerCase()}%`);
  }

  const whereClause = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";
  const limitParam = params.length + 1;
  const offsetParam = params.length + 2;

  return createCompiledQueryPlan({
    key: "tasks.list",
    statement: `
      select
        ${TASK_SELECT_COLUMNS},
        count(*) over()::int as total_count
      from ${AQUAPULSE_SCHEMA_TABLES.tasks}
      ${whereClause}
      order by updated_at desc, id desc
      limit $${limitParam}
      offset $${offsetParam}
    `.trim(),
    params: [...params, query.pageSize, (query.page - 1) * query.pageSize],
    filters: {
      taskId: query.taskId,
      assigneeId: query.assigneeId,
      pondId: query.pondId,
      status: query.status,
      search: query.search
    }
  });
}

export function buildCreateTaskQueryPlan(row: TaskRowWrite): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "tasks.create",
    statement: `
      insert into ${AQUAPULSE_SCHEMA_TABLES.tasks} (
        id,
        title,
        status,
        assignee_id,
        pond_id,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning ${TASK_SELECT_COLUMNS}
    `.trim(),
    params: [
      row.id,
      row.title,
      row.status,
      row.assignee_id ?? null,
      row.pond_id ?? null,
      row.created_at,
      row.updated_at
    ],
    filters: {
      title: row.title,
      status: row.status,
      assigneeId: row.assignee_id,
      pondId: row.pond_id
    }
  });
}

export function buildUpdateTaskQueryPlan(id: string, patch: TaskRowPatch): CompiledQueryPlan {
  return createCompiledQueryPlan({
    key: "tasks.update",
    statement: `
      update ${AQUAPULSE_SCHEMA_TABLES.tasks}
      set
        title = coalesce($2, title),
        status = coalesce($3, status),
        assignee_id = coalesce($4, assignee_id),
        pond_id = coalesce($5, pond_id),
        updated_at = $6
      where id = $1
      returning ${TASK_SELECT_COLUMNS}
    `.trim(),
    params: [
      id,
      patch.title ?? null,
      patch.status ?? null,
      patch.assignee_id ?? null,
      patch.pond_id ?? null,
      patch.updated_at
    ],
    filters: { id }
  });
}

@Injectable()
export class PostgresTasksRepository implements TasksRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PostgresDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresTasksRepositoryDependencies = {}
  ): PostgresTasksRepository {
    const repository = new PostgresTasksRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: TaskCreateRequest): Promise<TaskSummary> {
    const row = mapCreateTaskInputToRowWrite(input);
    return this.gateway.executeMappedMutation(
      buildCreateTaskQueryPlan(row),
      taskRowMapper,
      createPlaceholderTaskRow(row)
    );
  }

  async update(id: string, input: TaskUpdateRequest): Promise<TaskSummary> {
    const patch = mapUpdateTaskInputToRowPatch(id, input);
    return this.gateway.executeMappedMutation(
      buildUpdateTaskQueryPlan(id, patch),
      taskRowMapper,
      createPlaceholderTaskRow({ id })
    );
  }

  async getById(id: string): Promise<TaskSummary> {
    return this.gateway.executeMappedItem(
      buildTaskByIdQueryPlan(id),
      taskRowMapper,
      createPlaceholderTaskRow({ id })
    );
  }

  async list(query: TasksListQueryContract): Promise<ListResponse<TaskSummary>> {
    const rows = await this.gateway.executeRows<TaskListRow>(buildTasksListQueryPlan(query));

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
      items: rows.map((row) => taskRowMapper.toDomain(row)),
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

export const POSTGRES_TASKS_IMPLEMENTATION_PLAN = {
  readMethods: ["getById", "list"],
  writeMethods: ["create", "update"],
  rowSource: "tasks",
  queryNotes: [
    "filter by assignee, pond, status, and title search with stable updated_at desc ordering",
    "keep read and write execution on the shared Postgres row gateway"
  ],
  mappingNotes: [
    "map task assignment columns into TaskSummary via shared row mappers",
    "shape create/update DTO inputs into task row payloads"
  ]
} as const;
