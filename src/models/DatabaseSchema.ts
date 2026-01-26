export interface ColumnSchemaDTO {
  readonly columnName: string;
  readonly dataType: string;
  readonly columnType?: string; // Optional for MongoDB
  readonly isNullable: boolean;
  readonly columnDefault?: string | null;
  readonly columnComment?: string | null;
  readonly columnKey?: string | null;
  readonly extra?: string | null;
  readonly ordinalPosition?: number;
}

export interface TableSchemaDTO {
  readonly tableName: string;
  readonly tableType: string;
  readonly tableComment?: string | null;
  readonly schema?: string; // Optional for MongoDB
  readonly columnCount: number;
  readonly columns: ColumnSchemaDTO[];
}

// MongoDB-specific: Database with collections
export interface MongoDBDatabaseDTO {
  readonly name: string;
  readonly tables: TableSchemaDTO[]; // Collections are stored as tables
}

export interface DatabaseSchemaDTO {
  readonly databaseName?: string; // Optional for MongoDB (may have multiple databases)
  readonly tables?: TableSchemaDTO[]; // For SQL databases
  readonly databases?: MongoDBDatabaseDTO[]; // For MongoDB
  readonly totalTables: number;
  readonly totalColumns: number;
}
