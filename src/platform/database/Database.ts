/**
 * Permanent database abstraction for KDOS.
 *
 * Defines the contract every future relational backing store (SQLite,
 * PostgreSQL, SQL Server) will implement. No driver is connected here —
 * business logic and repositories depend on the {@link Database}
 * interface, so swapping the underlying engine never requires changing
 * a repository or module built on top of it.
 */

export type DatabaseDriver = "sqlite" | "postgresql" | "sqlserver";

export interface DatabaseConnectionOptions {
  readonly driver: DatabaseDriver;
  readonly connectionString: string;
}

export interface DatabaseQueryResult<TRow> {
  readonly rows: readonly TRow[];
  readonly rowCount: number;
}

export interface Database {
  connect(options: DatabaseConnectionOptions): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  query<TRow>(statement: string, parameters?: readonly unknown[]): Promise<DatabaseQueryResult<TRow>>;
  execute(statement: string, parameters?: readonly unknown[]): Promise<void>;
}
