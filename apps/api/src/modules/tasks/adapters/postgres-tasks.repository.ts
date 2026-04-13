import { Injectable } from "@nestjs/common";
import {
  PlaceholderDatabaseConnectionFactory,
  PostgresRowGateway,
  createListQueryPlan,
  createLookupQueryPlan,
  createMutationQueryPlan,
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
import type { ListResponse, TaskSummary } from "@aquapulse/types";
import { readApiDatabaseRuntimeConfig } from "../../../common/config/database-runtime.config";
import type { CreateTasksDto, UpdateTasksDto } from "../dto";
import type { TasksRepositoryPort } from "../ports/tasks-repository.port";
import type { TasksListQueryContract } from "../query-contracts/tasks-query.contract";

export interface PostgresTasksRepositoryDependencies {
  readonly connectionFactory?: DatabaseConnectionFactory;
  readonly databaseConfig?: DatabaseConfig;
}

export function buildTaskByIdQueryPlan(id: string): CompiledQueryPlan {
  return createLookupQueryPlan("tasks.getById", id);
}

export function buildTasksListQueryPlan(query: TasksListQueryContract): CompiledQueryPlan {
  return createListQueryPlan({
    key: "tasks.list",
    query,
    params: [
      query.page,
      query.pageSize,
      query.assigneeId ?? null,
      query.pondId ?? null,
      query.status ?? null,
      query.search ?? null
    ],
    filters: {
      assigneeId: query.assigneeId,
      pondId: query.pondId,
      status: query.status,
      search: query.search
    }
  });
}

export function buildCreateTaskQueryPlan(row: TaskRowWrite): CompiledQueryPlan {
  return createMutationQueryPlan("tasks.create", row);
}

export function buildUpdateTaskQueryPlan(id: string, patch: TaskRowPatch): CompiledQueryPlan {
  return createMutationQueryPlan("tasks.update", patch, {
    params: [id, patch],
    filters: { id }
  });
}

@Injectable()
export class PostgresTasksRepository implements TasksRepositoryPort {
  private connectionFactory: DatabaseConnectionFactory = new PlaceholderDatabaseConnectionFactory();
  private databaseConfig: DatabaseConfig = readApiDatabaseRuntimeConfig().database;

  static forTesting(
    overrides: PostgresTasksRepositoryDependencies = {}
  ): PostgresTasksRepository {
    const repository = new PostgresTasksRepository();
    repository.connectionFactory = overrides.connectionFactory ?? repository.connectionFactory;
    repository.databaseConfig = overrides.databaseConfig ?? repository.databaseConfig;
    return repository;
  }

  async create(input: CreateTasksDto): Promise<TaskSummary> {
    const row = mapCreateTaskInputToRowWrite(input);
    return this.gateway.executeMappedMutation(
      buildCreateTaskQueryPlan(row),
      taskRowMapper,
      createPlaceholderTaskRow({ id: row.id })
    );
  }

  async update(id: string, input: UpdateTasksDto): Promise<TaskSummary> {
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
    return this.gateway.executeMappedList(buildTasksListQueryPlan(query), taskRowMapper, {
      page: query.page,
      pageSize: query.pageSize,
      fallbackRows: [createPlaceholderTaskRow()]
    });
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
    "filter by assignee/pond/status via the shared list query plan builder",
    "keep read and write execution on the shared Postgres row gateway"
  ],
  mappingNotes: [
    "map task assignment columns into TaskSummary via shared row mappers",
    "shape create/update DTO inputs into task row payloads"
  ]
} as const;
