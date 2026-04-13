export type PersistenceAdapterKind = "in-memory" | "postgres";

export interface PersistenceAdapterProviderOptions {
  readonly token: symbol;
  readonly defaultAdapter: PersistenceAdapterKind;
}

export function createPersistenceAdapterProvider(
  token: symbol,
  activeAdapterToken: unknown
) {
  return {
    provide: token,
    useExisting: activeAdapterToken
  };
}
