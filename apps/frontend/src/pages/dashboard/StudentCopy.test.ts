import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const dashboardSources = [
  'src/pages/dashboard/Announcements.tsx',
  'src/pages/dashboard/Assignments.tsx',
  'src/pages/dashboard/Overview.tsx',
  'src/pages/dashboard/Profile.tsx',
  'src/pages/dashboard/Programs.tsx',
  'src/pages/dashboard/Weeks.tsx',
].map((path) => readFileSync(path, 'utf8').replace(/user\.role !== 'student'[\s\S]*?\)\}/g, ''));

test('student dashboard pages avoid broad helper copy', () => {
  const combinedSource = dashboardSources.join('\n');
  [
    'Broadcast platform-wide updates',
    'Browse course checkpoints',
    'Review your credentials',
    'Browse currucula',
    'Browse curricula',
    'structured cohort curriculum',
    'Published lessons for your cohort will appear here',
    'No upcoming course checkpoints',
    'No recent announcements or notifications are posted',
    'Cohort Registration Checklist',
  ].forEach((phrase) => assert.equal(combinedSource.includes(phrase), false, phrase));
});
