import React from 'react';
import { AuthSession } from '../types/database.ts';
import { LogOut, User, ShieldCheck, GraduationCap } from 'lucide-react';

interface TopNavProps {
  currentTab: 'dashboard' | 'students' | 'courses' | 'performance' | 'sql-studio' | 'student-portal';
  onSelectTab: (tab: 'dashboard' | 'students' | 'courses' | 'performance' | 'sql-studio' | 'student-portal') => void;
  onOpenAddStudent: () => void;
  session: AuthSession | null;
  onSignOut: () => void;
  onOpenSignIn: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddStudent,
  session,
  onSignOut,
  onOpenSignIn,
}) => {
  const isAdmin = session?.user.role === 'admin';
  const isStudent = session?.user.role === 'student';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single element, no descriptor chips or status pills) */}
        <button
          onClick={() => onSelectTab(isStudent ? 'student-portal' : 'dashboard')}
          className="text-lg font-bold tracking-tight text-white hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 text-left focus:outline-none"
        >
          Academia SQLite
        </button>

        {/* Zone 2: 4-5 single-line clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {isStudent ? (
            <>
              <button
                onClick={() => onSelectTab('student-portal')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'student-portal'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                My Academic Portal
              </button>

              <button
                onClick={() => onSelectTab('courses')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'courses'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Course Catalog
              </button>

              <button
                onClick={() => onSelectTab('performance')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'performance'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Class Benchmarks
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'dashboard'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => onSelectTab('students')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'students'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Students
              </button>

              <button
                onClick={() => onSelectTab('courses')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'courses'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Courses & Grades
              </button>

              <button
                onClick={() => onSelectTab('performance')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'performance'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Academic Analytics
              </button>

              <button
                onClick={() => onSelectTab('sql-studio')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'sql-studio'
                    ? 'text-white border-b-2 border-indigo-500 pb-0.5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SQL Database Studio
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
                <span className="font-medium truncate max-w-[150px]">
                  {session.user.full_name}
                </span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">
                  {session.user.role}
                </span>
              </div>

              {isAdmin && (
                <button
                  onClick={onOpenAddStudent}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  + Enroll Student
                </button>
              )}

              <button
                onClick={onSignOut}
                title="Switch User / Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-300 hover:bg-slate-800 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenSignIn}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
