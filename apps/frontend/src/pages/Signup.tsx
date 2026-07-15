import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowUpRight, Loader2, Send } from 'lucide-react';
import { usePublicPrograms } from '../features/programs/api/programs';
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

export default function Signup() {
  const { data: programs = [], isLoading: programsLoading, isError: programsError } = usePublicPrograms();
  const createApplication = useCreateApplication();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    await createApplication.mutateAsync(values);
    setSubmitted(true);
  };

  const isProgramSelectDisabled = programsLoading || programsError || programs.length === 0 || submitted;

  return (
    <main className="min-h-screen skx-grid-bg px-4 py-10">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-[#d8d8d4] pb-6">
          <div className="flex items-start gap-3">
            <div className="skx-brand-mark h-11 w-11">S</div>
            <div>
              <p className="skx-page-label">Student Signup</p>
              <h1 className="mt-2 font-display text-4xl font-bold text-[#141414]">Sign up to Skilix</h1>
              <p className="mt-2 text-sm text-[#5f5f5a]">
                Choose a program and submit your details for admissions approval.
              </p>
            </div>
          </div>
          <Link to="/login" className="hidden sm:inline-flex skx-secondary-btn">
            Already approved? <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="skx-surface bg-white/90 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {submitted && (
            <p className="md:col-span-2 bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              Signup submitted. If approved, you will receive an email invitation to set your password and sign in.
            </p>
          )}
          {createApplication.error && (
            <p className="md:col-span-2 bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {createApplication.error.message}
            </p>
          )}
          {programsError && (
            <p className="md:col-span-2 bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              Program catalog is unavailable. Please try again shortly.
            </p>
          )}

          <input className="skx-field" placeholder="First name" disabled={submitted} {...register('first_name')} />
          <input className="skx-field" placeholder="Last name" disabled={submitted} {...register('last_name')} />
          <input className="skx-field" placeholder="Email" disabled={submitted} {...register('email')} />
          <input className="skx-field" placeholder="Phone" disabled={submitted} {...register('phone')} />
          <input className="skx-field" placeholder="Country" disabled={submitted} {...register('country')} />
          <input className="skx-field" placeholder="Experience level" disabled={submitted} {...register('experience')} />

          <select className="skx-field md:col-span-2" disabled={isProgramSelectDisabled} {...register('program_id')}>
            <option value="">
              {programsLoading ? 'Loading programs...' : programs.length === 0 ? 'No active programs available' : 'Select a program'}
            </option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>

          <textarea
            className="skx-field md:col-span-2 min-h-32"
            placeholder="Why do you want to join?"
            disabled={submitted}
            {...register('motivation')}
          />

          {Object.values(errors)[0] && (
            <p className="md:col-span-2 text-sm font-medium text-red-600">
              {Object.values(errors)[0]?.message?.toString()}
            </p>
          )}

          <button disabled={isSubmitting || submitted || programsLoading || programs.length === 0} className="skx-primary-btn md:col-span-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? 'Submitting...' : 'Submit signup'}
          </button>

          <Link to="/login" className="md:col-span-2 text-center text-sm font-semibold text-[#141414] underline underline-offset-4 sm:hidden">
            Already approved? Sign in
          </Link>
        </form>
      </section>
    </main>
  );
}
