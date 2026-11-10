import React, { useState } from 'react';
import { Course, Department, Enrollment } from '../types/database.ts';
import { academicRepository } from '../services/academicRepository.ts';
import { BookOpen, Users, Plus, Check, Edit2, ArrowRight } from 'lucide-react';

interface CoursesViewProps {
  courses: Course[];
  departments: Department[];
  onOpenAddCourse: () => void;
  onOpenEnrollStudent: (courseId?: number) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  departments,
  onOpenAddCourse,
  onOpenEnrollStudent,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(courses[0]?.id || null);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [editGrade, setEditGrade] = useState<string>('A');
  const [editAttendance, setEditAttendance] = useState<number>(95);
  const [editNotes, setEditNotes] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const filteredCourses = courses.filter((c) => {
    return selectedDept === 'all' || c.department_id === Number(selectedDept);
  });

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const enrollments: Enrollment[] = selectedCourse
    ? academicRepository.getCourseEnrollments(selectedCourse.id)
    : [];

  const startEdit = (e: Enrollment) => {
    setEditingEnrollmentId(e.id);
    setEditScore(e.numeric_score || 0);
    setEditGrade(e.letter_grade || 'A');
    setEditAttendance(e.attendance_percentage || 95);
    setEditNotes(e.notes || '');
  };

  const gradePointMap: Record<string, number> = {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    D: 1.0,
    F: 0.0,
  };

  const handleSaveGrade = (enrollmentId: number) => {
    const gradePoint = gradePointMap[editGrade] ?? 3.0;
    const res = academicRepository.updateEnrollment(enrollmentId, {
      numeric_score: Number(editScore),
      letter_grade: editGrade,
      grade_point: gradePoint,
      attendance_percentage: Number(editAttendance),
      status: 'Completed',
      notes: editNotes,
    });

    if (res.success) {
      setEditingEnrollmentId(null);
      setSaveMessage('Grade and attendance updated in SQLite.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Courses & Gradebook Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Curriculum catalog, student roster, and inline academic performance grading.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenEnrollStudent(selectedCourse?.id)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>

          <button
            onClick={onOpenAddCourse}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main 2-Column Split: Course List on Left, Interactive Gradebook on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Course Selector List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Course Directory</h2>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredCourses.map((course) => {
              const isSelected = course.id === selectedCourseId;
              return (
                <button
                  key={course.id}
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setEditingEnrollmentId(null);
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {course.course_code}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      {course.credits} Credits · {course.semester}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mt-1.5 leading-snug">
                    {course.course_title}
                  </h3>

                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                    <span>{course.instructor}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {course.enrolled_count || 0} / {course.max_capacity} enrolled
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Course Gradebook Roster */}
        <div className="lg:col-span-7">
          {selectedCourse ? (
            <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 space-y-6">
              {/* Selected Course Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {selectedCourse.course_code}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedCourse.department_code} · {selectedCourse.credits} Credit Hours
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-2">{selectedCourse.course_title}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {selectedCourse.syllabus_summary || 'Standard collegiate curriculum and laboratory modules.'}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>Instructor: <strong className="text-slate-200">{selectedCourse.instructor}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Semester: <strong className="text-slate-200">{selectedCourse.semester}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Enrolled: <strong className="text-slate-200 font-mono tabular-nums">{enrollments.length}</strong></span>
                </div>
              </div>

              {/* Roster & Grade Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Course Gradebook & Attendance Ledger</h3>
                  <button
                    onClick={() => onOpenEnrollStudent(selectedCourse.id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    + Enroll Another Student
                  </button>
                </div>

                {enrollments.length === 0 ? (
                  <div className="py-12 text-center bg-slate-950/40 rounded-lg border border-slate-800/60">
                    <p className="text-xs text-slate-400">No students are currently enrolled in this course.</p>
                    <button
                      onClick={() => onOpenEnrollStudent(selectedCourse.id)}
                      className="mt-3 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Enroll First Student
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Student</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Score</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Grade</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Attendance</th>
                          <th className="py-2.5 px-3 font-semibold">Remarks</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {enrollments.map((enr) => {
                          const isEditing = editingEnrollmentId === enr.id;
                          return (
                            <tr key={enr.id} className="hover:bg-slate-800/30 transition-colors">
                              {/* Student Info */}
                              <td className="py-3 px-3">
                                <div className="font-medium text-white">{enr.student_name}</div>
                                <div className="font-mono text-[11px] text-slate-500">
                                  {enr.student_number}
                                </div>
                              </td>

                              {/* Numeric Score */}
                              <td className="py-3 px-3 text-right font-mono tabular-nums">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editScore}
                                    onChange={(e) => setEditScore(Number(e.target.value))}
                                    className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  <span className="text-slate-200">
                                    {enr.numeric_score !== null ? `${enr.numeric_score}%` : '—'}
                                  </span>
                                )}
                              </td>

                              {/* Letter Grade */}
                              <td className="py-3 px-3 text-center font-mono">
                                {isEditing ? (
                                  <select
                                    value={editGrade}
                                    onChange={(e) => setEditGrade(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="A+">A+ (4.0)</option>
                                    <option value="A">A (4.0)</option>
                                    <option value="A-">A- (3.7)</option>
                                    <option value="B+">B+ (3.3)</option>
                                    <option value="B">B (3.0)</option>
                                    <option value="B-">B- (2.7)</option>
                                    <option value="C+">C+ (2.3)</option>
                                    <option value="C">C (2.0)</option>
                                    <option value="C-">C- (1.7)</option>
                                    <option value="D">D (1.0)</option>
                                    <option value="F">F (0.0)</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`font-bold ${
                                      enr.letter_grade?.startsWith('A')
                                        ? 'text-emerald-400'
                                        : enr.letter_grade?.startsWith('B')
                                        ? 'text-sky-300'
                                        : enr.letter_grade?.startsWith('C')
                                        ? 'text-amber-300'
                                        : 'text-red-400'
                                    }`}
                                  >
                                    {enr.letter_grade || 'IP'}
                                  </span>
                                )}
                              </td>

                              {/* Attendance */}
                              <td className="py-3 px-3 text-right font-mono tabular-nums">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editAttendance}
                                    onChange={(e) => setEditAttendance(Number(e.target.value))}
                                    className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  <span className="text-slate-300">{enr.attendance_percentage}%</span>
                                )}
                              </td>

                              {/* Remarks */}
                              <td className="py-3 px-3 text-slate-400 max-w-[150px] truncate">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    placeholder="Add remarks..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                                  />
                                ) : (
                                  <span className="italic text-[11px]">{enr.notes || '—'}</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleSaveGrade(enr.id)}
                                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingEnrollmentId(null)}
                                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => startEdit(enr)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                                    title="Edit Grade & Attendance"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-sm">
              Select a course on the left to inspect enrolled students and record grades.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
