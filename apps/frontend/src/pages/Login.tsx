import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../features/authentication/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Mail, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandLogo } from '../shared/components/ui';
import { PasswordField } from '../features/authentication/components/PasswordField';

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

  return (
    <div className="min-h-screen skx-grid-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" id="login-root">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <BrandLogo variant="full" className="h-24 w-56" />
        </motion.div>
        
        <h2 className="mt-6 text-center text-4xl skx-amharic-title">
          ወደ Nexus Academy ግባ
        </h2>
        <p className="mt-2 text-center font-display text-lg font-bold text-[#141414]">
          Sign in to Nexus Academy
        </p>
        <p className="mt-2 text-center text-sm text-[#5f5f5a]">
          Approved students can sign in after accepting their email invitation.
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
              <PasswordField
                id="password"
                label="Password"
                autoComplete="current-password"
                placeholder="Enter password"
                error={errors.password?.message}
                registration={register('password')}
              />
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

          <p className="mt-5 text-center text-sm text-[#5f5f5a]">
            New student?{' '}
            <Link to="/signup" className="font-semibold text-[#141414] underline underline-offset-4">
              Submit a signup request
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
