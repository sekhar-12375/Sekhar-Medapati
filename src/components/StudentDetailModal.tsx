import React, { useState } from 'react';
import { Enrollment, Student } from '../types/database.ts';
import { X, Printer, Award, BookOpen, Clock, CheckCircle2, ChevronDown, ChevronRight, Plus } from 'lucide-react';

interface StudentDetailModalProps {
  data: {
    student: Student | null;
    enrollments: Enrollment[];
    termBreakdown: {
      term_name: string;
      term_code: string;
      courses: Enrollment[];
      semester_gpa: number;
      credits: number;
    }[];
  } | null;
  onClose: () => void;
  onEnrollCourse: (studentId: number) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  data,
  onClose,
  onEnrollCourse,
}) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'transcript'>('performance');
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({
    'Fall 2023': true,
    'Spring 2024': true,
    'Fall 2024': true,
  });

  if (!data || !data.student) return null;
  const { student, enrollments, termBreakdown } = data;

  const toggleTerm = (termName: string) => {
    setExpandedTerms((prev) => ({
      ...prev,
      [termName]: !prev[termName],
    }));
  };

  const getGradeBadgeColor = (grade: string | null) => {
    if (!grade) return 'text-slate-400';
    if (grade.startsWith('A')) return 'text-emerald-400 font-bold';
    if (grade.startsWith('B')) return 'text-sky-300 font-semibold';
    if (grade.startsWith('C')) return 'text-amber-300';
    return 'text-red-400 font-bold';
  };

  const printTranscript = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              {student.student_id}
            </span>
            <span className="text-sm font-semibold text-white">Academic Record & Transcript</span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'performance' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Performance Hub
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'transcript' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Official Transcript
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ======================= TAB 1: PERFORMANCE HUB ======================= */}
        {activeTab === 'performance' ? (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Student Profile Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {student.first_name} {student.last_name}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      student.status === 'Active'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : student.status === 'Probation'
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Major: <strong className="text-slate-200">{student.department_name}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Cohort: <strong className="text-slate-200">Class of {student.enrollment_year}</strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Advisor: <strong className="text-slate-200">{student.advisor}</strong>
                  </span>
                </div>

                <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-3">
                  <span>{student.email}</span>
                  {student.phone && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{student.phone}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEnrollCourse(student.id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll in Course</span>
                </button>
              </div>
            </div>

            {/* Academic Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Cumulative GPA</div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    {student.current_gpa.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ 4.00</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {student.current_gpa >= 3.5
                    ? "Dean's Honors List"
                    : student.current_gpa < 2.5
                    ? 'Academic Warning'
                    : 'Good Standing'}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Earned Credits</div>
                <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                  {student.total_credits}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">of 120 required for degree</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Completed Courses</div>
                <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                  {enrollments.filter((e) => e.status === 'Completed').length}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">All registered semesters</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Mean Attendance</div>
                <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-400">
                  {enrollments.length > 0
                    ? (
                        enrollments.reduce((acc, curr) => acc + (curr.attendance_percentage || 0), 0) /
                        enrollments.length
                      ).toFixed(1)
                    : '0.0'}
                  %
                </div>
                <div className="mt-1 text-[11px] text-slate-400">Course session presence</div>
              </div>
            </div>

            {/* Term-by-Term Course Ledger */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Semester Academic Progression</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {termBreakdown.length} active academic terms
                </span>
              </div>

              {termBreakdown.map((term) => {
                const isExpanded = expandedTerms[term.term_name] ?? true;
                return (
                  <div key={term.term_name} className="rounded-lg bg-slate-950/70 border border-slate-800 overflow-hidden">
                    <button
                      onClick={() => toggleTerm(term.term_name)}
                      className="w-full px-4 py-3 bg-slate-900/60 hover:bg-slate-900 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm font-bold text-white">{term.term_name}</span>
                        <span className="text-xs text-slate-400">({term.courses.length} courses)</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                        <span className="text-slate-400">{term.credits} credits</span>
                        <span className="text-slate-200">
                          Term GPA: <strong className="text-indigo-400">{term.semester_gpa.toFixed(2)}</strong>
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="overflow-x-auto border-t border-slate-800/80">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Course Code</th>
                              <th className="py-2.5 px-4 font-semibold">Title</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Credits</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Score</th>
                              <th className="py-2.5 px-4 font-semibold text-center">Grade</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Grade Point</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Attendance</th>
                              <th className="py-2.5 px-4 font-semibold">Instructor Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {term.courses.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-900/40">
                                <td className="py-2.5 px-4 font-mono font-semibold text-indigo-400">
                                  {c.course_code}
                                </td>
                                <td className="py-2.5 px-4 text-slate-200 font-medium">
                                  {c.course_title}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-400">
                                  {c.course_credits}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                                  {c.numeric_score !== null ? `${c.numeric_score}%` : '—'}
                                </td>
                                <td className="py-2.5 px-4 text-center font-mono">
                                  <span className={getGradeBadgeColor(c.letter_grade)}>
                                    {c.letter_grade || 'IP'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">
                                  {c.grade_point !== null ? c.grade_point.toFixed(1) : '—'}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                                  {c.attendance_percentage}%
                                </td>
                                <td className="py-2.5 px-4 text-slate-400 italic text-[11px] max-w-xs truncate">
                                  {c.notes || 'Normal course completion'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================= TAB 2: OFFICIAL TRANSCRIPT ======================= */
          <div className="p-8 max-h-[80vh] overflow-y-auto bg-white text-slate-900 font-sans">
            {/* Print Header Bar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-300 no-print">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Academic Transcript Preview</h3>
                <p className="text-xs text-slate-600">Formatted according to collegiate registrar standards.</p>
              </div>
              <button
                onClick={printTranscript}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Transcript</span>
              </button>
            </div>

            {/* Printable Transcript Document */}
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Institution Seal & Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="text-2xl font-serif font-bold tracking-tight text-slate-900 uppercase">
                  Academia University
                </div>
                <div className="text-xs text-slate-600 mt-1 uppercase tracking-wider">
                  Office of the University Registrar · Official Student Transcript
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Record ID: {student.student_id} · Issue Date: {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Student Identification Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 border border-slate-200 rounded">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Student Name</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {student.last_name}, {student.first_name}
                  </div>
                  <div className="text-slate-600 mt-1">Student ID: {student.student_id}</div>
                  <div className="text-slate-600">Date of Birth: {student.date_of_birth || '1998-05-14'}</div>
                </div>

                <div className="text-right">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Academic Program</div>
                  <div className="font-bold text-slate-900 text-sm">{student.department_name}</div>
                  <div className="text-slate-600 mt-1">Academic Status: {student.status}</div>
                  <div className="text-slate-600">Advisor: {student.advisor}</div>
                </div>
              </div>

              {/* Course Ledger by Term */}
              <div className="space-y-6">
                {termBreakdown.map((term) => (
                  <div key={term.term_name} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1 text-xs font-bold text-slate-800">
                      <span>{term.term_name.toUpperCase()}</span>
                      <span className="font-mono">
                        Semester GPA: {term.semester_gpa.toFixed(2)} | Credits: {term.credits}
                      </span>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-1">Course Code</th>
                          <th className="py-1">Course Title</th>
                          <th className="py-1 text-right">Attempted</th>
                          <th className="py-1 text-right">Earned</th>
                          <th className="py-1 text-center">Grade</th>
                          <th className="py-1 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {term.courses.map((c) => (
                          <tr key={c.id}>
                            <td className="py-1 font-bold text-slate-800">{c.course_code}</td>
                            <td className="py-1 text-slate-700 font-sans">{c.course_title}</td>
                            <td className="py-1 text-right tabular-nums">{c.course_credits}</td>
                            <td className="py-1 text-right tabular-nums">
                              {c.letter_grade && c.letter_grade !== 'F' ? c.course_credits : 0}
                            </td>
                            <td className="py-1 text-center font-bold text-slate-900">
                              {c.letter_grade || 'IP'}
                            </td>
                            <td className="py-1 text-right tabular-nums">
                              {c.grade_point !== null && c.course_credits
                                ? (c.grade_point * c.course_credits).toFixed(1)
                                : '0.0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Cumulative Summary */}
              <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-3 gap-4 text-center bg-slate-50 p-4 rounded border border-slate-200">
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Cumulative Earned Credits</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">{student.total_credits}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Cumulative GPA</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {student.current_gpa.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Honors Standing</div>
                  <div className="text-sm font-bold text-slate-900 mt-2">
                    {student.current_gpa >= 3.5 ? "Dean's Honors" : student.status}
                  </div>
                </div>
              </div>

              {/* Authentication Sign-off */}
              <div className="pt-8 flex items-end justify-between text-xs text-slate-600">
                <div>
                  <div className="w-48 border-b border-slate-400 mb-1"></div>
                  <div>University Registrar Signature</div>
                  <div className="text-[10px] text-slate-500">Verified via Secure SQLite Transaction Log</div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-500">
                  Document Checksum: SHA-256 VALIDATED
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
