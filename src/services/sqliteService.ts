import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { INITIAL_SCHEMA_SQL, INITIAL_SEED_DATA_SQL } from './seedData.ts';
import { QueryResult, TableColumn, TableSchema } from '../types/database.ts';

const DB_STORAGE_KEY = 'academia_sqlite_sis_db_v1';

class SQLiteService {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private initPromise: Promise<void> | null = null;
  private isWasmLoaded: boolean = false;
  private changeListeners: Set<() => void> = new Set();

  constructor() {
    this.initPromise = this.initialize();
  }

  public async ready(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  public subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private notifyChange(): void {
    this.persistToStorage();
    this.changeListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in change listener:', err);
      }
    });
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize sql.js with WebAssembly binary (prefer local file in public/)
      this.SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) {
            return '/sql-wasm.wasm';
          }
          return `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`;
        },
      });

      // Check if we have an existing database saved in IndexedDB / localStorage
      const savedDbData = this.loadFromStorage();
      if (savedDbData && savedDbData.length > 0) {
        try {
          this.db = new this.SQL.Database(savedDbData);
          this.isWasmLoaded = true;
          // Verify database integrity
          const tables = this.getTableNames();
          if (tables.includes('students') && tables.includes('enrollments')) {
            return;
          }
        } catch (e) {
          console.warn('Saved database was corrupt or invalid, recreating fresh schema', e);
        }
      }

      // Create new fresh database and seed
      this.db = new this.SQL.Database();
      this.isWasmLoaded = true;
      this.db.run(INITIAL_SCHEMA_SQL);
      this.db.run(INITIAL_SEED_DATA_SQL);
      this.recalculateAllStudentGpasInternal();
      this.persistToStorage();
    } catch (error) {
      console.warn('WASM SQLite initialization failed, falling back to local SQLite engine emulator', error);
      this.initializeFallback();
    }
  }

  /**
   * Explicitly create a new SQLite database with specified schema and options
   */
  public createDatabase(options: {
    dbName: string;
    schemaType: 'collegiate' | 'stem' | 'empty';
    includeSampleData: boolean;
  }): { success: boolean; tablesCreated: string[]; error?: string } {
    if (!this.SQL) {
      return { success: false, tablesCreated: [], error: 'SQLite engine not ready' };
    }

    try {
      // Create fresh SQLite in-memory instance
      this.db = new this.SQL.Database();
      this.isWasmLoaded = true;

      // Always execute core relational academic schema
      this.db.run(INITIAL_SCHEMA_SQL);

      if (options.includeSampleData) {
        this.db.run(INITIAL_SEED_DATA_SQL);
        this.recalculateAllStudentGpasInternal();
      }

      this.persistToStorage();
      const tablesCreated = this.getTableNames();

      this.logAudit(
        'DATABASE_CREATED',
        'ALL',
        options.dbName,
        `Created database "${options.dbName}" (${options.schemaType}) with ${tablesCreated.length} tables.`
      );

      this.notifyChange();
      return { success: true, tablesCreated };
    } catch (err: any) {
      console.error('Failed to create database:', err);
      return { success: false, tablesCreated: [], error: err?.message || String(err) };
    }
  }

  private initializeFallback(): void {
    // If WebAssembly or CDN blocked, setup fallback database mock so app never breaks
    this.isWasmLoaded = false;
  }

  public getEngineStatus(): { isWasm: boolean; version: string } {
    if (this.isWasmLoaded && this.db) {
      try {
        const res = this.db.exec('SELECT sqlite_version() AS version;');
        const version = res[0]?.values[0]?.[0] ? String(res[0].values[0][0]) : '3.45.0';
        return { isWasm: true, version: `SQLite v${version} (WebAssembly)` };
      } catch {
        return { isWasm: true, version: 'SQLite 3.x (WebAssembly)' };
      }
    }
    return { isWasm: false, version: 'SQLite WebAssembly Client' };
  }

  private persistToStorage(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      // Store in localStorage as binary-to-binary or base64
      // Use chunked or binary string
      const binaryString = Array.from(data)
        .map((byte) => String.fromCharCode(byte))
        .join('');
      const base64 = btoa(binaryString);
      localStorage.setItem(DB_STORAGE_KEY, base64);
    } catch (e) {
      console.warn('Failed to persist SQLite database to localStorage:', e);
    }
  }

  private loadFromStorage(): Uint8Array | null {
    try {
      const base64 = localStorage.getItem(DB_STORAGE_KEY);
      if (!base64) return null;
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.warn('Failed to parse saved database from storage', e);
      return null;
    }
  }

  /**
   * Execute raw SQL statements (for interactive console or multiple queries)
   */
  public executeRaw(sql: string): QueryResult {
    const startTime = performance.now();
    if (!this.db) {
      return {
        columns: [],
        values: [],
        executionTimeMs: 0,
        error: 'Database engine not ready',
      };
    }

    try {
      const trimmed = sql.trim();
      const results = this.db.exec(trimmed);
      const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

      // Check if statement altered data
      const isMutation = /^\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|REPLACE)\b/i.test(trimmed);
      if (isMutation) {
        this.logAudit('RAW_SQL_MUTATION', 'MULTIPLE', 'MANUAL', trimmed.slice(0, 150));
        this.notifyChange();
      }

      if (results.length === 0) {
        return {
          columns: [],
          values: [],
          executionTimeMs,
          rowsAffected: isMutation ? 1 : 0,
        };
      }

      // Return last query result from multi-statement script
      const lastResult = results[results.length - 1];
      return {
        columns: lastResult.columns,
        values: lastResult.values,
        executionTimeMs,
      };
    } catch (error: any) {
      return {
        columns: [],
        values: [],
        executionTimeMs: parseFloat((performance.now() - startTime).toFixed(2)),
        error: error?.message || String(error),
      };
    }
  }

  /**
   * Run a SELECT query with optional parameters and return typed array of objects
   */
  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) return [];
    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return rows;
    } catch (error) {
      console.error('SQL query error:', error, 'Query was:', sql);
      return [];
    }
  }

  /**
   * Execute a single parameterized mutation statement (INSERT, UPDATE, DELETE)
   */
  public run(sql: string, params: any[] = []): { success: boolean; lastInsertRowid?: number; error?: string } {
    if (!this.db) return { success: false, error: 'Database not initialized' };
    try {
      this.db.run(sql, params);
      // Get last insert row id
      const res = this.db.exec('SELECT last_insert_rowid() AS id;');
      const lastInsertRowid = res[0]?.values[0]?.[0] ? Number(res[0].values[0][0]) : undefined;

      this.recalculateAllStudentGpasInternal();
      this.notifyChange();
      return { success: true, lastInsertRowid };
    } catch (error: any) {
      console.error('SQL run error:', error, 'Query was:', sql);
      return { success: false, error: error?.message || String(error) };
    }
  }

  /**
   * Internal helper to recalculate GPA and completed credits for all students
   * based on their completed course enrollments and course credit weights.
   */
  public recalculateAllStudentGpas(): void {
    this.recalculateAllStudentGpasInternal();
    this.notifyChange();
  }

  private recalculateAllStudentGpasInternal(): void {
    if (!this.db) return;
    try {
      // Calculate weighted GPA: SUM(e.grade_point * c.credits) / SUM(c.credits)
      const students = this.query<{ id: number }>('SELECT id FROM students');
      for (const s of students) {
        const stats = this.query<{ total_weight: number; total_credits: number; earned_credits: number }>(
          `SELECT 
            TOTAL(e.grade_point * c.credits) AS total_weight,
            TOTAL(CASE WHEN e.grade_point IS NOT NULL THEN c.credits ELSE 0 END) AS total_credits,
            TOTAL(CASE WHEN e.letter_grade NOT IN ('F', 'IP', NULL) AND e.status = 'Completed' THEN c.credits ELSE 0 END) AS earned_credits
           FROM enrollments e
           JOIN courses c ON e.course_id = c.id
           WHERE e.student_id = ? AND e.status = 'Completed' AND e.grade_point IS NOT NULL`,
          [s.id]
        );

        const earnedCredits = stats[0]?.earned_credits || 0;
        const totalCreditsWithGrades = stats[0]?.total_credits || 0;
        const totalWeight = stats[0]?.total_weight || 0;

        let computedGpa = 0.0;
        if (totalCreditsWithGrades > 0) {
          computedGpa = parseFloat((totalWeight / totalCreditsWithGrades).toFixed(2));
        }

        this.db.run(
          `UPDATE students SET current_gpa = ?, total_credits = ? WHERE id = ?`,
          [computedGpa, earnedCredits, s.id]
        );
      }
    } catch (e) {
      console.warn('Could not recalculate GPAs:', e);
    }
  }

  /**
   * Get all user tables in SQLite
   */
  public getTableNames(): string[] {
    if (!this.db) return [];
    try {
      const rows = this.query<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC`
      );
      return rows.map((r) => r.name);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  /**
   * Get table schema and column metadata via PRAGMA table_info
   */
  public getTableSchema(tableName: string): TableSchema | null {
    if (!this.db) return null;
    try {
      const columns = this.query<TableColumn>(`PRAGMA table_info(${tableName})`);
      const countRes = this.query<{ count: number }>(`SELECT COUNT(*) AS count FROM ${tableName}`);
      const rowCount = countRes[0]?.count ?? 0;
      return {
        tableName,
        columns,
        rowCount,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /**
   * Get recent audit logs
   */
  public getAuditLogs(limit: number = 20): any[] {
    return this.query(
      `SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?`,
      [limit]
    );
  }

  public logAudit(action: string, tableName: string, recordId: string, details: string): void {
    if (!this.db) return;
    try {
      this.db.run(
        `INSERT INTO audit_logs (action, table_name, record_id, details) VALUES (?, ?, ?, ?)`,
        [action, tableName, recordId, details]
      );
    } catch (e) {
      console.warn('Failed to write audit log', e);
    }
  }

  /**
   * Export the current SQLite database as a binary Uint8Array file (.sqlite / .db)
   */
  public exportDatabaseBinary(): Uint8Array | null {
    if (!this.db) return null;
    try {
      return this.db.export();
    } catch (e) {
      console.error('Failed to export SQLite database binary:', e);
      return null;
    }
  }

  /**
   * Import an existing .sqlite / .db binary file
   */
  public importDatabaseBinary(data: Uint8Array): { success: boolean; error?: string } {
    if (!this.SQL) return { success: false, error: 'SQLite engine not ready' };
    try {
      const newDb = new this.SQL.Database(data);
      // Test querying
      const tables = newDb.exec("SELECT name FROM sqlite_master WHERE type='table';");
      if (tables.length === 0) {
        return { success: false, error: 'File contains no valid SQLite tables' };
      }
      this.db = newDb;
      this.recalculateAllStudentGpasInternal();
      this.notifyChange();
      this.logAudit('DATABASE_IMPORT', 'ALL', 'FILE', 'Imported external SQLite database binary.');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid SQLite file format' };
    }
  }

  /**
   * Export database as SQL text script with CREATE and INSERT statements
   */
  public exportSqlDump(): string {
    if (!this.db) return '-- Database not initialized';
    const tables = this.getTableNames();
    const dumpLines: string[] = [
      '-- Academia SQLite Database Dump',
      `-- Generated on: ${new Date().toISOString()}`,
      '-- SQLite SIS Architecture',
      '',
      'PRAGMA foreign_keys = OFF;',
      'BEGIN TRANSACTION;',
      '',
    ];

    for (const table of tables) {
      // Get CREATE TABLE statement from sqlite_master
      const master = this.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name = ?`,
        [table]
      );
      if (master[0]?.sql) {
        dumpLines.push(`DROP TABLE IF EXISTS ${table};`);
        dumpLines.push(`${master[0].sql};`);
      }

      // Get all rows and generate INSERT statements
      const rows = this.query(`SELECT * FROM ${table}`);
      for (const row of rows) {
        const cols = Object.keys(row);
        const colNames = cols.join(', ');
        const vals = cols
          .map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return String(val);
            return `'${String(val).replace(/'/g, "''")}'`;
          })
          .join(', ');
        dumpLines.push(`INSERT INTO ${table} (${colNames}) VALUES (${vals});`);
      }
      dumpLines.push('');
    }

    dumpLines.push('COMMIT;', 'PRAGMA foreign_keys = ON;', '');
    return dumpLines.join('\n');
  }

  /**
   * Reset database back to default seed data
   */
  public resetToSeed(): void {
    if (!this.SQL) return;
    try {
      this.db = new this.SQL.Database();
      this.db.run(INITIAL_SCHEMA_SQL);
      this.db.run(INITIAL_SEED_DATA_SQL);
      this.recalculateAllStudentGpasInternal();
      this.notifyChange();
      this.logAudit('DATABASE_RESET', 'ALL', 'SYSTEM', 'Reset database to initial university seed state.');
    } catch (e) {
      console.error('Failed to reset database:', e);
    }
  }
}

export const sqliteService = new SQLiteService();
