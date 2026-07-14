import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/pages/dashboard/Announcements.tsx', 'utf8');

test('announcements page exposes unread notification controls', () => {
  assert.ok(source.includes('useAnnouncementUnreadCount'));
  assert.ok(source.includes('useMarkAnnouncementRead'));
  assert.ok(source.includes('useMarkAllAnnouncementsRead'));
  assert.ok(source.includes('Mark all read'));
  assert.ok(source.includes('Mark read'));
});

test('announcements page visually distinguishes unread notices', () => {
  assert.ok(source.includes('!ann.is_read'));
  assert.ok(source.includes('New'));
  assert.ok(source.includes('border-indigo-200'));
});
