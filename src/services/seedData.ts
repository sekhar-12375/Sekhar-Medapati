export const INITIAL_SCHEMA_SQL = `
-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS academic_terms;
DROP TABLE IF EXISTS audit_logs;

-- Departments table
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  faculty_head TEXT NOT NULL,
  building TEXT NOT NULL
);

-- Academic terms table
CREATE TABLE academic_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term_code TEXT UNIQUE NOT NULL,
  term_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 0
);

-- Students master table
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  enrollment_year INTEGER NOT NULL,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'On Leave', 'Probation', 'Graduated')),
  avatar_url TEXT,
  date_of_birth TEXT,
  current_gpa REAL DEFAULT 0.0,
  total_credits INTEGER DEFAULT 0,
  advisor TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Courses catalog
CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT UNIQUE NOT NULL,
  course_title TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  credits INTEGER NOT NULL DEFAULT 3,
  semester TEXT NOT NULL,
  instructor TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 40,
  syllabus_summary TEXT
);

-- Student course enrollments & academic performance records
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  term_id INTEGER NOT NULL REFERENCES academic_terms(id),
  letter_grade TEXT CHECK(letter_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'IP', NULL)),
  grade_point REAL,
  numeric_score REAL,
  attendance_percentage REAL DEFAULT 95.0,
  status TEXT DEFAULT 'Enrolled' CHECK(status IN ('Enrolled', 'Completed', 'Dropped')),
  notes TEXT,
  UNIQUE(student_id, course_id, term_id)
);

-- Individual granular assessments (Midterms, Quizzes, Projects, Finals)
CREATE TABLE assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('Quiz', 'Assignment', 'Midterm', 'Final', 'Project')),
  max_score REAL NOT NULL DEFAULT 100,
  score_obtained REAL NOT NULL,
  weight_percentage REAL NOT NULL,
  assessment_date TEXT NOT NULL
);

-- Security and audit trail log
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  details TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);

-- User authentication accounts (Role-based access: admin vs student)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  last_login TEXT
);

-- Performance indexes
CREATE INDEX idx_students_dept ON students(department_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_term ON enrollments(term_id);
CREATE INDEX idx_assessments_enrollment ON assessments(enrollment_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_student ON users(student_id);
`;

