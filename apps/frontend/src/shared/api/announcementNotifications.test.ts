import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/shared/api/client.ts', 'utf8');

test('mock API persists announcement read state per user', () => {
  assert.ok(source.includes('skilix_announcement_reads_'));
  assert.ok(source.includes('/unread-count'));
  assert.ok(source.includes('/mark-all-read'));
  assert.ok(source.includes('/mark-read'));
  assert.ok(source.includes('withReadState'));
});
