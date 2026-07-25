/**
 * MigrationManager
 *
 * Responsible for application and database migrations.
 */

export type MigrationState =
  | "Pending"
  | "Running"
  | "Completed"
  | "Failed"
  | "RolledBack";

export interface Migration {
  readonly migrationId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly description: string;
}

export interface MigrationResult {
  readonly migrationId: string;
  readonly state: MigrationState;
  readonly executedAt: Date;
  readonly message: string;
}

export interface MigrationManager {
  initialize(): Promise<void>;
  findPendingMigrations(fromVersion: string, toVersion: string): Promise<ReadonlyArray<Migration>>;
  executeMigration(migration: Migration): Promise<MigrationResult>;
  rollbackMigration(migration: Migration): Promise<MigrationResult>;
  verifyMigration(result: MigrationResult): Promise<boolean>;
}