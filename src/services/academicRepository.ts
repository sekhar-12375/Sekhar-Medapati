import { sqliteService } from './sqliteService.ts';
import { AcademicTerm, Course, Department, Enrollment, Student } from '../types/database.ts';

export const academicRepository = {
  // --- Dashboard Metrics & Analytics ---
  getDashboardMetrics() {
    const totalStudentsRes = sqliteService.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM students WHERE status != "Graduated"'
    );
    const totalStudents = totalStudentsRes[0]?.count || 0;

    const avgGpaRes = sqliteService.query<{ avg_gpa: number }>(
      'SELECT AVG(current_gpa) as avg_gpa FROM students WHERE status IN ("Active", "Probation")'
    );
    const averageGpa = avgGpaRes[0]?.avg_gpa ? parseFloat(avgGpaRes[0].avg_gpa.toFixed(2)) : 0.0;

    const avgAttendanceRes = sqliteService.query<{ avg_att: number }>(
      'SELECT AVG(attendance_percentage) as avg_att FROM enrollments WHERE status = "Completed"'
    );
    const averageAttendance = avgAttendanceRes[0]?.avg_att ? parseFloat(avgAttendanceRes[0].avg_att.toFixed(1)) : 92.4;

    const totalCoursesRes = sqliteService.query<{ count: number }>('SELECT COUNT(*) as count FROM courses');
    const totalCourses = totalCoursesRes[0]?.count || 0;

    const atRiskRes = sqliteService.query<Student>(
      `SELECT s.*, d.name as department_name, d.code as department_code 
       FROM students s
       JOIN departments d ON s.department_id = d.id
       WHERE s.current_gpa < 2.5 OR s.status = 'Probation'
       ORDER BY s.current_gpa ASC`
    );

    // GPA Bracket distribution: [ <2.0 (Probation), 2.0-2.9 (Pass), 3.0-3.49 (Good), 3.5-4.0 (Dean's List) ]
    const gpaBrackets = [
      {
        label: 'Academic Warning (< 2.0)',
        range: '< 2.00',
        count: sqliteService.query<{ c: number }>('SELECT COUNT(*) as c FROM students WHERE current_gpa < 2.0')[0]?.c || 0,
        color: '#ef4444',
      },
      {
        label: 'Satisfactory (2.0 – 2.99)',
        range: '2.00 - 2.99',
        count: sqliteService.query<{ c: number }>('SELECT COUNT(*) as c FROM students WHERE current_gpa >= 2.0 AND current_gpa < 3.0')[0]?.c || 0,
        color: '#f59e0b',
      },
      {
        label: 'Good Standing (3.0 – 3.49)',
        range: '3.00 - 3.49',
        count: sqliteService.query<{ c: number }>('SELECT COUNT(*) as c FROM students WHERE current_gpa >= 3.0 AND current_gpa < 3.5')[0]?.c || 0,
        color: '#3b82f6',
      },
      {
        label: "Dean's Honors (3.5 – 4.0)",
        range: '3.50 - 4.00',
        count: sqliteService.query<{ c: number }>('SELECT COUNT(*) as c FROM students WHERE current_gpa >= 3.5')[0]?.c || 0,
        color: '#10b981',
      },
    ];

    // Department performance distribution
    const deptStats = sqliteService.query<{ code: string; name: string; student_count: number; avg_gpa: number }>(
      `SELECT d.code, d.name, COUNT(s.id) as student_count, AVG(s.current_gpa) as avg_gpa
       FROM departments d
       LEFT JOIN students s ON d.id = s.department_id
       GROUP BY d.id
       ORDER BY avg_gpa DESC`
    ).map((d) => ({
      ...d,
      avg_gpa: d.avg_gpa ? parseFloat(d.avg_gpa.toFixed(2)) : 0.0,
    }));

    // Grade letters distribution from all enrollments
    const gradeDistribution = sqliteService.query<{ grade: string; count: number }>(
      `SELECT letter_grade as grade, COUNT(*) as count 
       FROM enrollments 
       WHERE letter_grade IS NOT NULL 
       GROUP BY letter_grade 
       ORDER BY count DESC`
    );

    return {
      totalStudents,
      averageGpa,
      averageAttendance,
      totalCourses,
      atRiskStudents: atRiskRes,
      gpaBrackets,
      deptStats,
      gradeDistribution,
    };
  },

  // --- Students Management ---
  getStudents(options?: {
    search?: string;
    departmentId?: number | 'all';
    status?: string | 'all';
    sortBy?: 'gpa_desc' | 'gpa_asc' | 'name_asc' | 'id_asc' | 'credits_desc';
  }): Student[] {
    let sql = `
      SELECT s.*, d.name as department_name, d.code as department_code
      FROM students s
      JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.search) {
      sql += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?)`;
      const term = `%${options.search}%`;
      params.push(term, term, term, term);
    }

    if (options?.departmentId && options.departmentId !== 'all') {
      sql += ` AND s.department_id = ?`;
      params.push(options.departmentId);
    }

    if (options?.status && options.status !== 'all') {
      sql += ` AND s.status = ?`;
      params.push(options.status);
    }

    switch (options?.sortBy) {
      case 'gpa_asc':
        sql += ` ORDER BY s.current_gpa ASC`;
        break;
      case 'name_asc':
        sql += ` ORDER BY s.last_name ASC, s.first_name ASC`;
        break;
      case 'id_asc':
        sql += ` ORDER BY s.student_id ASC`;
        break;
      case 'credits_desc':
        sql += ` ORDER BY s.total_credits DESC`;
        break;
      case 'gpa_desc':
      default:
        sql += ` ORDER BY s.current_gpa DESC`;
        break;
    }

    return sqliteService.query<Student>(sql, params);
  },

  getStudentById(id: number): {
    student: Student | null;
    enrollments: Enrollment[];
    termBreakdown: { term_name: string; term_code: string; courses: Enrollment[]; semester_gpa: number; credits: number }[];
  } {
    const students = sqliteService.query<Student>(
      `SELECT s.*, d.name as department_name, d.code as department_code, d.building
       FROM students s
       JOIN departments d ON s.department_id = d.id
       WHERE s.id = ?`,
      [id]
    );

    if (students.length === 0) {
      return { student: null, enrollments: [], termBreakdown: [] };
    }

    const student = students[0];

    const enrollments = sqliteService.query<Enrollment>(
      `SELECT e.*, c.course_code, c.course_title, c.credits as course_credits, c.instructor, t.term_name, t.term_code
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN academic_terms t ON e.term_id = t.id
       WHERE e.student_id = ?
       ORDER BY t.start_date ASC, c.course_code ASC`,
      [id]
    );

    // Group by terms and calculate semester GPA
    const termMap = new Map<string, { term_name: string; term_code: string; courses: Enrollment[]; totalWeight: number; totalCredits: number }>();
    for (const e of enrollments) {
      const termKey = e.term_name || 'General';
      if (!termMap.has(termKey)) {
        termMap.set(termKey, {
          term_name: termKey,
          term_code: (e as any).term_code || '',
          courses: [],
          totalWeight: 0,
          totalCredits: 0,
        });
      }
      const group = termMap.get(termKey)!;
      group.courses.push(e);
      if (e.grade_point !== null && e.grade_point !== undefined && e.course_credits) {
        group.totalWeight += e.grade_point * e.course_credits;
        group.totalCredits += e.course_credits;
      }
    }

    const termBreakdown = Array.from(termMap.values()).map((g) => ({
      term_name: g.term_name,
      term_code: g.term_code,
      courses: g.courses,
      credits: g.totalCredits,
      semester_gpa: g.totalCredits > 0 ? parseFloat((g.totalWeight / g.totalCredits).toFixed(2)) : 0.0,
    }));

    return { student, enrollments, termBreakdown };
  },

  createStudent(data: Omit<Student, 'id' | 'current_gpa' | 'total_credits'>): { success: boolean; id?: number; error?: string } {
    const res = sqliteService.run(
      `INSERT INTO students (student_id, first_name, last_name, email, phone, department_id, enrollment_year, status, date_of_birth, advisor, current_gpa, total_credits)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0)`,
      [
        data.student_id,
        data.first_name,
        data.last_name,
        data.email,
        data.phone || '',
        data.department_id,
        data.enrollment_year,
        data.status || 'Active',
        data.date_of_birth || '',
        data.advisor || 'Assigned Faculty',
      ]
    );

    if (res.success) {
      sqliteService.logAudit(
        'INSERT',
        'students',
        data.student_id,
        `Enrolled student ${data.first_name} ${data.last_name} into department #${data.department_id}`
      );
    }
    return res;
  },

  updateStudent(id: number, data: Partial<Student>): { success: boolean; error?: string } {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.first_name !== undefined) { fields.push('first_name = ?'); values.push(data.first_name); }
    if (data.last_name !== undefined) { fields.push('last_name = ?'); values.push(data.last_name); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.department_id !== undefined) { fields.push('department_id = ?'); values.push(data.department_id); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.advisor !== undefined) { fields.push('advisor = ?'); values.push(data.advisor); }
    if (data.date_of_birth !== undefined) { fields.push('date_of_birth = ?'); values.push(data.date_of_birth); }

    if (fields.length === 0) return { success: true };

    values.push(id);
    const sql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
    const res = sqliteService.run(sql, values);

    if (res.success) {
      sqliteService.logAudit('UPDATE', 'students', String(id), `Updated student profile information.`);
    }
    return res;
  },

  deleteStudent(id: number): { success: boolean; error?: string } {
    // Audit before delete
    const student = sqliteService.query<Student>('SELECT student_id, first_name, last_name FROM students WHERE id = ?', [id]);
    const identifier = student[0]?.student_id || String(id);

    // Delete enrollments and assessments cascaded
    sqliteService.run('DELETE FROM assessments WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id = ?)', [id]);
    sqliteService.run('DELETE FROM enrollments WHERE student_id = ?', [id]);
    const res = sqliteService.run('DELETE FROM students WHERE id = ?', [id]);

    if (res.success) {
      sqliteService.logAudit('DELETE', 'students', identifier, `Deleted student profile and academic history.`);
    }
    return res;
  },

  // --- Courses & Gradebook Management ---
  getCourses(departmentId?: number | 'all'): Course[] {
    let sql = `
      SELECT c.*, d.name as department_name, d.code as department_code,
             COUNT(e.id) as enrolled_count
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN enrollments e ON c.id = e.course_id
    `;
    const params: any[] = [];
    if (departmentId && departmentId !== 'all') {
      sql += ' WHERE c.department_id = ?';
      params.push(departmentId);
    }
    sql += ' GROUP BY c.id ORDER BY c.course_code ASC';
    return sqliteService.query<Course>(sql, params);
  },

  getCourseEnrollments(courseId: number): Enrollment[] {
    return sqliteService.query<Enrollment>(
      `SELECT e.*, s.student_id as student_number, (s.first_name || ' ' || s.last_name) as student_name, s.current_gpa, t.term_name
       FROM enrollments e
       JOIN students s ON e.student_id = s.id
       JOIN academic_terms t ON e.term_id = t.id
       WHERE e.course_id = ?
       ORDER BY s.last_name ASC, s.first_name ASC`,
      [courseId]
    );
  },

  updateEnrollment(enrollmentId: number, data: {
    letter_grade?: string;
    grade_point?: number;
    numeric_score?: number;
    attendance_percentage?: number;
    status?: 'Enrolled' | 'Completed' | 'Dropped';
    notes?: string;
  }): { success: boolean; error?: string } {
    const res = sqliteService.run(
      `UPDATE enrollments 
       SET letter_grade = ?, grade_point = ?, numeric_score = ?, attendance_percentage = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        data.letter_grade ?? null,
        data.grade_point ?? null,
        data.numeric_score ?? null,
        data.attendance_percentage ?? 95.0,
        data.status ?? 'Completed',
        data.notes ?? '',
        enrollmentId,
      ]
    );

    if (res.success) {
      sqliteService.logAudit(
        'GRADE_UPDATE',
        'enrollments',
        String(enrollmentId),
        `Updated grade to ${data.letter_grade || 'None'} (${data.numeric_score ?? '-'}%) and attendance to ${data.attendance_percentage}%`
      );
    }
    return res;
  },

  createCourse(course: {
    course_code: string;
    course_title: string;
    department_id: number;
    credits: number;
    semester: string;
    instructor: string;
    max_capacity: number;
    syllabus_summary?: string;
  }): { success: boolean; id?: number; error?: string } {
    const res = sqliteService.run(
      `INSERT INTO courses (course_code, course_title, department_id, credits, semester, instructor, max_capacity, syllabus_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course.course_code,
        course.course_title,
        course.department_id,
        course.credits,
        course.semester,
        course.instructor,
        course.max_capacity,
        course.syllabus_summary || '',
      ]
    );

    if (res.success) {
      sqliteService.logAudit('INSERT', 'courses', course.course_code, `Added course ${course.course_code}: ${course.course_title}`);
    }
    return res;
  },

  enrollStudent(studentId: number, courseId: number, termId: number): { success: boolean; error?: string } {
    const res = sqliteService.run(
      `INSERT INTO enrollments (student_id, course_id, term_id, status, attendance_percentage)
       VALUES (?, ?, ?, 'Enrolled', 100.0)`,
      [studentId, courseId, termId]
    );

    if (res.success) {
      sqliteService.logAudit('ENROLLMENT', 'enrollments', `S${studentId}-C${courseId}`, `Enrolled student into course`);
    }
    return res;
  },

  // --- Reference Lookups ---
  getDepartments(): Department[] {
    return sqliteService.query<Department>('SELECT * FROM departments ORDER BY name ASC');
  },

  getAcademicTerms(): AcademicTerm[] {
    return sqliteService.query<AcademicTerm>('SELECT * FROM academic_terms ORDER BY start_date DESC');
  },
};
