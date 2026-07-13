import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCreateLesson,
  useCreateModule,
  useCreateResource,
  useDeleteLesson,
  useDeleteModule,
  useDeleteResource,
  useModules,
  usePublishModule,
  useUpdateLesson,
  useUpdateModule,
  useUpdateResource,
} from '../../features/weeks/api/weeks';
import { useCohorts } from '../../features/cohorts/api/cohorts';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { can } from '../../shared/permissions/can';
import type { Lesson, LessonImage, Module, Resource } from '../../shared/types';
import { LessonContentRenderer } from '../../features/weeks/components/LessonContentRenderer';
import { RichLessonEditor } from '../../features/weeks/components/RichLessonEditor';
import { lessonContentHasRenderableContent } from '../../features/weeks/utils/lessonContent';

interface CurriculumManagerProps {
  programId?: string;
  embedded?: boolean;
}

type ModuleForm = {
  id?: string;
  cohort_id: string;
  module_number: number;
  title: string;
  description: string;
  notes: string;
  status: 'draft' | 'published' | 'archived';
};

type LessonForm = {
  id?: string;
  module_id: string;
  title: string;
  objectives: string;
  content: string;
  recording: string;
  order: number;
  images: LessonImage[];
};

type ResourceForm = {
  id?: string;
  lesson_id: string;
  title: string;
  url: string;
  order: number;
};

type ActiveForm =
  | { type: 'module'; week: number; module?: Module }
  | { type: 'lesson'; module: Module; lesson?: Lesson }
  | { type: 'resource'; lesson: Lesson; resource?: Resource }
  | null;

const emptyModuleForm: ModuleForm = {
  cohort_id: '',
  module_number: 1,
  title: '',
  description: '',
  notes: '',
  status: 'draft',
};

const emptyLessonForm: LessonForm = {
  module_id: '',
  title: '',
  objectives: '',
  content: '',
  recording: '',
  order: 1,
  images: [],
};

const emptyResourceForm: ResourceForm = {
  lesson_id: '',
  title: '',
  url: '',
  order: 1,
};

