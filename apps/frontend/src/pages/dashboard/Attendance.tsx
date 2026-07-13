import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { useCohorts } from '../../features/cohorts/api/cohorts';
import {
  useAttendanceSessions,
  useCohortGradeSettings,
  useCreateAttendanceSession,
  useSaveAttendanceRecords,
  useUpdateCohortGradeSettings,
} from '../../features/attendance/api/attendance';
import type { AttendanceStatus } from '../../shared/types';

const attendanceOptions: Array<{ value: AttendanceStatus; label: string; className: string }> = [
  { value: 'present', label: 'Present', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { value: 'late', label: 'Late', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  { value: 'excused', label: 'Excused', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'absent', label: 'Absent', className: 'border-rose-200 bg-rose-50 text-rose-700' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const { user } = useAuth();
  const { data: cohorts = [], isLoading: cohortsLoading } = useCohorts();
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [date, setDate] = useState(today());
  const [title, setTitle] = useState('');
  const [assignmentWeight, setAssignmentWeight] = useState(90);
  const [attendanceWeight, setAttendanceWeight] = useState(10);
  const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>({});
  const [noteByStudent, setNoteByStudent] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  const selectedCohort = cohorts.find((cohort) => cohort.id === selectedCohortId) ?? cohorts[0];
  const effectiveCohortId = selectedCohort?.id ?? '';
  const { data: sessions = [], isLoading: sessionsLoading } = useAttendanceSessions(effectiveCohortId);
  const { data: settings } = useCohortGradeSettings(effectiveCohortId);
  const createSession = useCreateAttendanceSession();
  const saveRecords = useSaveAttendanceRecords();
  const updateSettings = useUpdateCohortGradeSettings();

  const selectedSession = useMemo(() => {
    return sessions.find((session) => session.date === date) ?? sessions[0];
  }, [date, sessions]);

  useEffect(() => {
    if (!selectedCohortId && cohorts.length > 0) {
      setSelectedCohortId(cohorts[0].id);
    }
  }, [cohorts, selectedCohortId]);

  useEffect(() => {
    if (settings) {
      setAssignmentWeight(Number(settings.assignment_weight));
      setAttendanceWeight(Number(settings.attendance_weight));
    }
  }, [settings]);

  useEffect(() => {
    if (!selectedSession) {
      setStatusByStudent({});
      setNoteByStudent({});
      return;
    }
    const nextStatuses: Record<string, AttendanceStatus> = {};
    const nextNotes: Record<string, string> = {};
    selectedSession.records.forEach((record) => {
      nextStatuses[record.student_id] = record.status;
      nextNotes[record.student_id] = record.note;
    });
    selectedCohort?.students?.forEach((student) => {
      nextStatuses[student.id] = nextStatuses[student.id] ?? 'present';
      nextNotes[student.id] = nextNotes[student.id] ?? '';
    });
    setStatusByStudent(nextStatuses);
    setNoteByStudent(nextNotes);
    setTitle(selectedSession.title || '');
    setDate(selectedSession.date);
  }, [selectedCohort, selectedSession]);

  if (!user) return null;

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2500);
  };

  const handleSaveWeights = async () => {
    if (!effectiveCohortId) return;
    await updateSettings.mutateAsync({
      cohortId: effectiveCohortId,
      assignment_weight: assignmentWeight,
      attendance_weight: attendanceWeight,
    });
    showMessage('Grade weights updated.');
  };

  const handleSaveAttendance = async () => {
    if (!effectiveCohortId || !selectedCohort) return;
    const session = selectedSession?.date === date
      ? selectedSession
      : await createSession.mutateAsync({ cohort_id: effectiveCohortId, date, title });
    if (!session) return;
    await saveRecords.mutateAsync({
      sessionId: session.id,
      records: (selectedCohort.students ?? []).map((student) => ({
        student_id: student.id,
        status: statusByStudent[student.id] ?? 'present',
        note: noteByStudent[student.id] ?? '',
      })),
    });
    showMessage('Attendance saved.');
  };

  const isBusy = cohortsLoading || sessionsLoading || createSession.isPending || saveRecords.isPending || updateSettings.isPending;

  return (
    <div className="space-y-8">
      {message && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <Check className="h-4 w-4" />
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4 border-b border-[#d8d8d4] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="skx-page-label">Attendance</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">Attendance</h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Cohort attendance and grade weighting</p>
          <p className="mt-2 text-sm text-[#5f5f5a]">Record class attendance and decide how much it contributes to total grade.</p>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Cohort</span>
                <select
                  value={effectiveCohortId}
                  onChange={(event) => setSelectedCohortId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>{cohort.name} · {cohort.program_name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Class date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Session title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Optional class title"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Student roster</h2>
                <p className="mt-1 text-sm text-slate-500">Present and excused count full, late counts half, absent counts zero.</p>
              </div>
              <button type="button" onClick={handleSaveAttendance} disabled={isBusy || !selectedCohort?.students?.length} className="skx-primary-btn disabled:opacity-50">
                {saveRecords.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Attendance
              </button>
            </div>

            {!selectedCohort?.students?.length ? (
              <div className="p-10 text-center">
                <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800">No students in this cohort yet</h3>
                <p className="mt-1 text-sm text-slate-500">Accepted students will appear here for attendance recording.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedCohort.students.map((student) => (
                  <div key={student.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(180px,240px)] lg:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{student.name}</p>
                      <p className="truncate text-xs text-slate-500">{student.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attendanceOptions.map((option) => {
                        const active = (statusByStudent[student.id] ?? 'present') === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setStatusByStudent((current) => ({ ...current, [student.id]: option.value }))}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${active ? option.className : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      value={noteByStudent[student.id] ?? ''}
                      onChange={(event) => setNoteByStudent((current) => ({ ...current, [student.id]: event.target.value }))}
                      placeholder="Note"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Grade weights</h2>
            <p className="mt-1 text-sm text-slate-500">Weights must total 100%.</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Assignments %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={assignmentWeight}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setAssignmentWeight(value);
                    setAttendanceWeight(100 - value);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Attendance %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={attendanceWeight}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setAttendanceWeight(value);
                    setAssignmentWeight(100 - value);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={handleSaveWeights}
                disabled={isBusy || assignmentWeight + attendanceWeight !== 100}
                className="skx-primary-btn w-full justify-center disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Weights
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Recorded sessions</h2>
            <div className="mt-4 space-y-2">
              {sessions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">No attendance sessions yet.</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setDate(session.date);
                      setTitle(session.title || '');
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${session.date === date ? 'border-slate-900 bg-slate-50 text-slate-950' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="block font-bold">{new Date(session.date).toLocaleDateString()}</span>
                    <span className="mt-0.5 block text-xs">{session.title || `${session.records.length} records`}</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
