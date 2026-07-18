import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '../shared/api/client';
import { BrandLogo } from '../shared/components/ui';
import { PasswordField } from '../features/authentication/components/PasswordField';
import { passwordConfirmationSchema, type PasswordConfirmationValues } from '../features/authentication/passwordSchemas';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [message, setMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordConfirmationValues>({
    resolver: zodResolver(passwordConfirmationSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: PasswordConfirmationValues) => {
    setMessage(null);
    setApiError(null);
    try {
      await apiClient.post(`/invitations/${token}/accept/`, {
        password: values.password,
        confirm_password: values.confirmPassword,
      });
      setMessage('Invitation accepted. You can now sign in.');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to accept invitation.');
    }
  };

  return (
    <main className="min-h-screen skx-grid-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <section className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BrandLogo className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-center text-4xl skx-amharic-title">ግብዣውን ይቀበሉ</h1>
        <p className="mt-2 text-center font-display text-lg font-bold text-[#141414]">Accept invitation</p>
      </section>
      <section className="mt-8 sm:mx-auto sm:w-full sm:max-w-md skx-surface bg-white/90 py-8 px-6 sm:px-10">
        {message && <p className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {apiError && <p className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{apiError}</p>}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <PasswordField
            id="password"
            label="Set password"
            autoComplete="new-password"
            error={errors.password?.message}
            registration={register('password')}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            registration={register('confirmPassword')}
          />
          <button type="submit" disabled={isSubmitting || !token} className="skx-primary-btn w-full">
            {isSubmitting ? 'Accepting...' : 'Accept invitation'}
          </button>
        </form>
        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-[#141414] underline underline-offset-4">Back to sign in</Link>
      </section>
    </main>
  );
}
