import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import apiClient from '../shared/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function RequestPasswordReset() {
  const [message, setMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    setApiError(null);
    try {
      const response = await apiClient.post('/auth/password-reset/request/', values);
      setMessage(response.detail);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to request a password reset.');
    }
  };

  return (
    <main className="min-h-screen skx-grid-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <section className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="skx-brand-mark h-12 w-12">
            S
          </div>
        </div>
        <h1 className="mt-6 text-center text-4xl skx-amharic-title">የይለፍ ቃል መቀየሪያ</h1>
        <p className="mt-2 text-center font-display text-lg font-bold text-[#141414]">Reset password</p>
      </section>
      <section className="mt-8 sm:mx-auto sm:w-full sm:max-w-md skx-surface bg-white/90 py-8 px-6 sm:px-10">
        {message && <p className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {apiError && <p className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{apiError}</p>}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="skx-field-label" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input id="email" type="email" className="skx-field pl-10" {...register('email')} />
          </div>
          {errors.email && <p className="text-xs font-medium text-red-600">{errors.email.message}</p>}
          <button type="submit" disabled={isSubmitting} className="skx-primary-btn w-full">
            {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>
        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-[#141414] underline underline-offset-4">Back to sign in</Link>
      </section>
    </main>
  );
}
