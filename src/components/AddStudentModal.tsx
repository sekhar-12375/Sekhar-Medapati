import React, { useState, useEffect } from 'react';
import { Department, Student } from '../types/database.ts';
import { academicRepository } from '../services/academicRepository.ts';
import { X, UserPlus, Check } from 'lucide-react';

interface AddStudentModalProps {
  departments: Department[];
  editStudent: Student | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  departments,
  editStudent,
  onClose,
  onSuccess,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState<number>(departments[0]?.id || 1);
  const [enrollmentYear, setEnrollmentYear] = useState<number>(2024);
  const [status, setStatus] = useState<'Active' | 'On Leave' | 'Probation' | 'Graduated'>('Active');
  const [dateOfBirth, setDateOfBirth] = useState('2004-05-15');
  const [advisor, setAdvisor] = useState('Dr. Aris Thorne');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editStudent) {
      setFirstName(editStudent.first_name);
      setLastName(editStudent.last_name);
      setStudentId(editStudent.student_id);
      setEmail(editStudent.email);
      setPhone(editStudent.phone || '');
      setDepartmentId(editStudent.department_id);
      setEnrollmentYear(editStudent.enrollment_year);
      setStatus(editStudent.status);
      setDateOfBirth(editStudent.date_of_birth || '2004-05-15');
      setAdvisor(editStudent.advisor);
    } else {
      // Auto-generate fresh student ID
      const randomId = Math.floor(1000 + Math.random() * 9000);
      setStudentId(`STU-2024-${randomId}`);
      if (departments.length > 0) {
        setDepartmentId(departments[0].id);
        setAdvisor(departments[0].faculty_head);
      }
    }
  }, [editStudent, departments]);

  const handleDepartmentChange = (deptId: number) => {
    setDepartmentId(deptId);
    const dept = departments.find((d) => d.id === deptId);
    if (dept && !editStudent) {
      setAdvisor(dept.faculty_head);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !studentId.trim() || !email.trim()) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (editStudent) {
      const res = academicRepository.updateStudent(editStudent.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department_id: departmentId,
        status,
        date_of_birth: dateOfBirth,
        advisor: advisor.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update student profile.');
        return;
      }
    } else {
      const res = academicRepository.createStudent({
        student_id: studentId.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department_id: departmentId,
        enrollment_year: Number(enrollmentYear),
        status,
        avatar_url: '',
        date_of_birth: dateOfBirth,
        advisor: advisor.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to register student into SQLite database.');
        return;
      }
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              {editStudent ? 'Edit Student Profile' : 'Enroll New Student'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Student ID & Cohort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Student ID *</label>
              <input
                type="text"
                required
                disabled={!!editStudent}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cohort Year</label>
              <input
                type="number"
                min="2018"
                max="2030"
                value={enrollmentYear}
                onChange={(e) => setEnrollmentYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alexander"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Wright"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">University Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="a.wright@university.edu"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 234-8910"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Department & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Department / Program</label>
              <select
                value={departmentId}
                onChange={(e) => handleDepartmentChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Academic Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Probation">Academic Probation</option>
                <option value="On Leave">On Leave</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          {/* Advisor & Birth Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Faculty Advisor</label>
              <input
                type="text"
                value={advisor}
                onChange={(e) => setAdvisor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
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
              <span>{editStudent ? 'Save Profile' : 'Enroll Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
