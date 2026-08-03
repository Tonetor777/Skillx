import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./submissions.ts', import.meta.url), 'utf8');

test('submission API hooks support assignment and student filters', () => {
  assert.ok(source.includes("params.set('assignment_id', filters.assignmentId)"));
  assert.ok(source.includes("params.set('student_id', filters.studentId)"));
  assert.ok(source.includes("queryKey: ['submissions', filters]"));
});

