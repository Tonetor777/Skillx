import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/pages/dashboard/Programs.tsx', 'utf8');

test('programs page defensively filters student programs by enrolled cohort', () => {
  assert.ok(source.includes('useCohorts()'));
  assert.ok(source.includes("user.role === 'student' ? cohorts?.find(cohort => cohort.id === user.cohort_id)"));
  assert.ok(source.includes('programs?.filter(program => program.id === enrolledCohort?.program_id)'));
  assert.ok(source.includes('visiblePrograms.map((program)'));
});
