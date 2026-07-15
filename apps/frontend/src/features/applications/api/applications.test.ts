import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./applications.ts', import.meta.url), 'utf8');

test('application approval sends selected cohort id', () => {
  assert.ok(source.includes("useMutation<Application, Error, { id: string; cohort_id: string }>"));
  assert.ok(source.includes("apiClient.post(`/applications/${id}/approve`, { cohort_id })"));
});

test('application approval refreshes admissions and cohort data', () => {
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['applications'] })"));
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['cohorts'] })"));
});

test('approved applications can request a fresh invitation link', () => {
  assert.ok(source.includes('useReinviteApplication'));
  assert.ok(source.includes("apiClient.post(`/applications/${id}/reinvite`, {})"));
});
