import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const avatarSource = readFileSync('src/shared/components/ui/UserAvatar.tsx', 'utf8');
const layoutSource = readFileSync('src/shared/components/layout/DashboardLayout.tsx', 'utf8');
const profileSource = readFileSync('src/pages/dashboard/Profile.tsx', 'utf8');
const mockDbSource = readFileSync('src/shared/api/mockDb.ts', 'utf8');
const mockImageHost = ['images', 'unsplash', 'com'].join('.');

test('profile surfaces use local initials fallback instead of mock image URLs', () => {
  assert.ok(avatarSource.includes('getInitials'));
  assert.ok(avatarSource.includes('if (src)'));
  assert.ok(layoutSource.includes('<UserAvatar'));
  assert.ok(profileSource.includes('<UserAvatar'));

  const profileSources = [avatarSource, layoutSource, profileSource, mockDbSource].join('\n');
  assert.equal(profileSources.includes(mockImageHost), false);
});
