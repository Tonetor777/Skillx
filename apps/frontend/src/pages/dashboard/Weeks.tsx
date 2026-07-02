import React from 'react';
import { AlertCircle, BookOpen, Loader2, Plus } from 'lucide-react';
import { useWeeks, usePublishWeek } from '../../features/weeks/api/weeks';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';

export default function Weeks() {
  const { user } = useAuth();
  const { data: weeks = [], isLoading, isError, error, refetch } = useWeeks(user?.cohort_id);
  const publishWeek = usePublishWeek();

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading weekly content...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-gray-900">Failed to load weekly content</h1>
        <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'Unable to load content.'}</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-[#d8d8d4] pb-6">
        <div>
          <p className="skx-page-label">Weekly Content</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">ሳምንታዊ ይዘት</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Weekly Content</p>
          <p className="text-[#5f5f5a] text-sm mt-2">Lessons, recordings, and resources scoped to your cohort.</p>
        </div>
        {can.manageAssignments(user.role) && (
          <button className="skx-primary-btn">
            <Plus className="w-4 h-4" /> Add Week
          </button>
        )}
      </div>

      {weeks.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">No weekly content available</h2>
          <p className="text-sm text-slate-500 mt-1">Published lessons will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {weeks.map((week) => (
            <article key={week.id ?? week.week_number ?? week.number} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">Week {week.week_number ?? week.number}</span>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">{week.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{week.objectives ?? week.objective}</p>
                </div>
                <span className="text-xs font-bold uppercase text-slate-500">{week.status}</span>
              </div>
              {week.notes && <p className="mt-4 text-sm text-slate-600">{week.notes}</p>}
              {week.recording && <a className="mt-4 inline-block text-sm font-semibold text-indigo-700" href={week.recording}>Recording</a>}
              <div className="mt-5 space-y-2">
                {week.resources.map((resource) => (
                  <a key={resource.id} href={resource.url} className="block rounded-lg border border-slate-100 p-3 text-sm font-medium text-slate-700 hover:border-indigo-200">
                    {resource.title}
                  </a>
                ))}
              </div>
              {can.manageAssignments(user.role) && week.id && week.status !== 'published' && (
                <button onClick={() => publishWeek.mutate(week.id!)} className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Publish
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
