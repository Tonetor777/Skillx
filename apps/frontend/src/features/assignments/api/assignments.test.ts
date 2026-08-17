import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./assignments.ts', import.meta.url), 'utf8');

test('assignment API hooks support update and delete management actions', () => {
  assert.ok(source.includes('useUpdateAssignment'));
  assert.ok(source.includes("apiClient.patch(`/assignments/${id}`"));
  assert.ok(source.includes('useDeleteAssignment'));
  assert.ok(source.includes("apiClient.delete(`/assignments/${id}`"));
});

test('assignment mutations refresh related dashboard data', () => {
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['submissions'] })"));
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })"));
});

test('assignment API hooks expose manual grading for missing submissions', () => {
  assert.ok(source.includes('useManualGradeAssignment'));
  assert.ok(source.includes('`/assignments/${assignmentId}/manual-grade`'));
  assert.ok(source.includes('student_id, grade, feedback'));
});
