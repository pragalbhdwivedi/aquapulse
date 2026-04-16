export interface PersistenceReadiness {
  readonly ready: boolean;
  readonly adapter: "in-memory" | "postgres";
  readonly details?: string;
}
