import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./cohorts.ts', import.meta.url), 'utf8');

test('cohort API hooks support empty-cohort deletion', () => {
  assert.ok(source.includes('useDeleteCohort'));
  assert.ok(source.includes("apiClient.delete(`/cohorts/${id}`"));
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['cohorts'] })"));
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['programs'] })"));
});
