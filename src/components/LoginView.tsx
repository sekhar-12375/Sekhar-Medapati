import React, { useState } from 'react';
import { authService } from '../services/authService.ts';
import { AuthSession } from '../types/database.ts';
import { ShieldCheck, GraduationCap, Lock, User, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff, Check } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [roleTab, setRoleTab] = useState<'admin' | 'student'>('admin');
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = authService.getDemoAccounts();

  const handleRoleTabChange = (role: 'admin' | 'student') => {
    setRoleTab(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setIdentifier('admin');
      setPassword('admin123');
    } else {
      setIdentifier('STU-2023-0101');
      setPassword('student123');
    }
  };

  const handleQuickLogin = async (demo: { role: string; identifier: string; password: string }) => {
    setRoleTab(demo.role as any);
    setIdentifier(demo.identifier);
    setPassword(demo.password);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.login(demo.identifier, demo.password);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMessage(res.error || 'Authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.login(identifier, password);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMessage(res.error || 'Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    if (roleTab === 'admin') {
      setIdentifier('admin');
      setPassword('admin123');
    } else {
      setIdentifier('STU-2023-0101');
      setPassword('student123');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Lockup */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Academia SQLite SIS
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Student Information & Academic Performance Management
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8 shadow-2xl">
          {/* Role Segmented Tabs */}
          <div className="flex rounded-md bg-slate-950 p-1 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => handleRoleTabChange('admin')}
              className={`flex-1 py-2 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 ${
                roleTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('student')}
              className={`flex-1 py-2 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 ${
                roleTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </button>
          </div>

          {/* Role Specific Description & Quick Helper */}
          <div className="mb-4 p-3 rounded bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-300">
                {roleTab === 'admin' ? 'Administrator Login' : 'Student Login'}
              </span>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {roleTab === 'admin' ? 'admin / admin123' : 'STU-2023-0101 / student123'}
              </div>
            </div>
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline"
            >
              Auto-Fill
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {roleTab === 'admin' ? 'Administrator Username' : 'Student ID or Email'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    roleTab === 'admin'
                      ? 'admin'
                      : 'e.g. STU-2023-0101 or alexander'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In as {roleTab === 'admin' ? 'Administrator' : 'Student'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick 1-Click Demo Profiles */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-3">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>One-Click Instant Login Profiles</span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((demo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(demo)}
                  className="w-full text-left p-2.5 rounded-md bg-slate-950/60 hover:bg-slate-950 border border-slate-800/70 hover:border-slate-700 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                      <span>{demo.title}</span>
                      <span className="text-[10px] font-mono text-indigo-400/80 uppercase">
                        [{demo.role}]
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {demo.description}
                    </div>
                  </div>
                  <span className="text-xs text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    Log in &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Database Verification Note */}
        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Authenticated against SQLite relational credentials table</span>
        </div>
      </div>
    </div>
  );
};
