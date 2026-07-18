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

test('dashboard layout compacts desktop sidebar on wide workspace routes', () => {
  assert.ok(source.includes("location.pathname.startsWith('/dashboard/modules') || location.pathname.startsWith('/dashboard/programs')"));
  assert.ok(source.includes('group/sidebar hidden md:flex'));
  assert.ok(source.includes("'w-20 hover:w-64 focus-within:w-64'"));
  assert.ok(source.includes('compactSidebarRevealClass'));
  assert.ok(source.includes('group-hover/sidebar:opacity-100'));
  assert.ok(source.includes('absolute right-2 top-1 min-w-4'));
  assert.ok(source.includes('group-hover/sidebar:static'));
});