export const INITIAL_SEED_DATA_SQL = `
-- Departments
INSERT INTO departments (id, code, name, faculty_head, building) VALUES
(1, 'CS', 'Computer Science & Engineering', 'Dr. Aris Thorne', 'Turing Science Hall - Rm 302'),
(2, 'EE', 'Electrical & Robotics Engineering', 'Dr. Elena Rostova', 'Tesla Hall - Rm 114'),
(3, 'DS', 'Data Science & Artificial Intelligence', 'Dr. Marcus Vance', 'Ada Lovelace Building - Rm 401'),
(4, 'BIO', 'Biomedical & Life Sciences', 'Dr. Sophia Sterling', 'Franklin Research Wing - Rm 210'),
(5, 'BUS', 'Business & Financial Analytics', 'Prof. David Chen', 'Hayek Commerce Center - Rm 505');

-- Academic Terms
INSERT INTO academic_terms (id, term_code, term_name, start_date, end_date, is_active) VALUES
(1, '2023-FALL', 'Fall 2023', '2023-09-01', '2023-12-20', 0),
(2, '2024-SPRING', 'Spring 2024', '2024-01-15', '2024-05-18', 0),
(3, '2024-FALL', 'Fall 2024', '2024-09-03', '2024-12-22', 1);

-- Courses
INSERT INTO courses (id, course_code, course_title, department_id, credits, semester, instructor, max_capacity, syllabus_summary) VALUES
(1, 'CS-101', 'Introduction to Relational Databases & SQL', 1, 4, 'Fall', 'Dr. Aris Thorne', 45, 'Relational calculus, SQL querying, normal forms, transaction ACID properties, and SQLite architecture.'),
(2, 'CS-204', 'Data Structures & Algorithmic Analysis', 1, 4, 'Spring', 'Prof. Sarah Lin', 40, 'Asymptotic notation, balanced trees, graph traversal, and dynamic programming.'),
(3, 'CS-310', 'Operating Systems & Concurrency', 1, 4, 'Fall', 'Dr. James Wilson', 35, 'Process scheduling, POSIX threads, virtual memory management, and file systems.'),
(4, 'DS-220', 'Applied Machine Learning & Statistical Inference', 3, 3, 'Fall', 'Dr. Marcus Vance', 40, 'Supervised classification, regularized linear models, regression trees, and ROC analysis.'),
(5, 'DS-301', 'Data Visualization & High-Dimensional Mining', 3, 3, 'Spring', 'Prof. Maya Patel', 35, 'Grammar of graphics, dimension reduction via PCA/t-SNE, and interactive dashboard engineering.'),
(6, 'EE-140', 'Digital Logic & Microcontroller Design', 2, 4, 'Fall', 'Dr. Elena Rostova', 30, 'Boolean algebra, combinational logic, Verilog HDL, and ARM cortex architecture.'),
(7, 'EE-280', 'Signals, Systems & Frequency Transformations', 2, 3, 'Spring', 'Dr. Robert Novak', 30, 'Continuous/discrete Fourier transforms, Laplace transforms, and digital filter synthesis.'),
(8, 'BIO-110', 'Molecular Biology & Bioinformatics', 4, 4, 'Fall', 'Dr. Sophia Sterling', 35, 'Genomic sequence alignment algorithms, protein structure modeling, and CRISPR pathways.'),
(9, 'BUS-205', 'Financial Modeling & Quantitative Risk', 5, 3, 'Spring', 'Prof. David Chen', 45, 'Discounted cash flows, portfolio optimization, Monte Carlo risk simulation, and capital budgeting.'),
(10, 'BUS-330', 'Strategic Operations & Supply Chain Analytics', 5, 3, 'Fall', 'Prof. Karen Brooks', 40, 'Queueing models, inventory control algorithms, and stochastic operations planning.');

-- Students
INSERT INTO students (id, student_id, first_name, last_name, email, phone, department_id, enrollment_year, status, date_of_birth, current_gpa, total_credits, advisor) VALUES
(1, 'STU-2023-0101', 'Alexander', 'Wright', 'a.wright@university.edu', '+1 (555) 234-8910', 1, 2023, 'Active', '2004-03-14', 3.92, 28, 'Dr. Aris Thorne'),
(2, 'STU-2023-0102', 'Claire', 'Delacroix', 'c.delacroix@university.edu', '+1 (555) 345-9012', 3, 2023, 'Active', '2004-07-22', 3.85, 27, 'Dr. Marcus Vance'),
(3, 'STU-2022-0045', 'Marcus', 'Aurelius Jr.', 'm.aurelius@university.edu', '+1 (555) 456-0123', 1, 2022, 'Active', '2003-11-05', 3.68, 56, 'Dr. Aris Thorne'),
(4, 'STU-2022-0089', 'Siddharth', 'Nair', 's.nair@university.edu', '+1 (555) 567-1234', 2, 2022, 'Active', '2003-09-18', 3.42, 54, 'Dr. Elena Rostova'),
(5, 'STU-2023-0145', 'Elena', 'Kowalska', 'e.kowalska@university.edu', '+1 (555) 678-2345', 4, 2023, 'Active', '2004-01-30', 3.75, 26, 'Dr. Sophia Sterling'),
(6, 'STU-2021-0012', 'Jordan', 'Banks', 'j.banks@university.edu', '+1 (555) 789-3456', 5, 2021, 'Graduated', '2002-05-12', 3.90, 120, 'Prof. David Chen'),
(7, 'STU-2023-0210', 'Zoe', 'Kaufman', 'z.kaufman@university.edu', '+1 (555) 890-4567', 1, 2023, 'Probation', '2004-08-09', 2.14, 20, 'Dr. Aris Thorne'),
(8, 'STU-2022-0114', 'Liam', 'O''Connor', 'l.oconnor@university.edu', '+1 (555) 901-5678', 3, 2022, 'Active', '2003-04-25', 3.55, 52, 'Dr. Marcus Vance'),
(9, 'STU-2023-0305', 'Hana', 'Takahashi', 'h.takahashi@university.edu', '+1 (555) 012-6789', 2, 2023, 'Active', '2004-12-03', 3.88, 28, 'Dr. Elena Rostova'),
(10, 'STU-2023-0188', 'Mateo', 'Morales', 'm.morales@university.edu', '+1 (555) 123-7890', 5, 2023, 'On Leave', '2004-06-17', 3.10, 22, 'Prof. David Chen'),
(11, 'STU-2024-0001', 'Amara', 'Okafor', 'a.okafor@university.edu', '+1 (555) 234-8901', 3, 2024, 'Active', '2005-02-14', 3.95, 14, 'Dr. Marcus Vance'),
(12, 'STU-2023-0299', 'Lucas', 'Mendez', 'l.mendez@university.edu', '+1 (555) 345-9011', 1, 2023, 'Probation', '2004-10-29', 2.30, 22, 'Dr. James Wilson');

-- Enrollments
INSERT INTO enrollments (id, student_id, course_id, term_id, letter_grade, grade_point, numeric_score, attendance_percentage, status, notes) VALUES
-- Alexander Wright (ID: 1)
(1, 1, 1, 1, 'A+', 4.0, 98.5, 98.0, 'Completed', 'Top exam score in CS-101 cohort'),
(2, 1, 2, 2, 'A', 4.0, 94.0, 96.0, 'Completed', 'Exceptional tree algorithm implementation'),
(3, 1, 3, 3, 'A', 4.0, 92.5, 94.0, 'Completed', 'Concurrency monitor lab with zero race condition'),
(4, 1, 4, 3, 'A-', 3.7, 89.0, 92.0, 'Completed', 'Solid linear classifier project'),

-- Claire Delacroix (ID: 2)
(5, 2, 1, 1, 'A', 4.0, 93.0, 97.0, 'Completed', 'Demonstrated thorough SQL index optimization'),
(6, 2, 4, 2, 'A', 4.0, 95.0, 98.0, 'Completed', 'Exemplary ensemble model performance'),
(7, 2, 5, 2, 'A-', 3.7, 88.5, 95.0, 'Completed', 'Interactive multidimensional dashboard'),
(8, 2, 2, 3, 'A', 4.0, 91.0, 96.0, 'Completed', 'High problem-solving throughput'),

-- Marcus Aurelius Jr. (ID: 3)
(9, 3, 1, 1, 'A-', 3.7, 88.0, 90.0, 'Completed', 'Consistent database normalization skills'),
(10, 3, 2, 1, 'B+', 3.3, 86.0, 88.0, 'Completed', 'Good understanding of asymptotic bounds'),
(11, 3, 3, 2, 'A', 4.0, 93.0, 95.0, 'Completed', 'Clean POSIX thread pool assignment'),
(12, 3, 4, 3, 'B+', 3.3, 85.5, 89.0, 'Completed', 'Accurate cross-validation report'),

-- Siddharth Nair (ID: 4)
(13, 4, 6, 1, 'A', 4.0, 92.0, 94.0, 'Completed', 'Flawless FPGA state machine design'),
(14, 4, 7, 2, 'B+', 3.3, 86.0, 91.0, 'Completed', 'Thorough discrete Fourier synthesis'),
(15, 4, 1, 2, 'B', 3.0, 81.0, 85.0, 'Completed', 'Completed all required SQL schema labs'),
(16, 4, 6, 3, 'A', 4.0, 94.0, 93.0, 'Completed', 'Advanced embedded microcontroller timer project'),

-- Elena Kowalska (ID: 5)
(17, 5, 8, 1, 'A', 4.0, 94.5, 96.0, 'Completed', 'Published genomic pipeline analysis'),
(18, 5, 4, 2, 'A-', 3.7, 89.5, 94.0, 'Completed', 'Applied random forests to gene expression data'),
(19, 5, 1, 3, 'A-', 3.7, 88.0, 91.0, 'Completed', 'Built NCBI sequence relational database'),

-- Jordan Banks (ID: 6) - Graduated
(20, 6, 9, 1, 'A', 4.0, 96.0, 98.0, 'Completed', 'Senior portfolio capstone'),
(21, 6, 10, 2, 'A', 4.0, 95.0, 97.0, 'Completed', 'Dynamic inventory queuing simulation'),

-- Zoe Kaufman (ID: 7) - Probation
(22, 7, 1, 1, 'C', 2.0, 72.0, 68.0, 'Completed', 'Frequent absences; struggled on subquery exam'),
(23, 7, 2, 2, 'D', 1.0, 64.0, 62.0, 'Completed', 'Late submissions on balanced trees project'),
(24, 7, 6, 3, 'C-', 1.7, 69.0, 70.0, 'Completed', 'Requires remedial lab tutoring for microcontrollers'),

-- Liam O'Connor (ID: 8)
(25, 8, 1, 1, 'A-', 3.7, 88.0, 92.0, 'Completed', 'Solid SQL database architecture skills'),
(26, 8, 4, 2, 'B+', 3.3, 86.0, 89.0, 'Completed', 'Gradient boosting model capstone'),
(27, 8, 5, 2, 'A', 4.0, 93.0, 94.0, 'Completed', 'High quality visualization rendering'),
(28, 8, 2, 3, 'B+', 3.3, 85.0, 90.0, 'Completed', 'Good algorithmic complexity grasp'),

-- Hana Takahashi (ID: 9)
(29, 9, 6, 1, 'A+', 4.0, 98.0, 99.0, 'Completed', 'Outstanding logic analyzer debugging'),
(30, 9, 7, 2, 'A', 4.0, 93.5, 96.0, 'Completed', 'Signal transformation lab excellence'),
(31, 9, 1, 3, 'A', 4.0, 92.0, 95.0, 'Completed', 'Relational database schema for telemetry'),

-- Mateo Morales (ID: 10) - On Leave
(32, 10, 9, 1, 'B', 3.0, 82.0, 88.0, 'Completed', 'Medical leave granted after semester 1'),

-- Amara Okafor (ID: 11) - Freshman Star
(33, 11, 1, 3, 'A+', 4.0, 99.0, 100.0, 'Completed', 'Perfect score on SQL join & subquery benchmarks'),
(34, 11, 4, 3, 'A', 4.0, 94.0, 97.0, 'Completed', 'Superior hyperparameter tuning on benchmark sets'),

-- Lucas Mendez (ID: 12) - Probation
(35, 12, 1, 1, 'C+', 2.3, 76.0, 72.0, 'Completed', 'Struggled with multi-table aggregate queries'),
(36, 12, 2, 2, 'C', 2.0, 71.0, 69.0, 'Completed', 'Deficient recursion memory profiling'),
(37, 12, 3, 3, 'C', 2.0, 70.0, 71.0, 'Completed', 'Deadlock detection assignment incomplete');

-- Assessments for key enrollments (showing granular test & assignment scores)
INSERT INTO assessments (enrollment_id, title, type, max_score, score_obtained, weight_percentage, assessment_date) VALUES
(1, 'Quiz 1: Relational Algebra & ER Modeling', 'Quiz', 100, 98, 10, '2023-09-20'),
(1, 'Midterm Examination: SQL Queries & DDL', 'Midterm', 100, 99, 30, '2023-10-25'),
(1, 'Project: High-Throughput SQLite Engine Design', 'Project', 100, 100, 25, '2023-11-28'),
(1, 'Final Examination: ACID & Indexing', 'Final', 100, 97, 35, '2023-12-18'),

(2, 'Quiz 1: Big-O Bounds & Amortized Analysis', 'Quiz', 100, 94, 10, '2024-02-12'),
(2, 'Midterm: Red-Black Trees & Heaps', 'Midterm', 100, 92, 30, '2024-03-22'),
(2, 'Project: Graph Routing Optimization', 'Project', 100, 96, 25, '2024-04-20'),
(2, 'Final Comprehensive Exam', 'Final', 100, 94, 35, '2024-05-15'),

(22, 'Quiz 1: SQL Basics', 'Quiz', 100, 75, 10, '2023-09-20'),
(22, 'Midterm Exam', 'Midterm', 100, 68, 30, '2023-10-25'),
(22, 'Term Database Schema Project', 'Project', 100, 76, 25, '2023-11-28'),
(22, 'Final Exam', 'Final', 100, 70, 35, '2023-12-18'),

(33, 'Quiz 1: Database Fundamentals', 'Quiz', 100, 100, 10, '2024-09-24'),
(33, 'Midterm Examination', 'Midterm', 100, 98, 30, '2024-10-28'),
(33, 'Enterprise Schema Project', 'Project', 100, 100, 25, '2024-11-30'),
(33, 'Final Examination', 'Final', 100, 98, 35, '2024-12-19');

-- Initial user authentication accounts (Admin and Students)
INSERT INTO users (id, username, password, role, student_id, full_name, email) VALUES
(1, 'admin', 'admin123', 'admin', NULL, 'Dr. Aris Thorne (Registrar Administrator)', 'admin@academia.edu'),
(2, 'alexander', 'student123', 'student', 1, 'Alexander Wright', 'a.wright@university.edu'),
(3, 'STU-2023-0101', 'student123', 'student', 1, 'Alexander Wright', 'a.wright@university.edu'),
(4, 'claire', 'student123', 'student', 2, 'Claire Delacroix', 'c.delacroix@university.edu'),
(5, 'STU-2023-0102', 'student123', 'student', 2, 'Claire Delacroix', 'c.delacroix@university.edu'),
(6, 'zoe', 'student123', 'student', 7, 'Zoe Kaufman', 'z.kaufman@university.edu'),
(7, 'STU-2023-0210', 'student123', 'student', 7, 'Zoe Kaufman', 'z.kaufman@university.edu'),
(8, 'amara', 'student123', 'student', 11, 'Amara Okafor', 'a.okafor@university.edu'),
(9, 'STU-2024-0001', 'student123', 'student', 11, 'Amara Okafor', 'a.okafor@university.edu'),
(10, 'student', 'student123', 'student', 1, 'Alexander Wright (Demo Student)', 'demo.student@university.edu');

-- Initial audit entry
INSERT INTO audit_logs (action, table_name, record_id, details) VALUES
('DATABASE_INITIALIZE', 'ALL', 'SYSTEM', 'SQLite database initialized with standard collegiate schema, user authentication, and student academic performance records.');
`;
