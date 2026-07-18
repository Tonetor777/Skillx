import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('browser metadata uses Nexus Academy LMS', () => {
  assert.ok(read('index.html').includes('<title>Nexus Academy LMS</title>'));
  assert.equal(read('index.html').includes('Skilix LMS'), false);
  assert.equal(JSON.parse(read('metadata.json')).name, 'Nexus Academy LMS');
});

test('user-visible frontend branding no longer mentions Skilix', () => {
  const visibleBrandingFiles = [
    'src/pages/Login.tsx',
    'src/pages/Signup.tsx',
    'src/shared/components/layout/DashboardLayout.tsx',
    'src/pages/dashboard/Overview.tsx',
    'src/pages/dashboard/Settings.tsx',
  ];

  for (const file of visibleBrandingFiles) {
    assert.equal(read(file).includes('Skilix'), false, `${file} still contains visible Skilix branding`);
  }
});

test('Nexus branding and logo assets are wired into UI surfaces', () => {
  assert.ok(read('src/pages/Login.tsx').includes('Sign in to Nexus Academy'));
  assert.ok(read('src/pages/Signup.tsx').includes('Sign up to Nexus Academy'));
  assert.ok(read('src/shared/components/layout/DashboardLayout.tsx').includes('Nexus'));
  assert.ok(read('src/shared/components/ui/BrandLogo.tsx').includes('nexus-academy-logo.jpg'));
  assert.ok(read('src/shared/components/ui/BrandLogo.tsx').includes('nexus-academy-x-white-on-black.png'));
});

test('internal skilix identifiers remain unchanged', () => {
  assert.ok(read('src/shared/api/client.ts').includes("'skilix_access_token'"));
  assert.ok(read('src/features/authentication/context/AuthContext.tsx').includes("'skilix-unauthorized'"));
  assert.ok(read('src/shared/api/mockDb.ts').includes("'student@skilix.com'"));
});