export function CurriculumManager({ programId, embedded = false }: CurriculumManagerProps) {
  const { user } = useAuth();
  const isStaff = !!user && can.manageCurriculum(user.role);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(emptyModuleForm);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm);
  const [resourceForm, setResourceForm] = useState<ResourceForm>(emptyResourceForm);
  const [message, setMessage] = useState('');

  const { data: cohorts = [] } = useCohorts();
  const cohortOptions = useMemo(() => {
    return programId ? cohorts.filter((cohort) => cohort.program_id === programId) : cohorts;
  }, [cohorts, programId]);
  const effectiveCohortId = user?.role === 'student'
    ? user.cohort_id
    : selectedCohortId || (programId ? cohortOptions[0]?.id : '');
  const { data: modules = [], isLoading, isError, error, refetch } = useModules(effectiveCohortId || undefined);

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const publishModule = usePublishModule();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  const weekGroups = useMemo(() => {
    const groups = new Map<number, Module[]>();
    modules.forEach((module) => {
      const list = groups.get(module.module_number) ?? [];
      list.push(module);
      groups.set(module.module_number, list);
    });
    return [...groups.entries()]
      .sort(([a], [b]) => a - b)
      .map(([week, weekModules]) => ({
        week,
        modules: weekModules.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [modules]);

  const flatModules = useMemo(() => {
    return weekGroups.flatMap((group) => group.modules);
  }, [weekGroups]);

  const selectedModule = useMemo(() => {
    return flatModules.find((module) => module.id === selectedModuleId) ?? flatModules[0];
  }, [flatModules, selectedModuleId]);

  const selectedLesson = useMemo(() => {
    const lessons = selectedModule?.lessons ?? [];
    return lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  }, [selectedLessonId, selectedModule]);

  useEffect(() => {
    if (flatModules.length === 0) {
      setSelectedModuleId(null);
      setSelectedLessonId(null);
      return;
    }

    const currentModule = flatModules.find((module) => module.id === selectedModuleId);
    const nextModule = currentModule ?? flatModules[0];
    if (nextModule?.id && nextModule.id !== selectedModuleId) {
      setSelectedModuleId(nextModule.id);
    }

    const currentLesson = nextModule?.lessons.find((lesson) => lesson.id === selectedLessonId);
    const nextLesson = currentLesson ?? nextModule?.lessons[0];
    if (nextLesson?.id && nextLesson.id !== selectedLessonId) {
      setSelectedLessonId(nextLesson.id);
    }
    if (!nextLesson && selectedLessonId !== null) {
      setSelectedLessonId(null);
    }
  }, [flatModules, selectedLessonId, selectedModuleId]);

  if (!user) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  };

  const nextWeekNumber = weekGroups.length > 0 ? Math.max(...weekGroups.map((group) => group.week)) + 1 : 1;
  const activeNewWeekFormOpen = activeForm?.type === 'module' && !weekGroups.some((group) => group.week === activeForm.week);

  const closeForm = () => {
    setActiveForm(null);
    setModuleForm(emptyModuleForm);
    setLessonForm(emptyLessonForm);
    setResourceForm(emptyResourceForm);
  };

  const openModuleForm = (week: number, module?: Module) => {
    setSelectedModuleId(module?.id ?? null);
    setActiveForm({ type: 'module', week, module });
    setModuleForm({
      id: module?.id,
      cohort_id: module?.cohort_id ?? effectiveCohortId ?? '',
      module_number: week,
      title: module?.title ?? '',
      description: module?.description ?? '',
      notes: module?.notes ?? '',
      status: module?.status ?? 'draft',
    });
  };

  const openLessonForm = (module: Module, lesson?: Lesson) => {
    setSelectedModuleId(module.id ?? null);
    setSelectedLessonId(lesson?.id ?? null);
    setActiveForm({ type: 'lesson', module, lesson });
    setLessonForm({
      id: lesson?.id,
      module_id: lesson?.module_id ?? module.id ?? '',
      title: lesson?.title ?? '',
      objectives: lesson?.objectives ?? '',
      content: lesson?.content ?? '',
      recording: lesson?.recording ?? '',
      order: lesson?.order ?? module.lessons.length + 1,
      images: lesson?.images ?? [],
    });
  };

  const openResourceForm = (lesson: Lesson, resource?: Resource) => {
    const parentModule = modules.find((module) => module.lessons.some((item) => item.id === lesson.id));
    if (parentModule) {
      setSelectedModuleId(parentModule.id ?? null);
    }
    setSelectedLessonId(lesson.id ?? null);
    setActiveForm({ type: 'resource', lesson, resource });
    setResourceForm({
      id: resource?.id,
      lesson_id: resource?.lesson_id ?? lesson.id ?? '',
      title: resource?.title ?? '',
      url: resource?.url ?? '',
      order: resource?.order ?? lesson.resources.length + 1,
    });
  };

  const selectModule = (module: Module) => {
    setSelectedModuleId(module.id ?? null);
    setSelectedLessonId(module.lessons[0]?.id ?? null);
    setActiveForm(null);
  };

  const selectLesson = (module: Module, lesson: Lesson) => {
    setSelectedModuleId(module.id ?? null);
    setSelectedLessonId(lesson.id ?? null);
    setActiveForm(null);
  };

  const submitModule = async (event: React.FormEvent) => {
    event.preventDefault();
    const cohortId = moduleForm.cohort_id || effectiveCohortId;
    if (!cohortId || !moduleForm.title.trim()) return;
    const payload = {
      cohort_id: cohortId,
      module_number: moduleForm.module_number,
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim(),
      notes: moduleForm.notes.trim(),
      status: moduleForm.status,
    };
    if (moduleForm.id) {
      await updateModule.mutateAsync({ id: moduleForm.id, data: payload });
      showMessage('Module updated.');
    } else {
      await createModule.mutateAsync(payload);
      showMessage('Module created.');
    }
    closeForm();
  };

  const submitLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lessonForm.module_id || !lessonForm.title.trim()) return;
    const payload = {
      module_id: lessonForm.module_id,
      title: lessonForm.title.trim(),
      objectives: lessonForm.objectives.trim(),
      content: lessonForm.content.trim(),
      recording: lessonForm.recording.trim(),
      order: lessonForm.order,
    };
    if (lessonForm.id) {
      await updateLesson.mutateAsync({ id: lessonForm.id, data: payload });
      showMessage('Lesson updated.');
    } else {
      await createLesson.mutateAsync(payload);
      showMessage('Lesson created.');
    }
    closeForm();
  };

  const submitResource = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resourceForm.lesson_id || !resourceForm.title.trim() || !resourceForm.url.trim()) return;
    const payload = {
      lesson_id: resourceForm.lesson_id,
      title: resourceForm.title.trim(),
      url: resourceForm.url.trim(),
      order: resourceForm.order,
    };
    if (resourceForm.id) {
      await updateResource.mutateAsync({ id: resourceForm.id, data: payload });
      showMessage('Resource updated.');
    } else {
      await createResource.mutateAsync(payload);
      showMessage('Resource added.');
    }
    closeForm();
  };

  const renderModuleForm = (week: number) => (
    <form onSubmit={submitModule} className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">{moduleForm.id ? 'Edit Module' : `Add Module to Week ${week}`}</h4>
        <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-700" aria-label="Close module form">
          <X className="h-4 w-4" />
        </button>
      </div>
      {!effectiveCohortId && (
        <select value={moduleForm.cohort_id} onChange={(event) => setModuleForm({ ...moduleForm, cohort_id: event.target.value })} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">Choose cohort</option>
          {cohortOptions.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
        </select>
      )}
      <input value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value })} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Module title" />
      <textarea value={moduleForm.description} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Module description" />
      <textarea value={moduleForm.notes} onChange={(event) => setModuleForm({ ...moduleForm, notes: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Internal notes" />
      <select value={moduleForm.status} onChange={(event) => setModuleForm({ ...moduleForm, status: event.target.value as ModuleForm['status'] })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>
      <button type="submit" className="skx-primary-btn justify-center">
        <Check className="h-4 w-4" /> {moduleForm.id ? 'Save Module' : 'Create Module'}
      </button>
    </form>
  );

  const renderLessonForm = (module: Module) => (
    <form onSubmit={submitLesson} className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">{lessonForm.id ? 'Edit Lesson' : `Add Lesson to ${module.title}`}</h4>
        <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-700" aria-label="Close lesson form">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input type="number" min={1} value={lessonForm.order} onChange={(event) => setLessonForm({ ...lessonForm, order: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Lesson order" />
      <input value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Lesson title" />
      <textarea value={lessonForm.objectives} onChange={(event) => setLessonForm({ ...lessonForm, objectives: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Lesson objectives" />
      <RichLessonEditor
        value={lessonForm.content}
        lessonId={lessonForm.id}
        images={lessonForm.images}
        onChange={(content) => setLessonForm({ ...lessonForm, content })}
      />
      <input value={lessonForm.recording} onChange={(event) => setLessonForm({ ...lessonForm, recording: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Recording URL" />
      <button type="submit" className="skx-primary-btn justify-center">
        <Check className="h-4 w-4" /> {lessonForm.id ? 'Save Lesson' : 'Create Lesson'}
      </button>
    </form>
  );

  const renderResourceForm = (lesson: Lesson) => (
    <form onSubmit={submitResource} className="rounded-lg border border-amber-100 bg-amber-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">{resourceForm.id ? 'Edit Resource' : `Add Resource to ${lesson.title}`}</h4>
        <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-700" aria-label="Close resource form">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input type="number" min={0} value={resourceForm.order} onChange={(event) => setResourceForm({ ...resourceForm, order: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Resource order" />
      <input value={resourceForm.title} onChange={(event) => setResourceForm({ ...resourceForm, title: event.target.value })} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Resource title" />
      <input value={resourceForm.url} onChange={(event) => setResourceForm({ ...resourceForm, url: event.target.value })} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="https://example.com/resource" />
      <button type="submit" className="skx-primary-btn justify-center">
        <Check className="h-4 w-4" /> {resourceForm.id ? 'Save Resource' : 'Create Resource'}
      </button>
    </form>
  );

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading curriculum...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-gray-900">Failed to load curriculum</h1>
        <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'Unable to load content.'}</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <Check className="h-4 w-4" />
          {message}
        </div>
      )}

      {!embedded && (
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end border-b border-[#d8d8d4] pb-6">
          <div>
            <p className="skx-page-label">Curriculum</p>
            <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">ሥርዓተ ትምህርት</h1>
            <p className="mt-2 font-display text-lg font-bold text-[#141414]">Weeks, Modules, Lessons, and Resources</p>
            <p className="text-[#5f5f5a] text-sm mt-2">Browse or manage the structured cohort curriculum.</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-7rem)]">
          <div className="space-y-4 border-b border-slate-100 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Curriculum Navigator</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Module list</h2>
            </div>

            {isStaff && (
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Cohort</span>
                <select
                  value={effectiveCohortId}
                  onChange={(event) => {
                    setSelectedCohortId(event.target.value);
                    setSelectedModuleId(null);
                    setSelectedLessonId(null);
                    closeForm();
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {!programId && <option value="">All assigned cohorts</option>}
                  {programId && cohortOptions.length === 0 && <option value="">No cohorts available</option>}
                  {cohortOptions.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>{cohort.name} · {cohort.program_name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Module</span>
              <select
                value={selectedModule?.id ?? ''}
                onChange={(event) => {
                  const nextModule = flatModules.find((module) => module.id === event.target.value);
                  if (nextModule) selectModule(nextModule);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {flatModules.length === 0 && <option value="">No modules available</option>}
                {flatModules.map((module) => (
                  <option key={module.id ?? module.title} value={module.id}>
                    Week {module.module_number}: {module.title}
                  </option>
                ))}
              </select>
            </label>

            {isStaff && (
              <button
                type="button"
                onClick={() => openModuleForm(nextWeekNumber)}
                disabled={!effectiveCohortId && cohortOptions.length === 0}
                className="skx-primary-btn w-full justify-center disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Week
              </button>
            )}
          </div>

          <div className="max-h-[520px] overflow-y-auto p-3 xl:max-h-[calc(100vh-24rem)]">
            {weekGroups.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <BookOpen className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800">No curriculum content</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {isStaff ? 'Create the first week module to begin.' : 'Published lessons will appear here.'}
                </p>
                {isStaff && (
                  <button
                    type="button"
                    onClick={() => openModuleForm(1)}
                    disabled={!effectiveCohortId && cohortOptions.length === 0}
                    className="skx-primary-btn mx-auto mt-4 justify-center disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> Add First Week
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {weekGroups.map((group) => (
                  <section key={group.week} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Week {group.week}</h3>
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => openModuleForm(group.week)}
                          className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-slate-900"
                          aria-label={`Add module to week ${group.week}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {group.modules.map((module) => {
                      const isModuleSelected = selectedModule?.id === module.id;
                      return (
                        <article
                          key={module.id ?? module.title}
                          className={`rounded-lg border transition ${isModuleSelected ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-100 bg-white'}`}
                        >
                          <div className="flex items-start gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => selectModule(module)}
                              className="min-w-0 flex-1 rounded-md px-2 py-2 text-left hover:bg-white"
                            >
                              <span className="block truncate text-sm font-bold text-slate-900">{module.title}</span>
                              <span className="mt-1 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{module.status}</span>
                            </button>
                            {isStaff && module.id && (
                              <div className="flex shrink-0 items-center gap-1 pt-1">
                                {module.status !== 'published' && (
                                  <button
                                    type="button"
                                    onClick={() => publishModule.mutate(module.id!)}
                                    className="rounded-md border border-emerald-200 p-1.5 text-emerald-700 hover:bg-emerald-50"
                                    aria-label="Publish module"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button type="button" onClick={() => openModuleForm(group.week, module)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-slate-900" aria-label="Edit module"><Edit3 className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => deleteModule.mutate(module.id!)} className="rounded-md border border-rose-100 p-1.5 text-rose-500 hover:text-rose-700" aria-label="Delete module"><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-100">
                            {module.lessons.length === 0 ? (
                              <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs text-slate-500">
                                <span>No lessons yet.</span>
                                {isStaff && (
                                  <button type="button" onClick={() => openLessonForm(module)} className="font-bold text-indigo-700">Add Lesson</button>
                                )}
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {module.lessons.map((lesson) => {
                                  const isLessonSelected = selectedLesson?.id === lesson.id;
                                  return (
                                    <div key={lesson.id ?? lesson.order} className={`flex items-center gap-2 px-3 py-2 ${isLessonSelected ? 'bg-white' : ''}`}>
                                      <button
                                        type="button"
                                        onClick={() => selectLesson(module, lesson)}
                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-slate-50"
                                      >
                                        <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                                        <span className="truncate text-sm font-medium text-slate-700">{lesson.title}</span>
                                      </button>
                                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Available lesson" />
                                      {isStaff && lesson.id && (
                                        <div className="flex shrink-0 items-center gap-1">
                                          <button type="button" onClick={() => openLessonForm(module, lesson)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-slate-900" aria-label="Edit lesson"><Edit3 className="h-3.5 w-3.5" /></button>
                                          <button type="button" onClick={() => deleteLesson.mutate(lesson.id!)} className="rounded-md border border-rose-100 p-1.5 text-rose-500 hover:text-rose-700" aria-label="Delete lesson"><Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {isStaff && module.lessons.length > 0 && (
                            <div className="border-t border-slate-100 px-3 py-2">
                              <button type="button" onClick={() => openLessonForm(module)} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700">
                                <Plus className="h-3.5 w-3.5" /> Add Lesson
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </section>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          {activeForm?.type === 'module' && (
            <section className="border-b border-slate-100 p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Week {activeForm.week}</span>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{activeForm.module ? 'Edit module' : 'New module'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {activeNewWeekFormOpen ? 'Create the first module for this week.' : 'Update the module details used in the lesson list.'}
              </p>
              <div className="mt-4">{renderModuleForm(activeForm.week)}</div>
            </section>
          )}

          {activeForm?.type === 'lesson' && (
            <section className="border-b border-slate-100 p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Week {activeForm.module.module_number}</span>
              <h2 className="mt-1 text-xl font-bold text-slate-950">{activeForm.lesson ? 'Edit lesson' : 'New lesson'}</h2>
              <p className="mt-1 text-sm text-slate-500">{activeForm.module.title}</p>
              <div className="mt-4">{renderLessonForm(activeForm.module)}</div>
            </section>
          )}

          {!activeForm || activeForm.type === 'resource' ? (
            !selectedModule ? (
              <section className="flex min-h-[520px] flex-col items-center justify-center p-8 text-center">
                <BookOpen className="mb-3 h-12 w-12 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">No curriculum content available</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  {isStaff ? 'Choose a cohort and create the first module to start building lessons.' : 'Published lessons for your cohort will appear here.'}
                </p>
              </section>
            ) : (
              <article className="min-h-[620px]">
                <header className="border-b border-slate-100 p-5 sm:p-7">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        Week {selectedModule.module_number} · {selectedModule.title}
                      </p>
                      <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">
                        {selectedLesson?.title ?? selectedModule.title}
                      </h1>
                      {selectedLesson?.objectives ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{selectedLesson.objectives}</p>
                      ) : selectedModule.description ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{selectedModule.description}</p>
                      ) : null}
                    </div>

                    {isStaff && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => openModuleForm(selectedModule.module_number, selectedModule)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Edit3 className="mr-1 inline h-3.5 w-3.5" /> Edit Module
                        </button>
                        {selectedLesson ? (
                          <>
                            <button type="button" onClick={() => openLessonForm(selectedModule, selectedLesson)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                              <Edit3 className="mr-1 inline h-3.5 w-3.5" /> Edit Lesson
                            </button>
                            <button type="button" onClick={() => openResourceForm(selectedLesson)} className="skx-primary-btn py-2 text-xs">
                              <Plus className="h-3.5 w-3.5" /> Add Resource
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => openLessonForm(selectedModule)} className="skx-primary-btn py-2 text-xs">
                            <Plus className="h-3.5 w-3.5" /> Add Lesson
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </header>

                <div className="space-y-6 bg-slate-50/50 p-4 sm:p-7">
                  {selectedLesson ? (
                    <>
                      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                        {lessonContentHasRenderableContent(selectedLesson.content) ? (
                          <LessonContentRenderer content={selectedLesson.content} images={selectedLesson.images ?? []} />
                        ) : (
                          <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center">
                            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                            <h2 className="text-sm font-bold text-slate-800">No lesson content yet</h2>
                            <p className="mt-1 text-sm text-slate-500">
                              {isStaff ? 'Use Edit Lesson to add text, images, and links.' : 'This lesson content is not available yet.'}
                            </p>
                          </div>
                        )}
                      </section>

                      {selectedLesson.recording && (
                        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <a className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900" href={selectedLesson.recording} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Watch recording
                          </a>
                        </section>
                      )}

                      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h2 className="text-base font-bold text-slate-950">Resources</h2>
                            <p className="mt-1 text-sm text-slate-500">Lesson links and supporting material.</p>
                          </div>
                          {isStaff && (
                            <button type="button" onClick={() => openResourceForm(selectedLesson)} className="skx-primary-btn py-2 text-xs">
                              <Plus className="h-3.5 w-3.5" /> Add Resource
                            </button>
                          )}
                        </div>

                        {activeForm?.type === 'resource' && activeForm.lesson.id === selectedLesson.id && (
                          <div className="mt-4">{renderResourceForm(selectedLesson)}</div>
                        )}

                        {selectedLesson.resources.length === 0 ? (
                          <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No resources in this lesson yet.</p>
                        ) : (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {selectedLesson.resources.map((resource) => (
                              <div key={resource.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                                <a href={resource.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-700">
                                  <ExternalLink className="h-4 w-4 shrink-0 text-indigo-500" />
                                  <span className="truncate">{resource.title}</span>
                                </a>
                                {isStaff && (
                                  <div className="flex shrink-0 items-center gap-2">
                                    <button type="button" onClick={() => openResourceForm(selectedLesson, resource)} className="rounded-md border border-slate-200 p-2 text-slate-500 hover:text-slate-900" aria-label="Edit resource"><Edit3 className="h-4 w-4" /></button>
                                    <button type="button" onClick={() => deleteResource.mutate(resource.id)} className="rounded-md border border-rose-100 p-2 text-rose-500 hover:text-rose-700" aria-label="Delete resource"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    </>
                  ) : (
                    <section className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                      <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                      <h2 className="text-base font-bold text-slate-900">No lessons in this module</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {isStaff ? 'Add the first lesson for this module from the controls above.' : 'Published lessons will appear here when they are ready.'}
                      </p>
                    </section>
                  )}
                </div>
              </article>
            )
          ) : null}
        </main>
      </section>
    </div>
  );
}

export default function Modules() {
  return <CurriculumManager />;
}
