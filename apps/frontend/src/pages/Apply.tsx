import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, Send } from 'lucide-react';
import { usePrograms } from '../features/programs/api/programs';
import { useCreateApplication } from '../features/applications/api/applications';

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(1, 'Phone is required'),
  country: z.string().min(1, 'Country is required'),
  experience: z.string().min(1, 'Experience is required'),
  program_id: z.string().min(1, 'Select a program'),
  motivation: z.string().min(20, 'Motivation must be at least 20 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function Apply() {
  const { data: programs = [] } = usePrograms();
  const createApplication = useCreateApplication();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    await createApplication.mutateAsync(values);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen skx-grid-bg px-4 py-10">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-[#d8d8d4] pb-6">
          <div className="flex items-start gap-3">
            <div className="skx-brand-mark h-11 w-11">
              S
            </div>
            <div>
              <p className="skx-page-label">Admissions</p>
              <h1 className="mt-2 text-4xl skx-amharic-title">ወደ Skilix ይመዝገቡ</h1>
              <p className="mt-1 font-display text-lg font-bold text-[#141414]">Apply to Skilix</p>
            </div>
          </div>
          <Link to="/login" className="hidden sm:inline-flex skx-secondary-btn">Already enrolled? <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="skx-surface bg-white/90 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {submitted && <p className="md:col-span-2 bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">Application submitted successfully.</p>}
          {createApplication.error && <p className="md:col-span-2 bg-red-50 border border-red-200 p-3 text-sm text-red-800">{createApplication.error.message}</p>}
          <input className="skx-field" placeholder="First name" {...register('first_name')} />
          <input className="skx-field" placeholder="Last name" {...register('last_name')} />
          <input className="skx-field" placeholder="Email" {...register('email')} />
          <input className="skx-field" placeholder="Phone" {...register('phone')} />
          <input className="skx-field" placeholder="Country" {...register('country')} />
          <input className="skx-field" placeholder="Experience level" {...register('experience')} />
          <select className="skx-field md:col-span-2" {...register('program_id')}>
            <option value="">Select a program</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
          <textarea className="skx-field md:col-span-2 min-h-32" placeholder="Why do you want to join?" {...register('motivation')} />
          {Object.values(errors)[0] && <p className="md:col-span-2 text-sm font-medium text-red-600">{Object.values(errors)[0]?.message?.toString()}</p>}
          <button disabled={isSubmitting} className="skx-primary-btn md:col-span-2">
            <Send className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit application'}
          </button>
        </form>
      </section>
    </main>
  );
}
