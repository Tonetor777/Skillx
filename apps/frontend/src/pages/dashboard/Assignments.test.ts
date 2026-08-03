import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./Assignments.tsx', import.meta.url), 'utf8');

test('assignment dashboard exposes staff edit and delete-or-lock controls', () => {
  assert.ok(source.includes('openEditAssignment(asg)'));
  assert.ok(source.includes('handleDeleteOrLockAssignment(asg)'));
  assert.ok(source.includes("assignmentSubmissionCount > 0 ? 'Lock' : 'Delete'"));
});

test('assignment dashboard blocks student submissions for locked assignments', () => {
  assert.ok(source.includes('Submission Closed'));
  assert.ok(source.includes('This assignment is locked and no longer accepts submissions.'));
  assert.ok(source.includes("asg.is_locked ? 'View Closed' : 'Submit solution'"));
});

test('assignment dashboard uses rich assignment descriptions without raw JSON previews', () => {
  assert.ok(source.includes('RichContentEditor'));
  assert.ok(source.includes('RichContentRenderer'));
  assert.ok(source.includes('richContentPreviewText(asg.description)'));
});

test('assignment dashboard exposes full submission details and student history for staff', () => {
  assert.ok(source.includes('View Full'));
  assert.ok(source.includes('Full Submission Content'));
  assert.ok(source.includes('Student Submission History'));
  assert.ok(source.includes('setHistoryStudentId(sub.student_id)'));
});
