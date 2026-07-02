import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';
import apiClient from '../shared/api/client';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [message, setMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    setApiError(null);
    try {
      await apiClient.post(`/invitations/${token}/accept/`, values);
      setMessage('Invitation accepted. You can now sign in.');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to accept invitation.');
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
        <h1 className="mt-6 text-center text-4xl skx-amharic-title">ግብዣውን ይቀበሉ</h1>
        <p className="mt-2 text-center font-display text-lg font-bold text-[#141414]">Accept invitation</p>
      </section>
      <section className="mt-8 sm:mx-auto sm:w-full sm:max-w-md skx-surface bg-white/90 py-8 px-6 sm:px-10">
        {message && <p className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {apiError && <p className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{apiError}</p>}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="skx-field-label" htmlFor="password">Set password</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input id="password" type="password" className="skx-field pl-10" {...register('password')} />
          </div>
          {errors.password && <p className="text-xs font-medium text-red-600">{errors.password.message}</p>}
          <button type="submit" disabled={isSubmitting || !token} className="skx-primary-btn w-full">
            {isSubmitting ? 'Accepting...' : 'Accept invitation'}
          </button>
        </form>
        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-[#141414] underline underline-offset-4">Back to sign in</Link>
      </section>
    </main>
  );
}
