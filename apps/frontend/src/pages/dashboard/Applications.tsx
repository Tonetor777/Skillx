import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useApplications, 
  useCreateApplication, 
  useApproveApplication, 
  useRejectApplication 
} from '../../features/applications/api/applications';
import { usePrograms } from '../../features/programs/api/programs';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';
import { 
  FileText, 
  Check, 
  X, 
  Eye, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  PlusCircle, 
  Compass,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const applicationSchema = z.object({
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters long' }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Must be a valid email address' }),
  program_id: z.string().min(1, { message: 'Must select a program' }),
  motivation: z.string().min(20, { message: 'Motivation details must be at least 20 characters' }),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function Applications() {
  const { user } = useAuth();
  
  // Guard clause using centralized helper
  if (!user || !can.approveApplications(user.role)) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl max-w-lg mx-auto text-center my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold">Access Restrict Guard</h3>
        <p className="text-sm mt-1">Teachers and Students do not possess administrative permissions to view or review student admissions applications.</p>
      </div>
    );
  }

  const { data: applications, isLoading, isError, error, refetch } = useApplications();
  const { data: programs } = usePrograms();
  const createApplicationMutation = useCreateApplication();
  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isSimulatingPublicForm, setIsSimulatingPublicForm] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      program_id: '',
      motivation: '',
    },
  });

  const onSimulateSubmit = async (data: ApplicationFormValues) => {
    try {
      await createApplicationMutation.mutateAsync(data);
      setIsSimulatingPublicForm(false);
      reset();
      triggerToast('Application simulated successfully. It is now in the pending queue!', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      setSelectedAppId(null);
      triggerToast('Application approved! An active student profile has been provisioned.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectMutation.mutateAsync(id);
      setSelectedAppId(null);
      triggerToast('Application rejected. Registry state updated.', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const triggerToast = (message: string, type: 'success' | 'info') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3500);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4" id="apps-loading-state">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Retrieving admissions applications pool...</p>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12" id="apps-error-state">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load Applications</h3>
        <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'Server returned an invalid state.'}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const selectedApp = applications?.find(a => a.id === selectedAppId);
  const isEmpty = !applications || applications.length === 0;

  return (
    <div className="space-y-8" id="applications-view-root">
      {/* Dynamic Notifications Toast */}
      {showToast && (
        <div className={`fixed top-20 right-6 z-50 rounded-lg p-4 shadow-xl flex items-center gap-3.5 border text-white ${
          showToast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-gray-800 border-gray-700'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{showToast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#d8d8d4] pb-6">
        <div>
          <p className="skx-page-label">Admissions Applications</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">የመግቢያ ማመልከቻዎች</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Admissions Applications</p>
          <p className="text-[#5f5f5a] text-sm mt-2">
            Review applicant profiles, motivation letters, and authorize bootcamp student profiles creation.
          </p>
        </div>
        <button
          onClick={() => setIsSimulatingPublicForm(true)}
          className="skx-secondary-btn"
          id="simulate-application-btn"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Simulate Public Apply Form
        </button>
      </div>

      {/* Application Detail Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl w-full shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">Review Candidate</span>
                <h3 className="font-bold text-xl text-gray-900 mt-0.5">
                  {selectedApp.first_name} {selectedApp.last_name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{selectedApp.email}</p>
              </div>
              <button 
                onClick={() => setSelectedAppId(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-md hover:bg-gray-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-gray-50 rounded-lg">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Selected Program:</span>
                <span className="text-sm font-semibold text-gray-800 block mt-1">{selectedApp.program_name}</span>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-lg">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Application Date:</span>
                <span className="text-sm font-semibold text-gray-800 block mt-1">
                  {new Date(selectedApp.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Statement of Motivation</span>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 leading-relaxed font-sans">{selectedApp.motivation}</p>
              </div>
            </div>

            {selectedApp.status === 'pending' ? (
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleReject(selectedApp.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 font-semibold rounded-lg text-sm transition-colors"
                >
                  <X className="w-4 h-4" /> Reject Admission
                </button>
                <button
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-colors shadow-xs"
                >
                  <Check className="w-4 h-4" /> Approve & Create Account
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-xs text-gray-400 block font-semibold">Admissions Verdict:</span>
                  <span className={`text-sm font-bold mt-1 inline-block capitalize ${
                    selectedApp.status === 'approved' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {selectedApp.status}
                  </span>
                </div>
                {selectedApp.reviewed_by_name && (
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Evaluated By:</span>
                    <span className="text-xs font-semibold text-gray-700 mt-1 block">
                      {selectedApp.reviewed_by_name} on {new Date(selectedApp.reviewed_at || '').toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Simulated Application Submission Form Overlay */}
      {isSimulatingPublicForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg w-full shadow-2xl"
          >
            <h3 className="font-sans font-bold text-lg text-gray-900 mb-1">Simulated Public Registration Form</h3>
            <p className="text-xs text-gray-500 mb-5">Submit a simulated candidate profile. It is captured here immediately for authorization.</p>

            <form onSubmit={handleSubmit(onSimulateSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">First Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    {...register('first_name')}
                  />
                  {errors.first_name && <span className="text-xs text-red-600 mt-1 block">{errors.first_name.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Last Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    {...register('last_name')}
                  />
                  {errors.last_name && <span className="text-xs text-red-600 mt-1 block">{errors.last_name.message}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="candidate@example.com"
                  {...register('email')}
                />
                {errors.email && <span className="text-xs text-red-600 mt-1 block">{errors.email.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Program Desired</label>
                <select
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  {...register('program_id')}
                >
                  <option value="">-- Choose Program --</option>
                  {programs?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.program_id && <span className="text-xs text-red-600 mt-1 block">{errors.program_id.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Why are you applying for this cohort?</label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Introduce yourself, your coding background, and professional goals (min 20 characters)."
                  {...register('motivation')}
                />
                {errors.motivation && <span className="text-xs text-red-600 mt-1 block">{errors.motivation.message}</span>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-5">
                <button
                  type="button"
                  onClick={() => setIsSimulatingPublicForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isEmpty ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50" id="apps-empty-state">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Applications found</h3>
          <p className="text-sm text-slate-500 mt-1">Use the simulator panel on the top right to generate admissions requests.</p>
        </div>
      ) : (
        /* Applications Table List */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" id="apps-data-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                  <th className="p-4 pl-6">Applicant Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Desired Program</th>
                  <th className="p-4">Date Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {applications.map((app) => {
                  const badgeStyles = {
                    pending: 'bg-amber-50 text-amber-700 border-amber-200',
                    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
                  };
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="p-4 pl-6 font-semibold text-slate-800 flex items-center gap-2.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        {app.first_name} {app.last_name}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{app.email}</td>
                      <td className="p-4 text-indigo-600 font-semibold">{app.program_name}</td>
                      <td className="p-4 text-xs text-slate-500 font-medium">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeStyles[app.status]}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-indigo-200 text-indigo-600 rounded-md text-xs font-bold uppercase tracking-wider ml-auto transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
