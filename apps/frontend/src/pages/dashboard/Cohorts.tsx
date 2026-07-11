import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCohorts, useCreateCohort, useUpdateCohort } from '../../features/cohorts/api/cohorts';
import { useCreateTeacherAssignment, useDeleteTeacherAssignment, useTeacherAssignments } from '../../features/cohorts/api/teacher-assignments';
import { usePrograms } from '../../features/programs/api/programs';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';
import { 
  Users, 
  Plus, 
  ChevronRight, 
  ArrowLeft, 
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserCheck,
  Check,
  Activity,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Cohort } from '../../shared/types';

const cohortSchema = z.object({
  name: z.string().min(4, { message: 'Cohort name must be at least 4 characters long' }),
  program_id: z.string().min(1, { message: 'You must select a program' }),
  start_date: z.string().min(1, { message: 'Start date is required' }),
  end_date: z.string().min(1, { message: 'End date is required' }),
  is_active: z.boolean(),
});

type CohortFormValues = z.infer<typeof cohortSchema>;

export default function Cohorts() {
  const { user } = useAuth();
  const canManageCohorts = user ? can.manageCohorts(user.role) : false;
  const { data: cohorts, isLoading, isError, error, refetch } = useCohorts();
  const { data: programs } = usePrograms();
  const createCohortMutation = useCreateCohort();
  const updateCohortMutation = useUpdateCohort();
  const { data: teacherAssignments = [] } = useTeacherAssignments(canManageCohorts);
  const createTeacherAssignment = useCreateTeacherAssignment();
  const deleteTeacherAssignment = useDeleteTeacherAssignment();

  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [teacherRole, setTeacherRole] = useState<'LEAD' | 'ASSISTANT' | 'MENTOR'>('LEAD');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CohortFormValues>({
    resolver: zodResolver(cohortSchema),
    defaultValues: {
      name: '',
      program_id: '',
      start_date: '',
      end_date: '',
      is_active: true,
    },
  });

  const onSubmit = async (data: CohortFormValues) => {
    try {
      await createCohortMutation.mutateAsync({
        name: data.name,
        program_id: data.program_id,
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: data.is_active,
      });

      setIsCreating(false);
      reset();
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch {
      return;
    }
  };

  if (!user) return null;

  const selectedCohort = cohorts?.find(c => c.id === selectedCohortId);

  const handleUpdateSelectedCohort = async (data: Partial<Cohort>) => {
    if (!selectedCohort) return;
    await updateCohortMutation.mutateAsync({ id: selectedCohort.id, data });
  };

  const selectedTeacherAssignments = selectedCohort
    ? teacherAssignments.filter((assignment) => assignment.cohort_id === selectedCohort.id)
    : [];

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4" id="cohorts-loading-state">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Retrieving academic cohorts registries...</p>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12" id="cohorts-error-state">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load Cohorts</h3>
        <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'A network blockade was encountered.'}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Detailed Cohort Subview
  if (selectedCohort) {
    return (
      <div className="space-y-6" id="cohort-detail-view">
        <button 
          onClick={() => setSelectedCohortId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cohorts
        </button>

        {/* Cohort Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-sans font-bold text-gray-900 tracking-tight">{selectedCohort.name}</h1>
              <span className="text-xs text-indigo-600 font-semibold">{selectedCohort.program_name}</span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
            selectedCohort.is_active 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-gray-50 text-gray-500 border-gray-100'
          }`}>
            {selectedCohort.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 md:col-span-2">
            <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2.5">Class Enrollment Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 block font-semibold uppercase">Total Registered Students</span>
                <span className="text-2xl font-bold text-indigo-950 mt-1 block">{selectedCohort.students_count} Students</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 block font-semibold uppercase">Course Schedule Duration</span>
                <span className="text-sm font-semibold text-gray-800 mt-1.5 block">
                  {selectedCohort.start_date} to {selectedCohort.end_date}
                </span>
              </div>
            </div>

            {can.manageCohorts(user.role) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="block">
                  <span className="text-xs text-gray-400 block font-semibold uppercase mb-1">Current Week</span>
                  <input
                    type="number"
                    min={1}
                    max={selectedCohort.duration_weeks}
                    defaultValue={selectedCohort.current_week}
                    onBlur={(event) => handleUpdateSelectedCohort({ current_week: Number(event.currentTarget.value) })}
                    className="block w-full rounded-lg border-gray-300 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400 block font-semibold uppercase mb-1">Status</span>
                  <select
                    defaultValue={selectedCohort.status}
                    onChange={(event) => handleUpdateSelectedCohort({ status: event.currentTarget.value as typeof selectedCohort.status })}
                    className="block w-full rounded-lg border-gray-300 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>
            )}

            <div className="pt-2">
              <span className="text-xs text-gray-400 block font-semibold uppercase mb-2">Assigned Faculty</span>
              <div className="space-y-2">
                {selectedTeacherAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between gap-3 p-3 border border-gray-100 rounded-lg">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{assignment.teacher.first_name} {assignment.teacher.last_name}</h4>
                      <p className="text-xs text-gray-500">{assignment.role}</p>
                    </div>
                    {can.manageCohorts(user.role) && (
                      <button
                        type="button"
                        onClick={() => deleteTeacherAssignment.mutate(assignment.id)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {selectedTeacherAssignments.length === 0 && <p className="text-sm text-slate-500">No teachers assigned.</p>}
              </div>
            </div>

            {can.manageCohorts(user.role) && (
              <form
                className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-3 pt-4 border-t border-gray-100"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!selectedCohort || !teacherId.trim()) return;
                  createTeacherAssignment.mutate({
                    teacher_id: teacherId.trim(),
                    cohort_id: selectedCohort.id,
                    role: teacherRole,
                  });
                  setTeacherId('');
                }}
              >
                <input
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.currentTarget.value)}
                  className="rounded-lg border-gray-300 text-sm"
                  placeholder="Teacher user ID"
                />
                <select value={teacherRole} onChange={(event) => setTeacherRole(event.currentTarget.value as typeof teacherRole)} className="rounded-lg border-gray-300 text-sm">
                  <option value="LEAD">Lead</option>
                  <option value="ASSISTANT">Assistant</option>
                  <option value="MENTOR">Mentor</option>
                </select>
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" type="submit">Assign</button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2.5">Academic Checklist</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Parent Syllabus Program Sync Verified</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Grades lockdown logic active</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-gray-600">Late submission flags enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !cohorts || cohorts.length === 0;

  return (
    <div className="space-y-8" id="cohorts-list-view">
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white rounded-lg p-4 shadow-xl flex items-center gap-3.5 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">Cohort initialized successfully!</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-[#d8d8d4] pb-6">
        <div>
          <p className="skx-page-label">Bootcamp Cohorts</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">የቡትካምፕ ቡድኖች</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Bootcamp Cohorts</p>
          <p className="text-[#5f5f5a] text-sm mt-2">
            Coordinate upcoming and active classes, teachers, and total enrollments.
          </p>
        </div>
        {can.manageCohorts(user.role) && (
          <button
            onClick={() => setIsCreating(true)}
            className="skx-primary-btn"
            id="create-cohort-modal-btn"
          >
            <Plus className="w-4 h-4" />
            Add Cohort
          </button>
        )}
      </div>

      {/* Cohort Create Dialog Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg w-full shadow-2xl"
          >
            <h3 className="font-sans font-bold text-lg text-gray-900 mb-2">Initialize New Cohort Class</h3>
            <p className="text-xs text-gray-500 mb-5 font-sans">Setup an isolated student pool synced to a curriculum program.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cohort Name</label>
                <input
                  type="text"
                  className={`mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                    errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="e.g. Frontend Cohort Bravo"
                  {...register('name')}
                />
                {errors.name && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Associated Curriculum Program</label>
                <select
                  className={`mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm ${
                    errors.program_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  {...register('program_id')}
                >
                  <option value="">-- Select Parent Program --</option>
                  {programs?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.program_id && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.program_id.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    {...register('start_date')}
                  />
                  {errors.start_date && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.start_date.message}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    {...register('end_date')}
                  />
                  {errors.end_date && <span className="text-xs text-red-600 font-medium mt-1 block">{errors.end_date.message}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  {...register('is_active')}
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Set Cohort immediately active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-5">
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
                  {isSubmitting ? 'Saving cohort...' : 'Initialize Class'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isEmpty ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50" id="cohorts-empty-state">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Cohorts found</h3>
          <p className="text-sm text-slate-500 mt-1">Initialize your first bootcamp cohort class container.</p>
          {can.manageCohorts(user.role) && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-500 uppercase tracking-wider shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Initialize Cohort
            </button>
          )}
        </div>
      ) : (
        /* Dense operational Table for list display */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm" id="cohorts-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                  <th className="p-4 pl-6">Cohort Name</th>
                  <th className="p-4">Academic Program</th>
                  <th className="p-4">Schedule Frame</th>
                  <th className="p-4">Enrolled Students</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {cohorts.map((cohort) => {
                  return (
                    <tr key={cohort.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="p-4 pl-6 font-semibold text-slate-800 flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        {cohort.name}
                      </td>
                      <td className="p-4 text-indigo-600 font-semibold">
                        {cohort.program_name}
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-500">
                        {cohort.start_date} to {cohort.end_date}
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {cohort.students_count} Students
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          cohort.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          <Activity className="w-3 h-3 shrink-0" />
                          {cohort.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button
                          onClick={() => setSelectedCohortId(cohort.id)}
                          className="px-3 py-1.5 border border-slate-200 hover:border-indigo-200 text-indigo-600 rounded-md text-xs font-bold uppercase tracking-wider transition-all hover:bg-indigo-50/30"
                        >
                          View Class
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
