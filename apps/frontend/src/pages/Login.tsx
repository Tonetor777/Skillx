import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../features/authentication/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, KeyRound, Mail, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { motion } from 'motion/react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Invalid email or password combination.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-fill helpers for simple testing
  const handleFastLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'password');
    // Trigger submit instantly
    handleSubmit(onSubmit)();
  };

  const testAccounts = [
    { email: 'superadmin@skilix.com', label: 'Sarah Connor', role: 'Super Admin', color: 'border-red-200 hover:bg-red-50 text-red-700' },
    { email: 'admin@skilix.com', label: 'John Doe', role: 'Admin', color: 'border-blue-200 hover:bg-blue-50 text-blue-700' },
    { email: 'teacher@skilix.com', label: 'David Malan', role: 'Teacher', color: 'border-amber-200 hover:bg-amber-50 text-amber-700' },
    { email: 'student@skilix.com', label: 'Alex Mercer', role: 'Student', color: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div className="min-h-screen skx-grid-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" id="login-root">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="skx-brand-mark h-12 w-12 text-lg">
            S
          </div>
        </motion.div>
        
        <h2 className="mt-6 text-center text-4xl skx-amharic-title">
          ወደ Skilix ግባ
        </h2>
        <p className="mt-2 text-center font-display text-lg font-bold text-[#141414]">
          Sign in to Skilix
        </p>
        <p className="mt-2 text-center text-sm text-[#5f5f5a]">
          Advanced Cohort-based Learning Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="skx-surface bg-white/90 py-8 px-6 sm:px-10"
        >
          {apiError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-3.5 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="skx-field-label">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`skx-field pl-10 ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="name@organization.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium" id="email-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="skx-field-label">
                Password
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`skx-field pl-10 ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium" id="password-error">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/reset-password" className="text-sm font-semibold text-[#141414] underline underline-offset-4">
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="skx-primary-btn w-full"
              >
                {submitting ? 'Authenticating session...' : <>Sign In <ArrowUpRight className="h-4 w-4" /></>}
              </button>
            </div>
          </form>

          {/* Quick Sandbox Tester Accounts Panel */}
          <div className="mt-8 border-t border-[#d8d8d4] pt-6">
            <h3 className="skx-page-label text-center">
              Fast-Track Testing Accounts (Simulation Mode)
            </h3>
            <p className="text-[11px] text-[#737373] text-center mb-4 mt-2">
              Select any role to test custom permission controls & rule gates
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {testAccounts.map((account) => (
                <button
                  type="button"
                  key={account.email}
                  onClick={() => handleFastLogin(account.email)}
                  className={`p-2.5 border text-left transition-colors flex flex-col justify-between h-20 bg-white ${account.color}`}
                >
                  <span className="text-[11px] font-semibold uppercase opacity-75">{account.role}</span>
                  <div>
                    <span className="block text-xs font-bold text-gray-900">{account.label}</span>
                    <span className="block text-[10px] text-gray-500 truncate">{account.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
