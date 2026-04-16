export interface DatabaseQueryResult<TRow = Record<string, unknown>> {
  readonly rows: TRow[];
  readonly rowCount: number;
}

export interface DatabaseTransaction {
  query<TRow = Record<string, unknown>>(
    statement: string,
    params?: readonly unknown[]
  ): Promise<DatabaseQueryResult<TRow>>;
}

export interface DatabaseClient {
  query<TRow = Record<string, unknown>>(
    statement: string,
    params?: readonly unknown[]
  ): Promise<DatabaseQueryResult<TRow>>;
  transaction<TResult>(
    callback: (transaction: DatabaseTransaction) => Promise<TResult>
  ): Promise<TResult>;
  dispose(): Promise<void>;
}
