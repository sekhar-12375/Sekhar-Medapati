import { sqliteService } from './sqliteService.ts';
import { AuthSession, Student, User } from '../types/database.ts';

const SESSION_STORAGE_KEY = 'academia_auth_session_v1';

class AuthService {
  private currentSession: AuthSession | null = null;
  private authListeners: Set<(session: AuthSession | null) => void> = new Set();

  constructor() {
    this.restoreSession();
  }

  public subscribe(listener: (session: AuthSession | null) => void): () => void {
    this.authListeners.add(listener);
    return () => {
      this.authListeners.delete(listener);
    };
  }

  private notify(): void {
    this.authListeners.forEach((l) => {
      try {
        l(this.currentSession);
      } catch (e) {
        console.error(e);
      }
    });
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch {
      this.currentSession = null;
    }
  }

  public getSession(): AuthSession | null {
    if (!this.currentSession) {
      this.restoreSession();
    }
    return this.currentSession;
  }

  public login(
    identifier: string,
    password: string
  ): { success: boolean; session?: AuthSession; error?: string } {
    const trimmedId = identifier.trim();
    const trimmedPass = password.trim();

    if (!trimmedId || !trimmedPass) {
      return { success: false, error: 'Please enter both username/ID and password.' };
    }

    try {
      // 1. Try checking the users table
      const users = sqliteService.query<User & { student_number?: string }>(
        `SELECT u.*, s.student_id as student_number
         FROM users u
         LEFT JOIN students s ON u.student_id = s.id
         WHERE (u.username = ? COLLATE NOCASE OR u.email = ? COLLATE NOCASE OR s.student_id = ? COLLATE NOCASE)
           AND u.password = ?`,
        [trimmedId, trimmedId, trimmedId, trimmedPass]
      );

      if (users.length > 0) {
        const user = users[0];
        let studentData: Student | undefined = undefined;

        if (user.role === 'student' && user.student_id) {
          const stdRes = sqliteService.query<Student>(
            `SELECT s.*, d.name as department_name, d.code as department_code 
             FROM students s 
             JOIN departments d ON s.department_id = d.id 
             WHERE s.id = ?`,
            [user.student_id]
          );
          if (stdRes.length > 0) {
            studentData = stdRes[0];
          }
        }

        // Update last login
        sqliteService.run(
          `UPDATE users SET last_login = datetime('now') WHERE id = ?`,
          [user.id]
        );

        sqliteService.logAudit(
          'USER_LOGIN',
          'users',
          String(user.id),
          `Logged in as ${user.role}: ${user.username}`
        );

        const session: AuthSession = { user, studentData };
        this.currentSession = session;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        this.notify();
        return { success: true, session };
      }

      // 2. Direct student ID login fallback (e.g. any student in students table using their ID and password "student123")
      const studentMatch = sqliteService.query<Student>(
        `SELECT s.*, d.name as department_name, d.code as department_code
         FROM students s
         JOIN departments d ON s.department_id = d.id
         WHERE s.student_id = ? COLLATE NOCASE OR s.email = ? COLLATE NOCASE`,
        [trimmedId, trimmedId]
      );

      if (studentMatch.length > 0 && trimmedPass === 'student123') {
        const student = studentMatch[0];
        const user: User = {
          id: 100 + student.id,
          username: student.student_id,
          role: 'student',
          student_id: student.id,
          full_name: `${student.first_name} ${student.last_name}`,
          email: student.email,
        };

        const session: AuthSession = { user, studentData: student };
        this.currentSession = session;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        this.notify();
        return { success: true, session };
      }

      return {
        success: false,
        error: 'Invalid credentials. Check your username/Student ID and password.',
      };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err?.message || 'Database error occurred during login.' };
    }
  }

  public logout(): void {
    if (this.currentSession) {
      sqliteService.logAudit(
        'USER_LOGOUT',
        'users',
        String(this.currentSession.user.id),
        `User ${this.currentSession.user.username} logged out.`
      );
    }
    this.currentSession = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.notify();
  }

  public getDemoAccounts() {
    return [
      {
        role: 'admin',
        title: 'Registrar Administrator',
        identifier: 'admin',
        password: 'admin123',
        description: 'Full institutional management, grade editing, analytics, and SQL Studio.',
      },
      {
        role: 'student',
        title: 'Alexander Wright (Honors Student)',
        identifier: 'STU-2023-0101',
        password: 'student123',
        description: 'Cumulative GPA: 3.92 · Dean’s Honors List · Computer Science.',
      },
      {
        role: 'student',
        title: 'Zoe Kaufman (Academic Probation)',
        identifier: 'STU-2023-0210',
        password: 'student123',
        description: 'Cumulative GPA: 2.14 · Academic Warning Alert · Advising Required.',
      },
      {
        role: 'student',
        title: 'Amara Okafor (Freshman Achiever)',
        identifier: 'STU-2024-0001',
        password: 'student123',
        description: 'Cumulative GPA: 3.95 · Data Science & Artificial Intelligence.',
      },
    ];
  }
}

export const authService = new AuthService();
