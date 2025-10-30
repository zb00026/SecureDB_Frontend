export interface ColumnSchemaDTO {
  readonly columnName: string;
  readonly dataType: string;
  readonly columnType: string;
  readonly isNullable: boolean;
  readonly columnDefault: string | null;
  readonly columnComment: string | null;
  readonly columnKey: string | null;
  readonly extra: string | null;
  readonly ordinalPosition: number;
}

export interface TableSchemaDTO {
  readonly tableName: string;
  readonly tableType: string;
  readonly tableComment: string | null;
  readonly schema: string;
  readonly columnCount: number;
  readonly columns: ColumnSchemaDTO[];
}

export interface DatabaseSchemaDTO {
  readonly databaseName: string;
  readonly tables: TableSchemaDTO[];
  readonly totalTables: number;
  readonly totalColumns: number;
}
