import React, { useState } from 'react';
import { sqliteService } from '../services/sqliteService.ts';
import { INITIAL_SCHEMA_SQL } from '../services/seedData.ts';
import { Database, Check, X, Shield, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';

interface CreateDatabaseModalProps {
  onClose: () => void;
  onSuccess: (dbName: string) => void;
}

export const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [dbName, setDbName] = useState('academia_student_records.sqlite');
  const [schemaType, setSchemaType] = useState<'collegiate' | 'stem' | 'empty'>('collegiate');
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [showDdlPreview, setShowDdlPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setErrorMessage(null);

    setCreationStep('1. Allocating SQLite memory space...');
    await new Promise((r) => setTimeout(r, 200));

    setCreationStep('2. Compiling relational DDL statements...');
    await new Promise((r) => setTimeout(r, 200));

    setCreationStep('3. Creating tables: departments, students, courses, enrollments...');
    await new Promise((r) => setTimeout(r, 250));

    const res = sqliteService.createDatabase({
      dbName: dbName.trim() || 'student_records.sqlite',
      schemaType,
      includeSampleData,
    });

    if (!res.success) {
      setIsCreating(false);
      setErrorMessage(res.error || 'Failed to initialize SQLite database.');
      return;
    }

    setCreationStep('4. Finalizing database indexes and schema verification...');
    await new Promise((r) => setTimeout(r, 200));

    setIsCreating(false);
    onSuccess(dbName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Create SQLite Database</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Database Name */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Database Filename *</label>
            <div className="relative">
              <input
                type="text"
                disabled={isCreating}
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="academia_student_records.sqlite"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                SQLite 3.x
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              File can be downloaded as standard .sqlite binary for sqlite3 CLI or desktop GUI tools.
            </p>
          </div>

          {/* Schema Template Choice */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Select Relational Schema Architecture</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSchemaType('collegiate')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  schemaType === 'collegiate'
                    ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/30 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-white">Collegiate SIS Architecture</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  7 relational tables: Students, Departments, Courses, Terms, Enrollments, Assessments, Audit.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSchemaType('stem')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  schemaType === 'stem'
                    ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/30 text-white'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-white">STEM & Academic Honors</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Optimized for laboratory units, thesis advisors, and weighted GPA calculations.
                </div>
              </button>
            </div>
          </div>

          {/* Dataset Seeding Toggle */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Populate Benchmark Collegiate Data</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Pre-load 12 student records, 10 curriculum courses, and 35+ graded enrollments.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeSampleData}
                disabled={isCreating}
                onChange={(e) => setIncludeSampleData(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* DDL Preview Accordion */}
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDdlPreview(!showDdlPreview)}
              className="w-full px-3.5 py-2.5 bg-slate-950 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-between text-left"
            >
              <span className="font-medium text-[11px]">Inspect SQLite DDL SQL Statements</span>
              {showDdlPreview ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {showDdlPreview && (
              <div className="p-3 bg-slate-950/90 max-h-48 overflow-y-auto font-mono text-[10px] text-indigo-200 leading-relaxed border-t border-slate-800 whitespace-pre">
                {INITIAL_SCHEMA_SQL.trim()}
              </div>
            )}
          </div>

          {/* Creation Status Log */}
          {isCreating && (
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-md text-xs text-indigo-300 font-mono flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span>{creationStep}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-500 font-semibold rounded transition-colors flex items-center gap-2 shadow disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Creating Database...' : 'Create Database Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
