import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePrograms, useCreateProgram, useUpdateProgram, useArchiveProgram, useDeleteProgram } from '../../features/programs/api/programs';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';
import { CurriculumManager } from './Weeks';
import type { Program, Week } from '../../shared/types';
import { 
  BookOpen, 
  Plus, 
  ChevronRight, 
  ArrowLeft, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

const programSchema = z.object({
  name: z.string().min(4, { message: 'Program name must be at least 4 characters long' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  thumbnail: z.instanceof(FileList).optional(),
});

type ProgramFormValues = z.infer<typeof programSchema>;

export default function Programs() {
  const { user } = useAuth();
  const { data: programs, isLoading, isError, error, refetch } = usePrograms();
  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const archiveProgramMutation = useArchiveProgram();
  const deleteProgramMutation = useDeleteProgram();
  
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Program created successfully!');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailError, setThumbnailError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: ProgramFormValues) => {
    try {
      // Seed program with empty syllabus modules
      const prepWeeks: Week[] = [
        {
          number: 1,
          title: 'Foundation Module',
          objective: 'Core terminology, sandbox environment setup, and baseline diagnostics.',
          resources: [
            { id: 'res_init_doc', title: 'Welcome and Operations Playbook', type: 'document', url: 'https://example.com/welcome' }
          ]
        },
        {
          number: 2,
          title: 'Architecture & Specifications',
          objective: 'Design paradigms, core services mapping, and diagnostic testing.',
          resources: []
        }
      ];

      const payload = new FormData();
      payload.append('name', data.name);
      payload.append('description', data.description);
      payload.append('weeks', JSON.stringify(prepWeeks));
      if (data.thumbnail?.[0]) {
        payload.append('thumbnail', data.thumbnail[0]);
      }

      await createProgramMutation.mutateAsync(payload);

      setIsCreating(false);
      reset();
      setSuccessMessage('Program created successfully!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch {
      return;
    }
  };

  if (!user) return null;

  // Active program detail logic
  const selectedProgram = programs?.find(p => p.id === selectedProgramId);

  const handleArchiveProgram = async (programId: string) => {
    await archiveProgramMutation.mutateAsync(programId);
    setSelectedProgramId(null);
  };

  const handleDeleteProgram = async (program: Program) => {
    setDeleteError('');
    const confirmed = window.confirm(`Delete ${program.name}? This only works when the program has no cohorts, applications, or announcements.`);
    if (!confirmed) return;
    try {
      await deleteProgramMutation.mutateAsync(program.id);
      setSelectedProgramId(null);
      setSuccessMessage('Program deleted successfully.');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (deleteProgramError) {
      setDeleteError(deleteProgramError instanceof Error ? deleteProgramError.message : 'Program could not be deleted.');
    }
  };

  const handleThumbnailUpdate = async (program: Program) => {
    if (!thumbnailFile) {
      setThumbnailError('Choose a thumbnail image first.');
      return;
    }
    setThumbnailError('');
    const payload = new FormData();
    payload.append('name', program.name);
    payload.append('description', program.description);
    payload.append('weeks', JSON.stringify(program.weeks));
    payload.append('thumbnail', thumbnailFile);
    await updateProgramMutation.mutateAsync({ id: program.id, data: payload });
    setThumbnailFile(null);
    setSuccessMessage('Program thumbnail updated successfully.');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4" id="programs-loading-state">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Retrieving academic program registries...</p>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12" id="programs-error-state">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load Programs</h3>
        <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'A connection block occurred.'}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Handle detailed single view
  if (selectedProgram) {
    return (
      <div className="space-y-6" id="program-detail-view">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button 
            onClick={() => setSelectedProgramId(null)}
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </button>
          {can.managePrograms(user.role) && (
            <div className="flex flex-wrap justify-end gap-2">
              {selectedProgram.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => handleArchiveProgram(selectedProgram.id)}
                  disabled={archiveProgramMutation.isPending || deleteProgramMutation.isPending}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  Archive Program
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteProgram(selectedProgram)}
                disabled={archiveProgramMutation.isPending || deleteProgramMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Program
              </button>
            </div>
          )}
        </div>
        {deleteError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {deleteError}
          </div>
        )}

        {/* Program Header Jumbotron */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="w-full md:w-44 aspect-video border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
              {selectedProgram.thumbnail_url ? (
                <img src={selectedProgram.thumbnail_url} alt={selectedProgram.name} className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5.5 h-5.5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-sans font-bold text-gray-900 tracking-tight">{selectedProgram.name}</h1>
              </div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-3xl">
                {selectedProgram.description}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-gray-400 flex-wrap">
                <span>Created {new Date(selectedProgram.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Syllabus Modules: {selectedProgram.weeks.length}</span>
                <span>•</span>
                <span>Status: {selectedProgram.status}</span>
              </div>
            </div>
          </div>
          {can.managePrograms(user.role) && (
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Program Thumbnail</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  onChange={(event) => setThumbnailFile(event.currentTarget.files?.[0] ?? null)}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleThumbnailUpdate(selectedProgram)}
                  disabled={updateProgramMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {updateProgramMutation.isPending ? 'Uploading...' : 'Update Thumbnail'}
                </button>
              </div>
              {thumbnailError && <p className="mt-2 text-xs font-medium text-red-600">{thumbnailError}</p>}
              <p className="mt-2 text-xs text-slate-400">PNG, JPG, JPEG, or WEBP. Max 5MB.</p>
            </div>
          )}
        </div>
        {selectedProgram.cohorts && selectedProgram.cohorts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedProgram.cohorts.map((cohort) => (
              <div key={cohort.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-800">{cohort.name}</p>
                <p className="mt-1 text-xs text-slate-500">Week {cohort.current_week} • {cohort.students_count} students • {cohort.status}</p>
              </div>
            ))}
          </div>
        )}

        <section className="min-h-[calc(100vh-8rem)] space-y-4">
          <div>
            <p className="skx-page-label">Live Cohort Curriculum</p>
            <h2 className="mt-2 text-xl font-bold text-slate-800 font-sans tracking-tight">
              Week → Module → Lesson → Resources
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a cohort under this program and manage the structured curriculum students see.
            </p>
          </div>
          <CurriculumManager programId={selectedProgram.id} embedded />
        </section>
      </div>
    );
  }

  // 3. Empty State (if array is empty, which is rare due to seed, but checked for rule completeness)
  const isEmpty = !programs || programs.length === 0;

  return (
    <div className="space-y-8" id="programs-list-view">
      {/* Toast Alert Success notification */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white rounded-lg p-4 shadow-xl flex items-center gap-3.5 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-[#d8d8d4] pb-6">
        <div>
          <p className="skx-page-label">Academic Programs</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">የትምህርት ፕሮግራሞች</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Academic Programs</p>
          <p className="text-[#5f5f5a] text-sm mt-2">
            Browse currucula details, learning outcomes, and course modules.
          </p>
        </div>
        {can.managePrograms(user.role) && (
          <button
            onClick={() => setIsCreating(true)}
            className="skx-primary-btn"
            id="create-program-modal-btn"
          >
            <Plus className="w-4 h-4" />
            Add Program
          </button>
        )}
      </div>

      {/* Program Create Dialog Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg w-full shadow-2xl"
          >
            <h3 className="font-sans font-bold text-lg text-gray-900 mb-2">Create New Academic Program</h3>
            <p className="text-xs text-gray-500 mb-5">Define a parent program structure containing custom module weeks.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Program Name</label>
                <input
                  type="text"
                  className={`mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                    errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="e.g. AI Large Language Model Engineering"
                  {...register('name')}
                />
                {errors.name && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Detailed Description</label>
                <textarea
                  rows={4}
                  className={`mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                    errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Define scope, expected learning outcomes, technology stacks and prerequisite standards."
                  {...register('description')}
                />
                {errors.description && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.description.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Program Thumbnail</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm shadow-xs focus:border-indigo-500"
                  {...register('thumbnail')}
                />
                <p className="mt-1 text-xs text-gray-400">Optional image. PNG, JPG, JPEG, or WEBP. Max 5MB.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving program...' : 'Create Program'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isEmpty ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50" id="programs-empty-state">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Programs found</h3>
          <p className="text-sm text-slate-500 mt-1">Get started by building your first academic program container.</p>
          {can.managePrograms(user.role) && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-500 shadow-xs uppercase tracking-wider transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Program
            </button>
          )}
        </div>
      ) : (
        /* Programs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="programs-data-grid">
          {programs.map((program) => (
            <div 
              key={program.id} 
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                      {program.weeks.length} WEEKS
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 font-mono uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                      {program.status}
                    </span>
                  </div>
                </div>
                <h3 className="font-sans font-bold text-lg text-slate-800 tracking-tight">{program.name}</h3>
                <p className="text-slate-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                  {program.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Active Cohorts: {program.cohorts_count || 1}
                </span>
                <button
                  onClick={() => setSelectedProgramId(program.id)}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-500"
                >
                  View Curriculum
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
