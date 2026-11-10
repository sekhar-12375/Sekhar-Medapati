import React, { useState, useEffect } from 'react';
import { sqliteService } from '../services/sqliteService.ts';
import { QueryResult, TableSchema } from '../types/database.ts';
import { Play, Download, Upload, RotateCcw, Database, Code, Table, ShieldCheck, Copy, Check, FileDown, Layers } from 'lucide-react';

const PRESET_QUERIES = [
  {
    name: 'Top 5 Students by Cumulative GPA',
    sql: `SELECT 
  s.student_id,
  s.first_name || ' ' || s.last_name AS full_name,
  d.code AS department,
  s.total_credits,
  s.current_gpa
FROM students s
JOIN departments d ON s.department_id = d.id
ORDER BY s.current_gpa DESC
LIMIT 5;`,
  },
  {
    name: 'Department GPA & Enrollment Summary',
    sql: `SELECT 
  d.code,
  d.name AS department_name,
  COUNT(s.id) AS total_students,
  ROUND(AVG(s.current_gpa), 2) AS average_gpa,
  TOTAL(s.total_credits) AS aggregate_credits_earned
FROM departments d
LEFT JOIN students s ON d.id = s.department_id
GROUP BY d.id
ORDER BY average_gpa DESC;`,
  },
  {
    name: 'Students with Low Attendance or Academic Warning',
    sql: `SELECT 
  s.student_id,
  s.first_name || ' ' || s.last_name AS student_name,
  s.current_gpa,
  s.status,
  s.advisor
FROM students s
WHERE s.current_gpa < 2.50 OR s.status = 'Probation'
ORDER BY s.current_gpa ASC;`,
  },
  {
    name: 'Course Enrollment Capacity & Average Grade',
    sql: `SELECT 
  c.course_code,
  c.course_title,
  c.instructor,
  COUNT(e.id) AS enrolled_students,
  c.max_capacity,
  ROUND(AVG(e.numeric_score), 1) AS avg_numeric_score
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id
ORDER BY enrolled_students DESC;`,
  },
  {
    name: 'Calculate Weighted Term GPA Formula in SQLite',
    sql: `SELECT 
  s.student_id,
  s.first_name || ' ' || s.last_name AS student_name,
  t.term_name,
  ROUND(TOTAL(e.grade_point * c.credits) / TOTAL(c.credits), 2) AS calculated_term_gpa,
  TOTAL(c.credits) AS term_credits
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
JOIN academic_terms t ON e.term_id = t.id
WHERE e.grade_point IS NOT NULL
GROUP BY s.id, t.id
ORDER BY s.student_id, t.start_date;`,
  },
  {
    name: 'Recent Database Audit Log Activity',
    sql: `SELECT id, action, table_name, record_id, details, timestamp 
FROM audit_logs 
ORDER BY id DESC 
LIMIT 15;`,
  },
];

interface SqlStudioViewProps {
  onOpenCreateDb?: () => void;
}

