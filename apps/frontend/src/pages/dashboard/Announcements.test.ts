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

test('announcements filters are limited to announcement managers', () => {
  assert.ok(source.includes('const isStaffAnnouncementManager = can.createAnnouncements(user.role)'));
  assert.ok(source.includes('isStaffAnnouncementManager ? announcements?.filter'));
  assert.ok(source.includes('{isStaffAnnouncementManager && ('));
  assert.ok(source.includes('All Notices'));
  assert.ok(source.includes('System-Wide'));
  assert.ok(source.includes('`${type} Scoped`'));
});

test('student announcement empty state does not mention filters', () => {
  assert.ok(source.includes("'No announcements.'"));
  assert.ok(source.includes("'There are no notices matching this filter.'"));
  assert.ok(source.includes("isStaffAnnouncementManager ? 'There are no notices matching this filter.' : 'No announcements.'"));
});
