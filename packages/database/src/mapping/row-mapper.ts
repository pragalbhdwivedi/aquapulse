export interface RowMapper<TRow, TDomain> {
  toDomain(row: TRow): TDomain;
}

export interface RowEncoder<TDomain, TRow> {
  toRow(domain: TDomain): TRow;
}
