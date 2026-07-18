import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import apiClient from '../shared/api/client';
import { BrandLogo } from '../shared/components/ui';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [failed, setFailed] = useState(false);
  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    const verify = async () => {
      try {
        await apiClient.post('/auth/email-verification/confirm/', { token });
        setMessage('Your email has been verified. You can now sign in.');
      } catch (error) {
        setFailed(true);
        setMessage(error instanceof Error ? error.message : 'Unable to verify email.');
      }
    };
    if (token) {
      verify();
    } else {
      setFailed(true);
      setMessage('Verification token is missing.');
    }
  }, [token]);

  return (
    <main className="min-h-screen skx-grid-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <section className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BrandLogo className="h-12 w-12" />
        </div>
        <div className="mt-8 skx-surface bg-white/90 py-8 px-6 sm:px-10 text-center">
          <MailCheck className={`mx-auto h-10 w-10 ${failed ? 'text-red-500' : 'text-emerald-500'}`} />
          <h1 className="mt-4 text-4xl skx-amharic-title">የኢሜይል ማረጋገጫ</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Email verification</p>
          <p className="mt-3 text-sm text-[#5f5f5a]">{message}</p>
          <Link to="/login" className="mt-6 skx-primary-btn">Go to sign in</Link>
        </div>
      </section>
    </main>
  );
}
