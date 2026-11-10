import React, { useState } from 'react';
import { Department, Student } from '../types/database.ts';
import { Award, TrendingUp, Users, CheckCircle, BarChart3, Star } from 'lucide-react';

interface PerformanceViewProps {
  students: Student[];
  departments: Department[];
  deptStats: { code: string; name: string; student_count: number; avg_gpa: number }[];
  gradeDistribution: { grade: string; count: number }[];
  onSelectStudent: (studentId: number) => void;
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  students,
  departments,
  deptStats,
  gradeDistribution,
  onSelectStudent,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

  const filteredStudents = students.filter((s) => {
    return selectedDeptId === 'all' || s.department_id === Number(selectedDeptId);
  });

  const honorsStudents = filteredStudents.filter((s) => s.current_gpa >= 3.5);
  const satisfactoryStudents = filteredStudents.filter((s) => s.current_gpa >= 2.5 && s.current_gpa < 3.5);
  const atRiskStudents = filteredStudents.filter((s) => s.current_gpa < 2.5);

  const cohortMap = new Map<number, { count: number; totalGpa: number }>();
  for (const s of filteredStudents) {
    const yr = s.enrollment_year;
    if (!cohortMap.has(yr)) {
      cohortMap.set(yr, { count: 0, totalGpa: 0 });
    }
    const c = cohortMap.get(yr)!;
    c.count += 1;
    c.totalGpa += s.current_gpa;
  }

  const cohorts = Array.from(cohortMap.entries())
    .map(([year, data]) => ({
      year,
      count: data.count,
      avgGpa: parseFloat((data.totalGpa / (data.count || 1)).toFixed(2)),
    }))
    .sort((a, b) => a.year - b.year);

  // Total grades count for percentage calculation
  const totalGrades = gradeDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Academic Performance Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregate institutional statistics, grade letter distributions, and honors cohort analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Filter Department:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 Summary Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Honors & Dean's List</span>
            <Star className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
              {honorsStudents.length}
            </span>
            <span className="text-xs text-slate-400">
              ({Math.round((honorsStudents.length / (filteredStudents.length || 1)) * 100)}% of cohort)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Cumulative GPA &ge; 3.50 on standard 4.00 scale</p>
        </div>

        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Good Standing</span>
            <CheckCircle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {satisfactoryStudents.length}
            </span>
            <span className="text-xs text-slate-400">
              ({Math.round((satisfactoryStudents.length / (filteredStudents.length || 1)) * 100)}% of cohort)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Satisfactory progress between 2.50 – 3.49 GPA</p>
        </div>

        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Academic Warning</span>
            <Award className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-red-400">
              {atRiskStudents.length}
            </span>
            <span className="text-xs text-slate-400">
              ({Math.round((atRiskStudents.length / (filteredStudents.length || 1)) * 100)}% of cohort)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Cumulative GPA below 2.50 or active probation</p>
        </div>
      </div>

      {/* Grade Letter Distribution Chart & Cohort Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Letter Grade Frequency Breakdown */}
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Grade Frequency Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Aggregate grades earned across all course enrollments</p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">{totalGrades} total grades</span>
          </div>

          <div className="space-y-3 pt-2">
            {gradeDistribution.map((item) => {
              const pct = Math.round((item.count / totalGrades) * 100);
              const isHigh = item.grade.startsWith('A');
              const isMedium = item.grade.startsWith('B');
              const isLow = item.grade.startsWith('C');
              const barColor = isHigh
                ? 'bg-emerald-500'
                : isMedium
                ? 'bg-sky-500'
                : isLow
                ? 'bg-amber-500'
                : 'bg-red-500';

              return (
                <div key={item.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-white w-8">{item.grade}</span>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-slate-400">
                      <span>{item.count} enrollments</span>
                      <span className="text-slate-500">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cohort Progression */}
        <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Enrollment Cohort Progression</h2>
            <p className="text-xs text-slate-400 mt-0.5">Mean GPA by undergraduate entering class</p>
          </div>

          <div className="space-y-4 pt-2">
            {cohorts.map((c) => (
              <div key={c.year} className="p-3.5 rounded-md bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Class of {c.year}</span>
                    <span className="text-xs text-slate-400">({c.count} students)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm tabular-nums text-indigo-400">
                      {c.avgGpa.toFixed(2)} GPA
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(c.avgGpa / 4.0) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dean's Honors List Roster */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Dean's Honor Roll Recipient Roster</h2>
              <p className="text-xs text-slate-400">Undergraduates maintaining cumulative GPA of 3.50 or higher</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {honorsStudents.length} recipients qualified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Student ID</th>
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Major</th>
                <th className="py-2.5 px-4 font-semibold text-right">Earned Credits</th>
                <th className="py-2.5 px-4 font-semibold text-right">Cumulative GPA</th>
                <th className="py-2.5 px-4 font-semibold">Faculty Advisor</th>
                <th className="py-2.5 px-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {honorsStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-300">{s.student_id}</td>
                  <td className="py-2.5 px-4 font-semibold text-white">
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {s.department_code} · {s.department_name}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">
                    {s.total_credits}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums text-sm">
                    {s.current_gpa.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{s.advisor}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => onSelectStudent(s.id)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline underline-offset-2"
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
