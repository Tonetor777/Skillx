import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAssignments, useCreateAssignment, useDeleteAssignment, useUpdateAssignment } from '../../features/assignments/api/assignments';
import { useSubmissions, useCreateSubmission, useGradeSubmission } from '../../features/submissions/api/submissions';
import { useModules } from '../../features/weeks/api/weeks';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';
import type { Assignment } from '../../shared/types';
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  Send, 
  Award, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock,
  FileCode,
  Edit3,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

// Form validation schema for creating a new assignment
const assignmentSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }),
  description: z.string().min(15, { message: 'Description must be at least 15 characters' }),
  max_points: z.number().min(1, { message: 'Max points must be at least 1' }),
  due_date: z.string().min(1, { message: 'Due date is required' }),
  module_id: z.string().min(1, { message: 'Module selection is required' }),
  lesson_id: z.string().min(1, { message: 'Lesson selection is required' }),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

// Form validation schema for student submitting work
const submissionSchema = z.object({
  content: z.string().min(10, { message: 'Submission content or link must be at least 10 characters' }),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

// Form validation schema for grading work
const gradingSchema = z.object({
  grade: z.number().min(0, { message: 'Grade cannot be negative' }),
  feedback: z.string().min(5, { message: 'Feedback must be at least 5 characters' }),
});

type GradingFormValues = z.infer<typeof gradingSchema>;

const toDateTimeLocalValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export default function Assignments() {
  const { user } = useAuth();
  
  // Queries
  const { data: modules } = useModules(user?.role === 'student' ? user.cohort_id : undefined);
  const { data: assignments, isLoading: assignmentsLoading, isError: assignmentsError, error, refetch } = useAssignments(
    user?.role === 'student' ? user.cohort_id : undefined
  );
  const { data: submissions, isLoading: submissionsLoading } = useSubmissions();
  
  // Mutations
  const createAssignmentMutation = useCreateAssignment();
  const updateAssignmentMutation = useUpdateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();
  const submitAssignmentMutation = useCreateSubmission();
  const gradeSubmissionMutation = useGradeSubmission();

  // Selection & UI toggles
  const [selectedAsgId, setSelectedAsgId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // Forms
  const createAsgForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { title: '', description: '', max_points: 100, due_date: '', module_id: '', lesson_id: '' }
  });

  const submitForm = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { content: '' }
  });

  const gradeForm = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: { grade: 100, feedback: '' }
  });

  if (!user) return null;

  // Selected assignment detail
  const selectedAsg = assignments?.find(a => a.id === selectedAsgId);

  // Filter student submission for selected assignment
  const studentSubmission = submissions?.find(
    s => s.assignment_id === selectedAsgId && s.student_id === user.id
  );

  // Submissions associated with selected assignment (for instructors)
  const instructorSubmissions = submissions?.filter(s => s.assignment_id === selectedAsgId) || [];
  const selectedModuleId = createAsgForm.watch('module_id');
  const selectedModule = modules?.find(module => module.id === selectedModuleId);
  const isAssignmentFormOpen = isCreating || !!editingAssignment;

  const resetAssignmentForm = () => {
    setIsCreating(false);
    setEditingAssignment(null);
    createAsgForm.reset({ title: '', description: '', max_points: 100, due_date: '', module_id: '', lesson_id: '' });
  };

  const openCreateAssignment = () => {
    setEditingAssignment(null);
    createAsgForm.reset({ title: '', description: '', max_points: 100, due_date: '', module_id: '', lesson_id: '' });
    setIsCreating(true);
  };

  const openEditAssignment = (assignment: Assignment) => {
    setIsCreating(false);
    setEditingAssignment(assignment);
    createAsgForm.reset({
      title: assignment.title,
      description: assignment.description,
      max_points: assignment.max_points,
      due_date: toDateTimeLocalValue(assignment.due_date),
      module_id: assignment.module_id ?? '',
      lesson_id: assignment.lesson_id ?? '',
    });
  };

  const handleAssignmentSubmit = async (data: AssignmentFormValues) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        max_points: data.max_points,
        due_date: data.due_date,
        lesson_id: data.lesson_id,
      };
      if (editingAssignment) {
        await updateAssignmentMutation.mutateAsync({ id: editingAssignment.id, data: payload });
        triggerToast('Assignment task updated successfully!');
      } else {
        await createAssignmentMutation.mutateAsync(payload);
        triggerToast('Assignment task published successfully!');
      }
      resetAssignmentForm();
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Assignment could not be saved.', 'error');
    }
  };

  const handleDeleteOrLockAssignment = async (assignment: Assignment) => {
    const submissionCount = submissions?.filter(s => s.assignment_id === assignment.id).length ?? 0;
    try {
      const result = await deleteAssignmentMutation.mutateAsync(assignment.id);
      if (result?.is_locked || submissionCount > 0) {
        triggerToast('Assignment locked because submissions already exist.');
      } else {
        if (selectedAsgId === assignment.id) setSelectedAsgId(null);
        triggerToast('Assignment deleted successfully.');
      }
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Assignment action failed.', 'error');
    }
  };

  const handleStudentSubmit = async (data: SubmissionFormValues) => {
    if (!selectedAsgId) return;
    try {
      await submitAssignmentMutation.mutateAsync({
        assignment_id: selectedAsgId,
        content: data.content,
      });
      submitForm.reset();
      triggerToast('Homework submitted successfully! Pending review.');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Submission could not be saved.', 'error');
    }
  };

  const handleTeacherGrade = async (data: GradingFormValues) => {
    if (!gradingSubmissionId) return;
    try {
      await gradeSubmissionMutation.mutateAsync({
        id: gradingSubmissionId,
        grade: data.grade,
        feedback: data.feedback,
      });
      setGradingSubmissionId(null);
      gradeForm.reset();
      triggerToast('Submission evaluation saved. Student edits remain locked.');
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Grade could not be saved.', 'error');
    }
  };

  const triggerToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setShowToast({ message, tone });
    setTimeout(() => setShowToast(null), 3000);
  };

  const assignmentFormOverlay = isAssignmentFormOpen ? (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-sans font-bold text-lg text-gray-900 mb-1">
          {editingAssignment ? 'Edit Course Assignment' : 'Create Course Assignment'}
        </h3>
        <p className="text-xs text-gray-500 mb-5 font-sans">
          {editingAssignment ? 'Correct assignment details while preserving submission history.' : 'Publish a syllabus checkpoints homework task for a specific cohort.'}
        </p>

        <form onSubmit={createAsgForm.handleSubmit(handleAssignmentSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700">Assignment Title</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              placeholder="e.g. Building and deploying a full-stack React app"
              {...createAsgForm.register('title')}
            />
            {createAsgForm.formState.errors.title && (
              <span className="text-xs text-red-600 mt-1 block">{createAsgForm.formState.errors.title.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Detailed Description & Specifications</label>
            <textarea
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              placeholder="Define the task requirements, guidelines, deliverables, and score distribution."
              {...createAsgForm.register('description')}
            />
            {createAsgForm.formState.errors.description && (
              <span className="text-xs text-red-600 mt-1 block">{createAsgForm.formState.errors.description.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Module</label>
              <select
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                {...createAsgForm.register('module_id', {
                  onChange: () => createAsgForm.setValue('lesson_id', ''),
                })}
              >
                <option value="">-- Choose Module --</option>
                {modules?.map(module => (
                  <option key={module.id} value={module.id}>Module {module.module_number}: {module.title}</option>
                ))}
              </select>
              {createAsgForm.formState.errors.module_id && (
                <span className="text-xs text-red-600 mt-1 block">{createAsgForm.formState.errors.module_id.message}</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Lesson</label>
              <select
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                {...createAsgForm.register('lesson_id')}
                disabled={!selectedModule}
              >
                <option value="">-- Choose Lesson --</option>
                {selectedModule?.lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>Lesson {lesson.order}: {lesson.title}</option>
                ))}
              </select>
              {createAsgForm.formState.errors.lesson_id && (
                <span className="text-xs text-red-600 mt-1 block">{createAsgForm.formState.errors.lesson_id.message}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Max Points Limit</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              {...createAsgForm.register('max_points', { valueAsNumber: true })}
            />
            {createAsgForm.formState.errors.max_points && (
              <span className="text-xs text-red-600 mt-1 block">{createAsgForm.formState.errors.max_points.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Due Date & Time Cutoff</label>
            <input
              type="datetime-local"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              {...createAsgForm.register('due_date')}
            />
            {createAsgForm.formState.errors.due_date && (
              <span className="text-xs text-red-600 mt-1 block">{createAsgForm.formState.errors.due_date.message}</span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-5">
            <button
              type="button"
              onClick={resetAssignmentForm}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAsgForm.formState.isSubmitting || createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-500"
            >
              {editingAssignment ? 'Save Changes' : 'Publish Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  ) : null;

  // 1. Loading State
  if (assignmentsLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4" id="assignments-loading-state">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Retrieving coursework assignments...</p>
      </div>
    );
  }

  // 2. Error State
  if (assignmentsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12" id="assignments-error-state">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load Assignments</h3>
        <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'Course registry is unreachable.'}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // DETAILED VIEW SUB-PAGE
  if (selectedAsg) {
    const isOverdue = new Date() > new Date(selectedAsg.due_date);
    const selectedSubmissionCount = submissions?.filter(s => s.assignment_id === selectedAsg.id).length ?? 0;
    const isDeletingOrLocking = deleteAssignmentMutation.isPending;
    return (
      <div className="space-y-6" id="assignment-detail-subview">
        {showToast && (
          <div className={`fixed top-20 right-6 z-50 text-white rounded-lg p-4 shadow-xl flex items-center gap-3.5 border ${
            showToast.tone === 'error' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold">{showToast.message}</span>
          </div>
        )}
        {assignmentFormOverlay}

        <button 
          onClick={() => setSelectedAsgId(null)}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </button>

        {/* Assignment Brief */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-start flex-col sm:flex-row gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">
                {selectedAsg.module_title ?? 'Module'} · {selectedAsg.lesson_title ?? 'Lesson'} Assignment
              </span>
              <h1 className="text-xl md:text-2xl font-sans font-bold text-gray-900 tracking-tight mt-0.5">{selectedAsg.title}</h1>
              <p className="text-xs text-gray-500 mt-1">Cohort: {selectedAsg.cohort_name}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-100 font-mono">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              Due: {new Date(selectedAsg.due_date).toLocaleString()}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
            {selectedAsg.is_locked && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                <Lock className="h-3.5 w-3.5" /> Locked
              </span>
            )}
            {can.manageAssignments(user.role) && (
              <>
                <button
                  type="button"
                  onClick={() => openEditAssignment(selectedAsg)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  disabled={isDeletingOrLocking || selectedAsg.is_locked}
                  onClick={() => handleDeleteOrLockAssignment(selectedAsg)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedSubmissionCount > 0 ? <ShieldCheck className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {selectedSubmissionCount > 0 ? 'Lock' : 'Delete'}
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed font-sans border-t border-gray-50 pt-3">{selectedAsg.description}</p>
          <div className="text-xs font-bold text-gray-400">
            MAX POINT LOCK: {selectedAsg.max_points} PTS
          </div>
        </div>

        {/* DYNAMIC ROLE PANEL INTERACTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. STUDENT VIEW INTERACTION */}
          {user.role === 'student' && (
            <div className="lg:col-span-3">
              {studentSubmission ? (
                /* Graded or Pending lock display */
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-base text-gray-900">Your Submission Record</h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      studentSubmission.status === 'graded' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {studentSubmission.status === 'graded' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Graded & Locked
                        </>
                      ) : (
                        'Pending Review'
                      )}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase">Submitted content / GitHub link</span>
                      <pre className="mt-1.5 p-3.5 bg-gray-50 rounded-lg text-xs font-mono border border-gray-100 overflow-x-auto text-gray-700">
                        {studentSubmission.content}
                      </pre>
                      <span className="text-[10px] text-gray-400 block mt-1.5">
                        Uploaded on {new Date(studentSubmission.submitted_at).toLocaleString()}
                        {studentSubmission.is_late && <span className="text-red-600 font-bold ml-1.5">LATE SUBMISSION</span>}
                      </span>
                    </div>

                    {studentSubmission.status === 'graded' && (
                      <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/40 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                            <Award className="w-4.5 h-4.5 text-indigo-600" />
                            Instructor Score Card
                          </span>
                          <span className="text-lg font-bold text-indigo-700 font-mono">
                            {studentSubmission.grade} / {selectedAsg.max_points} PTS
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 italic font-sans leading-relaxed">
                          "{studentSubmission.feedback}"
                        </p>
                        <span className="text-[10px] text-indigo-500 block">
                          Graded by {studentSubmission.graded_by_name} on {new Date(studentSubmission.graded_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedAsg.is_locked ? (
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Submission Closed</h3>
                  <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg p-4 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-slate-500" />
                    <span>This assignment is locked and no longer accepts submissions.</span>
                  </div>
                </div>
              ) : (
                /* Homework Submission Form */
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Submit Solution</h3>
                  
                  {isOverdue && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>The cutoff date has passed. Your submission will automatically be flagged as **LATE**.</span>
                    </div>
                  )}

                  <form onSubmit={submitForm.handleSubmit(handleStudentSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Solution link or documentation answers</label>
                      <textarea
                        rows={5}
                        className="mt-1.5 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-xs font-mono"
                        placeholder="Provide your Sandbox link, Git repository repository URL, or inline answers here..."
                        {...submitForm.register('content')}
                      />
                      {submitForm.formState.errors.content && (
                        <span className="text-xs text-red-600 font-medium mt-1 block">{submitForm.formState.errors.content.message}</span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitForm.formState.isSubmitting}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Send className="w-4 h-4" /> Submit Assignment
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 2. INSTRUCTOR VIEW INTERACTION */}
          {user.role !== 'student' && (
            <div className="lg:col-span-3 space-y-6">
              {/* Grading Review Overlay Drawer */}
              {gradingSubmissionId && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg w-full shadow-2xl space-y-4"
                  >
                    <h3 className="font-sans font-bold text-lg text-gray-900">Evaluate Student Submission</h3>
                    <p className="text-xs text-gray-500">Record or update score metrics and feedback. Student edits stay locked after grading.</p>

                    <form onSubmit={gradeForm.handleSubmit(handleTeacherGrade)} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700">Grade Score (Max {selectedAsg.max_points})</label>
                        <input
                          type="number"
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500"
                          {...gradeForm.register('grade', { valueAsNumber: true })}
                        />
                        {gradeForm.formState.errors.grade && <span className="text-xs text-red-600 mt-1 block">{gradeForm.formState.errors.grade.message}</span>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700">Syllabus Feedback</label>
                        <textarea
                          rows={4}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500"
                          placeholder="Provide specific, constructive technical review notes..."
                          {...gradeForm.register('feedback')}
                        />
                        {gradeForm.formState.errors.feedback && <span className="text-xs text-red-600 mt-1 block">{gradeForm.formState.errors.feedback.message}</span>}
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setGradingSubmissionId(null)}
                          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={gradeForm.formState.isSubmitting}
                          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-500"
                        >
                          Publish Grade
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {/* Submissions List Queue */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">Student Submission Queue</h3>
                
                {instructorSubmissions.length === 0 ? (
                  <div className="border border-dashed border-gray-100 py-8 text-center rounded-lg bg-gray-50/50">
                    <FileCode className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 italic">No students have uploaded submissions for this task yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          <th className="p-3 pl-4">Student</th>
                          <th className="p-3">Solution Content</th>
                          <th className="p-3">Uploaded On</th>
                          <th className="p-3">Verdict Status</th>
                          <th className="p-3">Awarded Score</th>
                          <th className="p-3 text-right pr-4">Evaluation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {instructorSubmissions.map((sub) => {
                          const isGraded = sub.status === 'graded';
                          return (
                            <tr key={sub.id} className="hover:bg-gray-50/30">
                              <td className="p-3 pl-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                    {sub.student_name[0]}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-900 block">{sub.student_name}</span>
                                    <span className="text-[10px] text-gray-400 block font-mono">{sub.student_email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-xs font-mono text-gray-500 truncate max-w-[120px] block">
                                  {sub.content}
                                </span>
                              </td>
                              <td className="p-3 text-xs text-gray-500">
                                {new Date(sub.submitted_at).toLocaleDateString()}
                                {sub.is_late && (
                                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-sm font-bold ml-1.5">
                                    LATE
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isGraded 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {isGraded ? 'Graded' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-3 font-semibold text-gray-800 font-mono">
                                {isGraded ? `${sub.grade} / ${selectedAsg.max_points}` : '--'}
                              </td>
                              <td className="p-3 text-right pr-4">
                                {isGraded ? (
                                  <button
                                    onClick={() => {
                                      setGradingSubmissionId(sub.id);
                                      gradeForm.setValue('grade', sub.grade || 100);
                                      gradeForm.setValue('feedback', sub.feedback || '');
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
                                  >
                                    Adjust Score
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setGradingSubmissionId(sub.id);
                                      gradeForm.setValue('grade', selectedAsg.max_points);
                                      gradeForm.setValue('feedback', '');
                                    }}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold"
                                  >
                                    Evaluate
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  const isEmpty = !assignments || assignments.length === 0;

  return (
    <div className="space-y-8" id="assignments-list-view">
      {showToast && (
        <div className={`fixed top-20 right-6 z-50 text-white rounded-lg p-4 shadow-xl flex items-center gap-3.5 border ${
          showToast.tone === 'error' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{showToast.message}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-[#d8d8d4] pb-6">
        <div>
          <p className="skx-page-label">Tasks & Assignments</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">ተግባራት እና ምዘናዎች</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Tasks & Assignments</p>
          {user.role !== 'student' && (
            <p className="text-[#5f5f5a] text-sm mt-2">
              Manage submissions, grading, and feedback.
            </p>
          )}
        </div>
        {can.manageAssignments(user.role) && (
          <button
            onClick={openCreateAssignment}
            className="skx-primary-btn"
            id="create-assignment-btn"
          >
            <Plus className="w-4 h-4" />
            Add Assignment
          </button>
        )}
      </div>

      {assignmentFormOverlay}

      {isEmpty ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50/50" id="assignments-empty-state">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">No Assignments published</h3>
          {can.manageAssignments(user.role) && (
            <p className="text-sm text-gray-500 mt-1">Publish an assignment to begin collecting submissions.</p>
          )}
          {can.manageAssignments(user.role) && (
            <button
              onClick={openCreateAssignment}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-500"
            >
              <Plus className="w-4 h-4" /> Add Assignment
            </button>
          )}
        </div>
      ) : (
        /* Assignments Grid display */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans" id="assignments-data-grid">
          {assignments.map((asg) => {
            const hasSub = submissions?.find(s => s.assignment_id === asg.id && s.student_id === user.id);
            const assignmentSubmissionCount = submissions?.filter(s => s.assignment_id === asg.id).length || 0;
            const isOverdue = new Date() > new Date(asg.due_date);
            return (
              <div 
                key={asg.id} 
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs hover:shadow-md hover:border-indigo-100 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-indigo-600 uppercase font-mono tracking-wider">
                      {asg.module_title ?? 'Module'} · {asg.lesson_title ?? 'Lesson'}
                    </span>
                    
                    {/* Status Badge */}
                    {user.role === 'student' ? (
                      asg.is_locked && !hasSub ? (
                        <span className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Locked
                        </span>
                      ) : hasSub ? (
                        hasSub.status === 'graded' ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Score: {hasSub.grade}/{asg.max_points}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Grading Queue
                          </span>
                        )
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isOverdue ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Todo'}
                        </span>
                      )
                    ) : (
                      <div className="flex items-center gap-2">
                        {asg.is_locked && (
                          <span className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Locked
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 font-mono">
                          {assignmentSubmissionCount} Submissions
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 tracking-tight leading-snug">{asg.title}</h3>
                  <p className="text-gray-500 text-xs mt-1.5 line-clamp-3 leading-relaxed">
                    {asg.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Cutoff: {new Date(asg.due_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {can.manageAssignments(user.role) && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditAssignment(asg)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={deleteAssignmentMutation.isPending || asg.is_locked}
                          onClick={() => handleDeleteOrLockAssignment(asg)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {assignmentSubmissionCount > 0 ? <ShieldCheck className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                          {assignmentSubmissionCount > 0 ? 'Lock' : 'Delete'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedAsgId(asg.id)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors"
                    >
                      {user.role === 'student' ? (hasSub ? 'View Locker' : asg.is_locked ? 'View Closed' : 'Submit solution') : 'Manage Submissions'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
