import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync('src/features/announcements/api/announcements.ts', 'utf8');

test('announcement API hooks include unread notification actions', () => {
  assert.ok(source.includes('useAnnouncementUnreadCount'));
  assert.ok(source.includes("apiClient.get('/announcements/unread-count')"));
  assert.ok(source.includes('useMarkAnnouncementRead'));
  assert.ok(source.includes("apiClient.post(`/announcements/${id}/mark-read`"));
  assert.ok(source.includes('useMarkAllAnnouncementsRead'));
  assert.ok(source.includes("apiClient.post('/announcements/mark-all-read'"));
});

test('announcement notification mutations refresh announcements and unread count', () => {
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['announcements'] })"));
  assert.ok(source.includes("queryClient.invalidateQueries({ queryKey: ['announcement-unread-count'] })"));
});
