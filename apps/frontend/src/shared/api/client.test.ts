import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { apiClient, ApiError, clearStoredTokens } from './client';

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
