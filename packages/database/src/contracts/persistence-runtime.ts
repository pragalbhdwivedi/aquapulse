export type PersistenceAdapterKind = "in-memory" | "postgres";

export interface PersistenceRuntimeConfig {
  readonly defaultAdapter: PersistenceAdapterKind;
  readonly allowRuntimeSwitch?: boolean;
}
