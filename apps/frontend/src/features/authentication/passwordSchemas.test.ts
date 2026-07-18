import assert from 'node:assert/strict';
import test from 'node:test';

import { passwordConfirmationSchema } from './passwordSchemas';

test('password confirmation schema accepts matching passwords', () => {
  const result = passwordConfirmationSchema.safeParse({
    password: 'student-password',
    confirmPassword: 'student-password',
  });

  assert.equal(result.success, true);
});

test('password confirmation schema rejects mismatched passwords', () => {
  const result = passwordConfirmationSchema.safeParse({
    password: 'student-password',
    confirmPassword: 'different-password',
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0]?.path[0], 'confirmPassword');
    assert.equal(result.error.issues[0]?.message, 'Passwords do not match');
  }
});
