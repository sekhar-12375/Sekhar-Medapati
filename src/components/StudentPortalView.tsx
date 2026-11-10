import React, { useState } from 'react';
import { academicRepository } from '../services/academicRepository.ts';
import { AuthSession, Enrollment, Student } from '../types/database.ts';
import { Award, BookOpen, CheckCircle, Clock, AlertTriangle, Printer, ChevronDown, ChevronRight, FileText, User, Mail, GraduationCap } from 'lucide-react';

interface StudentPortalViewProps {
  session: AuthSession;
  onOpenTranscript: (studentId: number) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  session,
  onOpenTranscript,
}) => {
  const student = session.studentData;
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

  if (!student) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
        No student profile linked to this user account.
      </div>
    );
  }

  // Get full academic records for this student
  const { enrollments, termBreakdown } = academicRepository.getStudentById(student.id);

  const filteredEnrollments = enrollments.filter((e) => {
    return selectedTerm === 'all' || e.term_name === selectedTerm;
  });

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-slate-400';
    if (grade.startsWith('A')) return 'text-emerald-400 font-bold';
    if (grade.startsWith('B')) return 'text-sky-300 font-semibold';
    if (grade.startsWith('C')) return 'text-amber-300';
    return 'text-red-400 font-bold';
  };

  const isProbation = student.status === 'Probation' || student.current_gpa < 2.5;

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Student Welcome Header */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back, {student.first_name}
            </h1>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                student.status === 'Active'
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : student.status === 'Probation'
                  ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              {student.status === 'Probation' ? 'Academic Warning' : student.status}
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-indigo-400 font-semibold">{student.student_id}</span>
            <span aria-hidden="true">·</span>
            <span>Program: <strong className="text-slate-200">{student.department_name}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Class of {student.enrollment_year}</span>
            <span aria-hidden="true">·</span>
            <span>Faculty Advisor: <strong className="text-slate-200">{student.advisor}</strong></span>
          </div>
        </div>

        {/* Quick Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenTranscript(student.id)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-2 shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Official Transcript</span>
          </button>
        </div>
      </div>

      {/* Probation Early Warning Notice if applicable */}
      {isProbation && (
        <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-red-300">Academic Standing Advisory Notice</div>
            <p className="text-slate-300 leading-relaxed">
              Your cumulative GPA is currently {student.current_gpa.toFixed(2)}, which is below the collegiate academic standing threshold of 2.50. You are scheduled for an academic coaching session with your advisor, <strong>{student.advisor}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Student Academic Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Cumulative GPA</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {student.current_gpa.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 4.00</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {student.current_gpa >= 3.5 ? "Dean's Honors Recipient" : 'Undergraduate GPA'}
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Earned Credits</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tabular-nums text-indigo-400">
              {student.total_credits}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 120 cr</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {Math.round((student.total_credits / 120) * 100)}% toward degree completion
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Mean Attendance</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
              {enrollments.length > 0
                ? (
                    enrollments.reduce((acc, curr) => acc + (curr.attendance_percentage || 0), 0) /
                    enrollments.length
                  ).toFixed(1)
                : '0.0'}
              %
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">Across all registered lecture & lab sessions</div>
        </div>

        <div className="p-5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Completed Courses</div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-white">
            {enrollments.filter((e) => e.status === 'Completed').length}
          </div>
          <div className="mt-1 text-xs text-slate-400">Transacted in university ledger</div>
        </div>
      </div>

      {/* Course Enrollment & Grade Ledger */}
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">My Academic Course Ledger</h2>
            <p className="text-xs text-slate-400 mt-0.5">Verified grades, credit hours, and attendance recorded in SQLite.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Term Filter:</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Semesters</option>
              {termBreakdown.map((t) => (
                <option key={t.term_name} value={t.term_name}>
                  {t.term_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Course</th>
                <th className="py-2.5 px-4 font-semibold">Semester</th>
                <th className="py-2.5 px-4 font-semibold text-right">Credits</th>
                <th className="py-2.5 px-4 font-semibold text-right">Numeric Score</th>
                <th className="py-2.5 px-4 font-semibold text-center">Grade</th>
                <th className="py-2.5 px-4 font-semibold text-right">Grade Points</th>
                <th className="py-2.5 px-4 font-semibold text-right">Attendance</th>
                <th className="py-2.5 px-4 font-semibold">Instructor Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredEnrollments.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-indigo-400">{e.course_code}</div>
                    <div className="text-white font-medium mt-0.5">{e.course_title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Instructor: {e.instructor}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono whitespace-nowrap">
                    {e.term_name}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {e.course_credits} cr
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                    {e.numeric_score !== null ? `${e.numeric_score}%` : 'In Progress'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className={getGradeColor(e.letter_grade)}>
                      {e.letter_grade || 'IP'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {e.grade_point !== null ? e.grade_point.toFixed(1) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {e.attendance_percentage}%
                  </td>
                  <td className="py-3 px-4 text-slate-400 italic text-[11px] max-w-xs">
                    {e.notes || 'Normal course completion'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Term-by-Term Progression Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {termBreakdown.map((t) => (
          <div key={t.term_name} className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">{t.term_name}</span>
              <span className="font-mono text-slate-400">{t.credits} credits</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Semester GPA:</span>
              <span className="text-lg font-bold font-mono tabular-nums text-indigo-400">
                {t.semester_gpa.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {t.courses.length} courses completed
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
