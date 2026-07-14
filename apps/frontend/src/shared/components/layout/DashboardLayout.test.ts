import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/shared/components/layout/DashboardLayout.tsx', 'utf8');

test('dashboard layout renders announcement unread badge', () => {
  assert.ok(source.includes('useAnnouncementUnreadCount'));
  assert.ok(source.includes("item.name === 'Announcements'"));
  assert.ok(source.includes('unreadAnnouncements > 0'));
  assert.ok(source.includes("unreadAnnouncements > 99 ? '99+' : unreadAnnouncements"));
});