export const SqlStudioView: React.FC<SqlStudioViewProps> = ({ onOpenCreateDb }) => {
  const [sqlInput, setSqlInput] = useState<string>(PRESET_QUERIES[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('students');
  const [tableSchema, setTableSchema] = useState<TableSchema | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'schema' | 'audit'>('console');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadDatabaseMeta();
    runQuery(PRESET_QUERIES[0].sql);
  }, []);

  const loadDatabaseMeta = () => {
    const tableList = sqliteService.getTableNames();
    setTables(tableList);
    if (tableList.length > 0) {
      inspectTable(tableList[0]);
    }
    setAuditLogs(sqliteService.getAuditLogs(30));
  };

  const inspectTable = (tableName: string) => {
    setSelectedTable(tableName);
    const schema = sqliteService.getTableSchema(tableName);
    setTableSchema(schema);
  };

  const runQuery = (sqlToRun?: string) => {
    const code = sqlToRun !== undefined ? sqlToRun : sqlInput;
    const queryRes = sqliteService.executeRaw(code);
    setResult(queryRes);
    loadDatabaseMeta();
  };

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESET_QUERIES.find((p) => p.name === e.target.value);
    if (preset) {
      setSqlInput(preset.sql);
      runQuery(preset.sql);
    }
  };

  const downloadSqliteFile = () => {
    const binary = sqliteService.exportDatabaseBinary();
    if (!binary) {
      setBackupNotice('Failed to generate SQLite binary.');
      return;
    }
    const blob = new Blob([binary as any], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academia_student_sis_${new Date().toISOString().slice(0, 10)}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupNotice('Downloaded .sqlite binary. Can be opened in DB Browser or sqlite3.');
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const downloadSqlDump = () => {
    const dump = sqliteService.exportSqlDump();
    const blob = new Blob([dump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academia_sqlite_dump_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupNotice('Exported SQL schema and insert statements script.');
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      if (buffer) {
        const bytes = new Uint8Array(buffer);
        const res = sqliteService.importDatabaseBinary(bytes);
        if (res.success) {
          loadDatabaseMeta();
          runQuery(PRESET_QUERIES[0].sql);
          setBackupNotice('Successfully loaded external SQLite database.');
        } else {
          setBackupNotice(`Import failed: ${res.error}`);
        }
        setTimeout(() => setBackupNotice(null), 4000);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleResetDb = () => {
    if (window.confirm('Reset database back to standard collegiate university seed dataset?')) {
      sqliteService.resetToSeed();
      loadDatabaseMeta();
      runQuery(PRESET_QUERIES[0].sql);
      setBackupNotice('Database successfully restored to original seed state.');
      setTimeout(() => setBackupNotice(null), 4000);
    }
  };

  const copyResultsCsv = () => {
    if (!result || result.columns.length === 0) return;
    const header = result.columns.join(',');
    const rows = result.values.map((v) =>
      v.map((val) => (val === null ? '' : `"${String(val).replace(/"/g, '""')}"`)).join(',')
    );
    const csv = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const status = sqliteService.getEngineStatus();

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">SQLite Database Studio</h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {status.version}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Secure client-side query execution, schema inspection, and raw binary database export/import.
          </p>
        </div>

        {/* Database Backup Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Create new database */}
          {onOpenCreateDb && (
            <button
              onClick={onOpenCreateDb}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              title="Create a new SQLite database with custom schema"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Create Database</span>
            </button>
          )}

          {/* Export .sqlite binary */}
          <button
            onClick={downloadSqliteFile}
            className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            title="Download real SQLite3 .sqlite binary file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export .sqlite</span>
          </button>

          {/* Export SQL script */}
          <button
            onClick={downloadSqlDump}
            className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            title="Download SQL DDL and INSERT script"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-400" />
            <span>SQL Dump</span>
          </button>

          {/* Import .sqlite file */}
          <label className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Load .db</span>
            <input
              type="file"
              accept=".sqlite,.db,.sqlite3"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset seed */}
          <button
            onClick={handleResetDb}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-red-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            title="Restore original dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset DB</span>
          </button>
        </div>
      </div>

      {backupNotice && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-xs text-indigo-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* Mode Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('console')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 font-medium ${
            activeTab === 'console'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>SQL Query Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 font-medium ${
            activeTab === 'schema'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Schema & Table Browser ({tables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 font-medium ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* ====================== TAB 1: SQL QUERY STUDIO ====================== */}
      {activeTab === 'console' && (
        <div className="space-y-4">
          {/* Query Editor Box */}
          <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            {/* Editor Toolbar */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  Preset Queries:
                </span>
                <select
                  onChange={handleSelectPreset}
                  className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 max-w-xs"
                >
                  {PRESET_QUERIES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono text-[11px]">Ctrl+Enter to Run</span>
                <button
                  onClick={() => runQuery()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Query</span>
                </button>
              </div>
            </div>

            {/* SQL Textarea */}
            <div className="p-4 bg-slate-950/70">
              <textarea
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    runQuery();
                  }
                }}
                rows={7}
                placeholder="Write SELECT, INSERT, UPDATE, DELETE, or PRAGMA statements..."
                className="w-full bg-slate-950 text-indigo-200 font-mono text-xs leading-relaxed p-3 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 resize-y"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Results Panel */}
          <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow">
            {/* Result Header & Timing */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">Execution Output</span>
                {result && (
                  <span className="text-slate-400 font-mono tabular-nums text-[11px]">
                    {result.values.length} rows in {result.executionTimeMs}ms
                  </span>
                )}
              </div>

              {result && result.columns.length > 0 && (
                <button
                  onClick={copyResultsCsv}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied CSV</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Display */}
            {result?.error ? (
              <div className="p-4 bg-red-950/30 border-l-4 border-red-500 text-xs text-red-300 font-mono">
                <strong>SQLite Execution Error:</strong> {result.error}
              </div>
            ) : result && result.columns.length > 0 ? (
              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      {result.columns.map((col, idx) => (
                        <th key={idx} className="py-2 px-3 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result.values.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/30">
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-2 px-3 whitespace-nowrap tabular-nums ${
                              val === null ? 'text-slate-600 italic' : 'text-slate-200'
                            }`}
                          >
                            {val === null ? 'NULL' : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                {result?.rowsAffected !== undefined
                  ? `Statement executed successfully. (${result.executionTimeMs}ms)`
                  : 'Write and run a SQL statement above.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================== TAB 2: SCHEMA & TABLE BROWSER ====================== */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Table List */}
          <div className="md:col-span-4 space-y-2">
            <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
              SQLite Tables ({tables.length})
            </h3>
            <div className="space-y-1">
              {tables.map((tbl) => (
                <button
                  key={tbl}
                  onClick={() => inspectTable(tbl)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-md text-xs font-mono flex items-center justify-between transition-colors ${
                    selectedTable === tbl
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{tbl}</span>
                  <span className="text-[10px] opacity-70">
                    {sqliteService.getTableSchema(tbl)?.rowCount ?? 0} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Schema Inspector */}
          <div className="md:col-span-8">
            {tableSchema ? (
              <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow">
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">
                      Table: {tableSchema.tableName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {tableSchema.rowCount} records stored · PRAGMA table_info
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const sql = `SELECT * FROM ${tableSchema.tableName} LIMIT 25;`;
                      setSqlInput(sql);
                      setActiveTab('console');
                      runQuery(sql);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
                  >
                    Query Table
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">#</th>
                        <th className="py-2.5 px-3 font-semibold">Column Name</th>
                        <th className="py-2.5 px-3 font-semibold">Data Type</th>
                        <th className="py-2.5 px-3 font-semibold">Primary Key</th>
                        <th className="py-2.5 px-3 font-semibold">Not Null</th>
                        <th className="py-2.5 px-3 font-semibold">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                      {tableSchema.columns.map((col) => (
                        <tr key={col.cid} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 text-slate-500">{col.cid}</td>
                          <td className="py-2 px-3 font-semibold text-white">{col.name}</td>
                          <td className="py-2 px-3 text-indigo-400">{col.type}</td>
                          <td className="py-2 px-3">
                            {col.pk ? (
                              <span className="text-amber-400 font-bold">PRIMARY KEY</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {col.notnull ? (
                              <span className="text-emerald-400">NOT NULL</span>
                            ) : (
                              <span className="text-slate-600">NULLABLE</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {col.dflt_value !== null ? String(col.dflt_value) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded text-slate-500 text-xs">
                Select a table to inspect metadata.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================== TAB 3: AUDIT TRAIL LOG ====================== */}
      {activeTab === 'audit' && (
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Database Audit & Integrity Log</h3>
            <span className="text-xs text-slate-400 font-mono">{auditLogs.length} logged events</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 font-semibold">ID</th>
                  <th className="py-2 px-3 font-semibold">Action</th>
                  <th className="py-2 px-3 font-semibold">Target Table</th>
                  <th className="py-2 px-3 font-semibold">Record ID</th>
                  <th className="py-2 px-3 font-semibold">Details</th>
                  <th className="py-2 px-3 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-500">{log.id}</td>
                    <td className="py-2 px-3 font-semibold text-indigo-400">{log.action}</td>
                    <td className="py-2 px-3 text-slate-300">{log.table_name}</td>
                    <td className="py-2 px-3 text-slate-400">{log.record_id}</td>
                    <td className="py-2 px-3 text-slate-300 max-w-sm truncate">{log.details}</td>
                    <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
