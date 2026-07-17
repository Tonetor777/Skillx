import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { beforeEach, test } from 'node:test';

import { apiClient, ApiError, clearStoredTokens, getStoredTokens, scopeProgramsForAuthUser, setStoredTokens } from './client';
import type { Cohort, Program, User } from '../types';

class MemoryStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage() as unknown as Storage;
  clearStoredTokens();
});

test('apiClient normalizes endpoint paths before fetching the Django API', async () => {
  let requestedUrl = '';
  globalThis.fetch = (async (url: RequestInfo | URL) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  await apiClient.get('/programs');

  assert.equal(requestedUrl, 'http://localhost:8000/api/programs/');
});

test('apiClient surfaces network errors instead of silently falling back to mocks by default', async () => {
  globalThis.fetch = (async () => {
    throw new TypeError('Failed to fetch');
  }) as typeof fetch;

  await assert.rejects(() => apiClient.get('/programs'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.message, 'Failed to fetch');
    return true;
  });
});

test('apiClient does not write debug logs in production-facing request paths', () => {
  const source = readFileSync(new URL('./client.ts', import.meta.url), 'utf8');

  assert.equal(source.includes('console.log'), false);
  assert.equal(source.includes('console.error'), false);
});

test('apiClient refreshes an expired access token and retries the original request', async () => {
  const user = createUserFixture();
  setStoredTokens('expired-access', 'valid-refresh', user);
  const requests: Array<{ url: string; authorization?: string }> = [];

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(url),
      authorization: init?.headers instanceof Headers
        ? init.headers.get('Authorization') ?? undefined
        : (init?.headers as Record<string, string> | undefined)?.Authorization,
    });
    if (requests.length === 1) {
      return new Response(JSON.stringify({ detail: 'Given token not valid for any token type' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (String(url).endsWith('/auth/token/refresh/')) {
      return new Response(JSON.stringify({ access: 'fresh-access' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  await apiClient.get('/announcements');

  assert.equal(requests.length, 3);
  assert.equal(requests[0].authorization, 'Bearer expired-access');
  assert.equal(requests[2].authorization, 'Bearer fresh-access');
  assert.equal(getStoredTokens().access, 'fresh-access');
  assert.equal(getStoredTokens().refresh, 'valid-refresh');
});

test('apiClient clears session and hides raw JWT errors when refresh token is invalid', async () => {
  setStoredTokens('expired-access', 'expired-refresh', createUserFixture());

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    const isRefresh = String(url).endsWith('/auth/token/refresh/');
    return new Response(JSON.stringify({ detail: 'Given token not valid for any token type' }), {
      status: isRefresh ? 401 : 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  await assert.rejects(() => apiClient.get('/announcements'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message, 'Session expired. Please log in again.');
    assert.equal(error.message.includes('Given token not valid'), false);
    return true;
  });
  assert.equal(getStoredTokens().access, null);
  assert.equal(getStoredTokens().refresh, null);
  assert.equal(getStoredTokens().user, null);
});

test('mock program scoping returns only the enrolled program for students', () => {
  const programs = createProgramFixtures();
  const student = createUserFixture({ role: 'student', cohort_id: 'coh_frontend' });
  const scopedPrograms = scopeProgramsForAuthUser(programs, student, createCohortFixtures());

  assert.deepEqual(scopedPrograms.map(program => program.id), ['prg_frontend']);
});

test('mock program scoping preserves full visibility for staff users', () => {
  const programs = createProgramFixtures();
  const admin = createUserFixture({ role: 'admin' });
  const scopedPrograms = scopeProgramsForAuthUser(programs, admin, createCohortFixtures());

  assert.deepEqual(scopedPrograms.map(program => program.id), ['prg_frontend', 'prg_ai']);
});

test('mock program detail guards reject programs outside the student cohort', () => {
  const source = readFileSync(new URL('./client.ts', import.meta.url), 'utf8');

  assert.ok(source.includes("authUser?.role === 'student'"));
  assert.ok(source.includes('!scopedPrograms.some(program => program.id === progId)'));
  assert.ok(source.includes("throw new ApiError(404, 'Program not found')"));
});

function createUserFixture(overrides: Partial<User> = {}): User {
  return {
    id: 'usr_fixture',
    email: 'fixture@skilix.com',
    first_name: 'Fixture',
    last_name: 'User',
    role: 'student',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function createProgramFixtures(): Program[] {
  return [
    {
      id: 'prg_frontend',
      name: 'Frontend',
      description: 'Frontend program',
      weeks: [],
      cohorts_count: 1,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'prg_ai',
      name: 'AI',
      description: 'AI program',
      weeks: [],
      cohorts_count: 1,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
    },
  ];
}

function createCohortFixtures(): Cohort[] {
  return [
    {
      id: 'coh_frontend',
      name: 'Frontend Cohort',
      program_id: 'prg_frontend',
      program_name: 'Frontend',
      start_date: '2026-01-01',
      end_date: '2026-03-01',
      is_active: true,
      students_count: 1,
      teachers: [],
      status: 'active',
      current_week: 1,
      duration_weeks: 12,
      leaderboard_visible: true,
      assignment_weight: 90,
      attendance_weight: 10,
    },
  ];
}
