export interface Department {
  id: number;
  code: string;
  name: string;
  faculty_head: string;
  building: string;
}

export interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: number;
  department_name?: string;
  department_code?: string;
  enrollment_year: number;
  status: 'Active' | 'On Leave' | 'Probation' | 'Graduated';
  avatar_url: string;
  date_of_birth: string;
  current_gpa: number;
  total_credits: number;
  advisor: string;
  created_at?: string;
}

export interface Course {
  id: number;
  course_code: string;
  course_title: string;
  department_id: number;
  department_code?: string;
  department_name?: string;
  credits: number;
  semester: string;
  instructor: string;
  max_capacity: number;
  enrolled_count?: number;
  syllabus_summary?: string;
}

export interface AcademicTerm {
  id: number;
  term_code: string;
  term_name: string;
  start_date: string;
  end_date: string;
  is_active: number;
}

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  term_id: number;
  letter_grade: string | null;
  grade_point: number | null;
  numeric_score: number | null;
  attendance_percentage: number;
  status: 'Enrolled' | 'Completed' | 'Dropped';
  notes?: string;
  // Joined fields
  student_name?: string;
  student_number?: string;
  course_code?: string;
  course_title?: string;
  course_credits?: number;
  instructor?: string;
  term_name?: string;
}

export interface Assessment {
  id: number;
  enrollment_id: number;
  title: string;
  type: 'Quiz' | 'Assignment' | 'Midterm' | 'Final' | 'Project';
  max_score: number;
  score_obtained: number;
  weight_percentage: number;
  assessment_date: string;
}

export interface AuditLog {
  id: number;
  action: string;
  table_name: string;
  record_id: string;
  details: string;
  timestamp: string;
}

export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface TableSchema {
  tableName: string;
  columns: TableColumn[];
  rowCount: number;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
  executionTimeMs: number;
  rowsAffected?: number;
  error?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'student';
  student_id: number | null;
  full_name: string;
  email: string;
  last_login?: string;
}

export interface AuthSession {
  user: User;
  studentData?: Student;
}
