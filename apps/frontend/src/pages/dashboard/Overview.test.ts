import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/pages/dashboard/Overview.tsx', 'utf8');

test('student overview derives assignment CTA labels from submission state', () => {
  assert.ok(source.includes("'Resubmit'"));
  assert.ok(source.includes("'View Grade'"));
  assert.ok(source.includes("'View Submission'"));
  assert.ok(source.includes("'Closed'"));
});

test('student overview matches submissions to assignment cards', () => {
  assert.ok(source.includes('useSubmissions()'));
  assert.ok(source.includes('sub.assignment_id === asg.id && sub.student_id === user.id'));
  assert.ok(source.includes('{status.ctaLabel}'));
});

test('overview announcement feed highlights unread notices', () => {
  assert.ok(source.includes('!ann.is_read'));
  assert.ok(source.includes('New'));
  assert.ok(source.includes('bg-indigo-50/30'));
});
