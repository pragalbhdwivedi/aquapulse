declare module "pg" {
  export interface QueryResult<TRow = Record<string, unknown>> {
    rows: TRow[];
    rowCount: number | null;
  }

  export interface PoolConfig {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    min?: number;
    max?: number;
    application_name?: string;
    ssl?: {
      rejectUnauthorized?: boolean;
    };
  }

  export interface PoolClient {
    query<TRow = Record<string, unknown>>(
      statement: string,
      params?: readonly unknown[]
    ): Promise<QueryResult<TRow>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<TRow = Record<string, unknown>>(
      statement: string,
      params?: readonly unknown[]
    ): Promise<QueryResult<TRow>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }
}
