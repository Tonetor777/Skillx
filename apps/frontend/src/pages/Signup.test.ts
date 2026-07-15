import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/pages/Signup.tsx', 'utf8');

test('signup form collects age, choice-based experience, and expectations', () => {
  assert.ok(source.includes("register('age')"));
  assert.ok(source.includes("z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']"));
  assert.ok(source.includes("register('expectations')"));
});

test('signup form no longer collects country or motivation fields', () => {
  assert.equal(source.includes("register('country')"), false);
  assert.equal(source.includes("register('motivation')"), false);
});
