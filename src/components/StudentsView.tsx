import React, { useState } from 'react';
import { Department, Student } from '../types/database.ts';
import { Search, Filter, Plus, ArrowUpDown, Trash2, Edit3, Eye, FileText, AlertCircle } from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  departments: Department[];
  onSelectStudent: (studentId: number) => void;
  onOpenAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: number) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  departments,
  onSelectStudent,
  onOpenAddStudent,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'gpa_desc' | 'gpa_asc' | 'name_asc' | 'id_asc' | 'credits_desc'>('gpa_desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Client-side filtering & sorting
  const filteredStudents = students
    .filter((s) => {
      const matchSearch =
        searchTerm === '' ||
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'all' || s.department_id === Number(selectedDept);
      const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'gpa_desc':
          return b.current_gpa - a.current_gpa;
        case 'gpa_asc':
          return a.current_gpa - b.current_gpa;
        case 'name_asc':
          return a.last_name.localeCompare(b.last_name);
        case 'id_asc':
          return a.student_id.localeCompare(b.student_id);
        case 'credits_desc':
          return b.total_credits - a.total_credits;
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-emerald-400';
      case 'Probation':
        return 'text-red-400';
      case 'On Leave':
        return 'text-amber-400';
      case 'Graduated':
        return 'text-sky-400';
      default:
        return 'text-slate-400';
    }
  };

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.8) return 'text-emerald-400 font-bold';
    if (gpa >= 3.5) return 'text-teal-300 font-semibold';
    if (gpa >= 2.5) return 'text-slate-200';
    return 'text-red-400 font-bold';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Student Directory & Records</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, manage, and inspect complete student academic performance profiles in SQLite.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddStudent}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID (e.g. STU-2023), or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Academic Standings</option>
              <option value="Active">Active</option>
              <option value="Probation">Academic Probation</option>
              <option value="On Leave">On Leave</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>
        </div>

        {/* Sort & Count Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-mono font-semibold text-white tabular-nums">{filteredStudents.length}</span>
            <span>of {students.length} student records</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="gpa_desc">Cumulative GPA (Highest first)</option>
              <option value="gpa_asc">Cumulative GPA (Lowest first)</option>
              <option value="name_asc">Student Name (A to Z)</option>
              <option value="id_asc">Student ID (Ascending)</option>
              <option value="credits_desc">Completed Credits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Grid */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No students match the current filter criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('all');
                setSelectedStatus('all');
              }}
              className="mt-3 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student ID</th>
                  <th className="py-3 px-4 font-semibold">Full Name & Contact</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Standing</th>
                  <th className="py-3 px-4 font-semibold text-right">Earned Credits</th>
                  <th className="py-3 px-4 font-semibold text-right">Cumulative GPA</th>
                  <th className="py-3 px-4 font-semibold">Faculty Advisor</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    {/* Student ID */}
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {student.student_id}
                    </td>

                    {/* Name & Contact */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{student.email}</span>
                        {student.phone && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{student.phone}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <span className="font-mono text-indigo-400 mr-1.5">{student.department_code}</span>
                      <span>{student.department_name}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`font-medium ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>
                    </td>

                    {/* Credits */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300 whitespace-nowrap">
                      {student.total_credits} cr
                    </td>

                    {/* GPA */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      <span className={`text-sm ${getGpaColor(student.current_gpa)}`}>
                        {student.current_gpa.toFixed(2)}
                      </span>
                    </td>

                    {/* Advisor */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {student.advisor}
                    </td>

                    {/* Row Actions */}
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectStudent(student.id)}
                          title="View Performance & Transcript"
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditStudent(student)}
                          title="Edit Student Info"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(student.id)}
                          title="Delete Student Record"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-lg bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Record Deletion</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this student? All associated course enrollments, grade records, and granular assessment data will be permanently deleted from SQLite via cascading relational constraints.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteStudent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
