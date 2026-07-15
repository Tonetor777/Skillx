import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./programs.ts', import.meta.url), 'utf8');

test('program API hooks support empty-program deletion', () => {
  assert.ok(source.includes('useDeleteProgram'));
  assert.ok(source.includes("apiClient.delete(`/programs/${id}`"));
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['programs'] })"));
});
