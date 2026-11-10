import React, { useState, useEffect, useCallback } from 'react';
import { sqliteService } from './services/sqliteService.ts';
import { academicRepository } from './services/academicRepository.ts';
import { authService } from './services/authService.ts';
import { AcademicTerm, AuthSession, Course, Department, Student } from './types/database.ts';
import { TopNav } from './components/TopNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { StudentsView } from './components/StudentsView.tsx';
import { CoursesView } from './components/CoursesView.tsx';
import { PerformanceView } from './components/PerformanceView.tsx';
import { SqlStudioView } from './components/SqlStudioView.tsx';
import { StudentPortalView } from './components/StudentPortalView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { StudentDetailModal } from './components/StudentDetailModal.tsx';
import { AddStudentModal } from './components/AddStudentModal.tsx';
import { AddCourseModal } from './components/AddCourseModal.tsx';
import { EnrollStudentModal } from './components/EnrollStudentModal.tsx';
import { CreateDatabaseModal } from './components/CreateDatabaseModal.tsx';
import { Database, ShieldCheck } from 'lucide-react';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'students' | 'courses' | 'performance' | 'sql-studio' | 'student-portal'
  >('dashboard');

  // Modals state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isEnrollStudentOpen, setIsEnrollStudentOpen] = useState(false);
  const [isCreateDbOpen, setIsCreateDbOpen] = useState(false);
  const [enrollInitialCourseId, setEnrollInitialCourseId] = useState<number | undefined>(undefined);
  const [enrollInitialStudentId, setEnrollInitialStudentId] = useState<number | undefined>(undefined);

  // Data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [sqliteStatus, setSqliteStatus] = useState({ isWasm: true, version: 'SQLite v3.x' });

  // Refresh reactive data from SQLite
  const refreshData = useCallback(() => {
    try {
      const depts = academicRepository.getDepartments();
      const trms = academicRepository.getAcademicTerms();
      const stds = academicRepository.getStudents();
      const crss = academicRepository.getCourses();
      const mtrcs = academicRepository.getDashboardMetrics();
      const st = sqliteService.getEngineStatus();

      setDepartments(depts);
      setTerms(trms);
      setStudents(stds);
      setCourses(crss);
      setMetrics(mtrcs);
      setSqliteStatus(st);
    } catch (err) {
      console.error('Error refreshing data from SQLite:', err);
    }
  }, []);

  useEffect(() => {
    let unsubscribeDb: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;

    sqliteService.ready().then(() => {
      sqliteService.ensureSchemaMigrations();
      refreshData();
      setIsReady(true);

      unsubscribeDb = sqliteService.subscribe(() => {
        refreshData();
      });

      // Restore session
      const savedSession = authService.getSession();
      if (savedSession) {
        setSession(savedSession);
        setCurrentTab(savedSession.user.role === 'student' ? 'student-portal' : 'dashboard');
      }

      unsubscribeAuth = authService.subscribe((newSession) => {
        setSession(newSession);
        if (newSession) {
          setCurrentTab(newSession.user.role === 'student' ? 'student-portal' : 'dashboard');
        }
      });
    });

    return () => {
      if (unsubscribeDb) unsubscribeDb();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [refreshData]);

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setIsAddStudentOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsAddStudentOpen(true);
  };

  const handleDeleteStudent = (studentId: number) => {
    academicRepository.deleteStudent(studentId);
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
  };

  const handleOpenEnrollStudent = (courseId?: number, studentId?: number) => {
    setEnrollInitialCourseId(courseId);
    setEnrollInitialStudentId(studentId);
    setIsEnrollStudentOpen(true);
  };

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setCurrentTab(newSession.user.role === 'student' ? 'student-portal' : 'dashboard');
  };

  const handleSignOut = () => {
    authService.logout();
    setSession(null);
  };

  // Selected student transcript & performance data for modal
  const selectedStudentData = selectedStudentId
    ? academicRepository.getStudentById(selectedStudentId)
    : null;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-400 font-sans">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono">Initializing SQLite WebAssembly Engine...</p>
      </div>
    );
  }

  // If not signed in, show clean dedicated Login Screen with Student and Admin login tabs
  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar strictly compliant with the Top Bar Contract */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddStudent={handleOpenAddStudent}
        session={session}
        onSignOut={handleSignOut}
        onOpenSignIn={() => setSession(null)}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-8">
        {/* STUDENT PORTAL VIEW */}
        {session.user.role === 'student' && currentTab === 'student-portal' && (
          <StudentPortalView
            session={session}
            onOpenTranscript={(sId) => setSelectedStudentId(sId)}
          />
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {currentTab === 'dashboard' && metrics && (
          <DashboardView
            metrics={metrics}
            sqliteStatus={sqliteStatus}
            onSelectStudent={setSelectedStudentId}
            onNavigateTab={setCurrentTab}
            onOpenAddStudent={handleOpenAddStudent}
            onOpenCreateDb={() => setIsCreateDbOpen(true)}
          />
        )}

        {/* ALL STUDENTS DIRECTORY */}
        {currentTab === 'students' && (
          <StudentsView
            students={students}
            departments={departments}
            onSelectStudent={setSelectedStudentId}
            onOpenAddStudent={handleOpenAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {/* COURSES CATALOG & GRADEBOOK */}
        {currentTab === 'courses' && (
          <CoursesView
            courses={courses}
            departments={departments}
            onOpenAddCourse={() => setIsAddCourseOpen(true)}
            onOpenEnrollStudent={handleOpenEnrollStudent}
          />
        )}

        {/* ACADEMIC ANALYTICS & PERFORMANCE */}
        {currentTab === 'performance' && metrics && (
          <PerformanceView
            students={students}
            departments={departments}
            deptStats={metrics.deptStats}
            gradeDistribution={metrics.gradeDistribution}
            onSelectStudent={setSelectedStudentId}
          />
        )}

        {/* SQL DATABASE STUDIO (ADMIN PRIVILEGE) */}
        {currentTab === 'sql-studio' && (
          <SqlStudioView onOpenCreateDb={() => setIsCreateDbOpen(true)} />
        )}
      </main>

      {/* Footer strictly anti-slop, clean and unboxed */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Academia SQLite SIS</span>
            <span aria-hidden="true">·</span>
            <span>Signed in as <strong className="text-slate-300 font-semibold">{session.user.full_name}</strong> ({session.user.role})</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-400 tabular-nums">{sqliteStatus.version}</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleSignOut}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign Out / Switch User
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedStudentId !== null && (
        <StudentDetailModal
          data={selectedStudentData}
          onClose={() => setSelectedStudentId(null)}
          onEnrollCourse={(sId) => handleOpenEnrollStudent(undefined, sId)}
        />
      )}

      {isAddStudentOpen && (
        <AddStudentModal
          departments={departments}
          editStudent={editingStudent}
          onClose={() => {
            setIsAddStudentOpen(false);
            setEditingStudent(null);
          }}
          onSuccess={refreshData}
        />
      )}

      {isAddCourseOpen && (
        <AddCourseModal
          departments={departments}
          onClose={() => setIsAddCourseOpen(false)}
          onSuccess={refreshData}
        />
      )}

      {isEnrollStudentOpen && (
        <EnrollStudentModal
          students={students}
          courses={courses}
          terms={terms}
          initialStudentId={enrollInitialStudentId}
          initialCourseId={enrollInitialCourseId}
          onClose={() => setIsEnrollStudentOpen(false)}
          onSuccess={refreshData}
        />
      )}

      {isCreateDbOpen && (
        <CreateDatabaseModal
          onClose={() => setIsCreateDbOpen(false)}
          onSuccess={() => {
            refreshData();
          }}
        />
      )}
    </div>
  );
}
