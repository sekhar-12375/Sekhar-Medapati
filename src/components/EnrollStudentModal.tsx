import React, { useState, useEffect } from 'react';
import { AcademicTerm, Course, Student } from '../types/database.ts';
import { academicRepository } from '../services/academicRepository.ts';
import { X, UserCheck, Check } from 'lucide-react';

interface EnrollStudentModalProps {
  students: Student[];
  courses: Course[];
  terms: AcademicTerm[];
  initialStudentId?: number;
  initialCourseId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  students,
  courses,
  terms,
  initialStudentId,
  initialCourseId,
  onClose,
  onSuccess,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<number>(
    initialStudentId || students[0]?.id || 1
  );
  const [selectedCourseId, setSelectedCourseId] = useState<number>(
    initialCourseId || courses[0]?.id || 1
  );
  const [selectedTermId, setSelectedTermId] = useState<number>(
    terms.find((t) => t.is_active)?.id || terms[0]?.id || 1
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialStudentId) setSelectedStudentId(initialStudentId);
    if (initialCourseId) setSelectedCourseId(initialCourseId);
  }, [initialStudentId, initialCourseId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = academicRepository.enrollStudent(
      Number(selectedStudentId),
      Number(selectedCourseId),
      Number(selectedTermId)
    );

    if (!res.success) {
      setErrorMessage(
        res.error?.includes('UNIQUE')
          ? 'This student is already enrolled in this course for this academic term.'
          : res.error || 'Failed to complete course enrollment.'
      );
      return;
    }

    onSuccess();
    onClose();
  };

  const selectedStudent = students.find((s) => s.id === Number(selectedStudentId));
  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden my-6">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Enroll Student in Course</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Student Select */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Select Student *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_id} — {s.first_name} {s.last_name} ({s.department_code || 'Undergrad'})
                </option>
              ))}
            </select>
          </div>

          {/* Course Select */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Select Course *</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code}: {c.course_title} ({c.credits} cr · {c.instructor})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Term Select */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Academic Term *</label>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.term_name} {t.is_active ? '(Active Term)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Enrollment Summary Card */}
          {selectedStudent && selectedCourse && (
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded space-y-1 text-slate-400 text-[11px]">
              <div>
                Enrolling: <strong className="text-white">{selectedStudent.first_name} {selectedStudent.last_name}</strong>
              </div>
              <div>
                Course: <strong className="text-indigo-400">{selectedCourse.course_code}</strong> ({selectedCourse.credits} credit hours)
              </div>
              <div>Status: Initial state 'Enrolled', 100% attendance</div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-500 font-semibold rounded transition-colors flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Enrollment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
