import React from 'react';
import { Student } from '../types/database.ts';
import { Database, AlertTriangle, ArrowUpRight, GraduationCap, BookOpen, Award, CheckCircle } from 'lucide-react';

interface DashboardViewProps {
  metrics: {
    totalStudents: number;
    averageGpa: number;
    averageAttendance: number;
    totalCourses: number;
    atRiskStudents: Student[];
    gpaBrackets: { label: string; range: string; count: number; color: string }[];
    deptStats: { code: string; name: string; student_count: number; avg_gpa: number }[];
    gradeDistribution: { grade: string; count: number }[];
  };
  sqliteStatus: { isWasm: boolean; version: string };
  onSelectStudent: (studentId: number) => void;
  onNavigateTab: (tab: 'dashboard' | 'students' | 'courses' | 'performance' | 'sql-studio') => void;
  onOpenAddStudent: () => void;
  onOpenCreateDb?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  sqliteStatus,
  onSelectStudent,
  onNavigateTab,
  onOpenAddStudent,
  onOpenCreateDb,
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Academic Performance & Records</h1>
          <p className="text-sm text-slate-400 mt-1">
            Collegiate student information system backed by local SQLite relational database engine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="font-mono tabular-nums text-slate-300">{sqliteStatus.version}</span>
          <span aria-hidden="true">·</span>
          <span>ACID Transacted</span>
          {onOpenCreateDb && (
            <>
              <span aria-hidden="true">·</span>
              <button
                onClick={onOpenCreateDb}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors inline-flex items-center gap-1 shadow-sm"
              >
                <Database className="w-3 h-3" />
                <span>Create Database</span>
              </button>
            </>
          )}
          <span aria-hidden="true">·</span>
          <button
            onClick={() => onNavigateTab('sql-studio')}
            className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 font-medium"
          >
            Open SQL Studio <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">Total Enrolled</span>
            <GraduationCap className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
              {metrics.totalStudents}
            </span>
            <div className="mt-1 text-xs text-slate-400">Active undergraduate records</div>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">Institutional GPA</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {metrics.averageGpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 4.00</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">Weighted grade point average</div>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">Mean Attendance</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {metrics.averageAttendance}%
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400">Course lecture & lab participation</div>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">Active Courses</span>
            <BookOpen className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
              {metrics.totalCourses}
            </span>
            <div className="mt-1 text-xs text-slate-400">5 academic departments</div>
          </div>
        </div>
      </div>

      {/* Main Grid: GPA Bracket Distribution & Department Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPA Distribution Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Academic Standing & GPA Brackets</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of student cumulative grade points</p>
            </div>
            <button
              onClick={() => onNavigateTab('performance')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Detailed Analytics &rarr;
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {metrics.gpaBrackets.map((bracket, i) => {
              const total = metrics.totalStudents || 1;
              const percentage = Math.round((bracket.count / total) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{bracket.label}</span>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-slate-400">
                      <span>{bracket.count} students</span>
                      <span className="text-slate-500">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percentage, 2)}%`,
                        backgroundColor: bracket.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Honors Eligible: {metrics.gpaBrackets.find((b) => b.range === '3.50 - 4.00')?.count || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Satisfactory: {metrics.gpaBrackets.find((b) => b.range === '2.00 - 2.99')?.count || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>Academic Intervention: {metrics.gpaBrackets.find((b) => b.range === '< 2.00')?.count || 0}</span>
            </div>
          </div>
        </div>

        {/* Department Average Standings */}
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Department Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Faculty average cumulative GPA</p>
          </div>

          <div className="space-y-3.5">
            {metrics.deptStats.map((dept) => (
              <div key={dept.code} className="p-3 rounded-md bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-indigo-400">{dept.code}</span>
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[140px]">{dept.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-sm tabular-nums text-white">
                      {dept.avg_gpa.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{dept.student_count} registered students</span>
                  <span>Target: 3.00+</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At-Risk Academic Warning Section */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-white">Academic Warning & Intervention Roster</h2>
              <p className="text-xs text-slate-400">Students with GPA below 2.50 or active Academic Probation status</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {metrics.atRiskStudents.length} records flagged
          </span>
        </div>

        {metrics.atRiskStudents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No students currently flagged for academic probation or low standing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Student ID</th>
                  <th className="py-2.5 px-4 font-semibold">Name</th>
                  <th className="py-2.5 px-4 font-semibold">Department</th>
                  <th className="py-2.5 px-4 font-semibold">Academic Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Current GPA</th>
                  <th className="py-2.5 px-4 font-semibold">Assigned Advisor</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {metrics.atRiskStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300">{student.student_id}</td>
                    <td className="py-3 px-4 font-medium text-white">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {(student as any).department_code} · {(student as any).department_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-amber-400 font-medium">
                        {student.status === 'Probation' ? 'Academic Probation' : 'Under Review'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-400 tabular-nums">
                      {student.current_gpa.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{student.advisor}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectStudent(student.id)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-2 hover:underline"
                      >
                        Inspect Transcript
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Database Management Bar */}
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Database schema: 7 tables transacted locally. Queries execute in sub-millisecond WebAssembly threads.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onOpenCreateDb && (
            <>
              <button
                onClick={onOpenCreateDb}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Create New Database
              </button>
              <span aria-hidden="true">·</span>
            </>
          )}
          <button
            onClick={() => onNavigateTab('students')}
            className="text-slate-300 hover:text-white transition-colors"
          >
            View Student Roster
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={onOpenAddStudent}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Enroll New Student
          </button>
        </div>
      </div>
    </div>
  );
};
