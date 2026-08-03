import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./Attendance.tsx', import.meta.url), 'utf8');

test('attendance page only reuses a session matching the selected date', () => {
  assert.ok(source.includes('sessions.find((session) => session.date === date);'));
  assert.ok(!source.includes('sessions.find((session) => session.date === date) ?? sessions[0]'));
});
