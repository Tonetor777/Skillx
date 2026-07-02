import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAnnouncements, useCreateAnnouncement } from '../../features/announcements/api/announcements';
import { useCohorts } from '../../features/cohorts/api/cohorts';
import { usePrograms } from '../../features/programs/api/programs';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';
import { 
  Megaphone, 
  Plus, 
  Trash, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Filter,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';

// Form validation schema for creating announcements
const announcementSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters long' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters long' }),
  target_type: z.enum(['system', 'program', 'cohort']),
  target_id: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function Announcements() {
  const { user } = useAuth();
  const { data: announcements, isLoading, isError, error, refetch } = useAnnouncements();
  const { data: cohorts } = useCohorts();
  const { data: programs } = usePrograms();
  const createAnnouncementMutation = useCreateAnnouncement();

  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      target_type: 'system',
      target_id: '',
    },
  });

  const selectedTargetType = watch('target_type');

  const onSubmit = async (data: AnnouncementFormValues) => {
    try {
      let targetName = '';
      if (data.target_type === 'program' && data.target_id) {
        targetName = programs?.find(p => p.id === data.target_id)?.name || '';
      } else if (data.target_type === 'cohort' && data.target_id) {
        targetName = cohorts?.find(c => c.id === data.target_id)?.name || '';
      }

      await createAnnouncementMutation.mutateAsync({
        title: data.title,
        content: data.content,
        target_type: data.target_type,
        target_id: data.target_id,
        target_name: targetName,
      });

      setIsCreating(false);
      reset();
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4" id="announcements-loading-state">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Retrieving system announcements logs...</p>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12" id="announcements-error-state">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Failed to load Announcements</h3>
        <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'Announcement logs are locked.'}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Filter lists based on selected categories
  const filteredAnnouncements = announcements?.filter(ann => {
    if (filterType === 'all') return true;
    return ann.target_type === filterType;
  }) || [];

  const isEmpty = filteredAnnouncements.length === 0;

  return (
    <div className="space-y-8" id="announcements-view-root">
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white rounded-lg p-4 shadow-xl flex items-center gap-3.5 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">Announcement broadcast successfully!</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#d8d8d4] pb-6">
        <div>
          <p className="skx-page-label">Announcements</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">ማስታወቂያዎች</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Announcements</p>
          <p className="text-[#5f5f5a] text-sm mt-2">
            Broadcast platform-wide updates, course syllabus adjustments, or cohort specific bulletins.
          </p>
        </div>
        {can.createAnnouncements(user.role) && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
            id="create-announcement-modal-trigger"
          >
            <Plus className="w-4 h-4" />
            Add Announcement
          </button>
        )}
      </div>

      {/* Categories filter tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex gap-2.5 overflow-x-auto py-1">
          {['all', 'system', 'program', 'cohort'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                filterType === type 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type === 'all' ? 'All Notices' : type === 'system' ? 'System-Wide' : `${type} Scoped`}
            </button>
          ))}
        </div>
      </div>

      {/* Create Announcement Drawer Form Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <h3 className="font-sans font-bold text-lg text-gray-900">Broadcast Announcement</h3>
            <p className="text-xs text-gray-500">Post announcements that are automatically targeted to specific enrollment groups.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Notice Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="e.g. Schedule Change, Syllabus Extension"
                  {...register('title')}
                />
                {errors.title && <span className="text-xs text-red-600 mt-1 block">{errors.title.message}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Notice Scope / Audience</label>
                <select
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  {...register('target_type')}
                >
                  <option value="system">Global (System Wide)</option>
                  <option value="program">Program Scoped (All Cohorts)</option>
                  <option value="cohort">Cohort Scoped (Selected Class Only)</option>
                </select>
              </div>

              {selectedTargetType === 'program' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Choose Program</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 text-sm"
                    {...register('target_id')}
                  >
                    <option value="">-- Choose Program --</option>
                    {programs?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTargetType === 'cohort' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Choose Cohort</label>
                  <select
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 text-sm"
                    {...register('target_id')}
                  >
                    <option value="">-- Choose Cohort Class --</option>
                    {cohorts?.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.program_name})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700">Detailed Message Content</label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Write notice details clearly..."
                  {...register('content')}
                />
                {errors.content && <span className="text-xs text-red-600 mt-1 block">{errors.content.message}</span>}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-500"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isEmpty ? (
        <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50/50" id="announcements-empty-state">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">No Announcements found</h3>
          <p className="text-sm text-gray-500 mt-1">There are no notices matching this filter.</p>
        </div>
      ) : (
        /* Announcements list timeline */
        <div className="space-y-6 max-w-4xl" id="announcements-timeline">
          {filteredAnnouncements.map((ann) => {
            const isSystem = ann.target_type === 'system';
            return (
              <div 
                key={ann.id} 
                className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                      isSystem 
                        ? 'bg-red-50 text-red-700 border-red-100' 
                        : ann.target_type === 'program' 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {isSystem ? 'Global Broadcast' : `${ann.target_type} update`}
                    </span>
                    {ann.target_name && (
                      <span className="text-xs font-semibold text-gray-600">
                        ({ann.target_name})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ann.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-gray-900 tracking-tight">{ann.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-sans mt-3 whitespace-pre-line">
                  {ann.content}
                </p>

                <div className="mt-5 pt-3.5 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Posted by <span className="font-semibold text-gray-700">{ann.author_name}</span> ({ann.author_role.replace('_', ' ')})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
