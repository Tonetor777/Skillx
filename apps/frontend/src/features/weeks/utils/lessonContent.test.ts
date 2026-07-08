import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createLessonDocumentFromText,
  getSafeLinkHref,
  lessonContentHasRenderableContent,
  lessonContentToTextLines,
  parseLessonContent,
  serializeLessonDocument,
} from './lessonContent';

test('lesson content utilities serialize and parse TipTap JSON documents', () => {
  const document = createLessonDocumentFromText('Intro\n\nPractice');
  const serialized = serializeLessonDocument(document);
  const parsed = parseLessonContent(serialized);

  assert.equal(parsed.kind, 'document');
  assert.deepEqual(lessonContentToTextLines(serialized), ['Intro', 'Practice']);
});

test('lesson content utilities preserve plain text fallback behavior', () => {
  const parsed = parseLessonContent('Legacy lesson body\n\nSecond paragraph');

  assert.equal(parsed.kind, 'text');
  assert.deepEqual(lessonContentToTextLines('Legacy lesson body\n\nSecond paragraph'), ['Legacy lesson body', 'Second paragraph']);
  assert.equal(lessonContentHasRenderableContent('Legacy lesson body'), true);
});

test('lesson content utilities treat invalid or non-document JSON as text', () => {
  assert.equal(parseLessonContent('{bad json').kind, 'text');
  assert.equal(parseLessonContent('{"type":"paragraph"}').kind, 'text');
});

test('lesson content utilities detect empty rendered content', () => {
  assert.equal(lessonContentHasRenderableContent(''), false);
  assert.equal(lessonContentHasRenderableContent('   '), false);
  assert.equal(lessonContentHasRenderableContent(serializeLessonDocument({ type: 'doc', content: [{ type: 'paragraph' }] })), false);
});

test('lesson content utilities allow only safe rendered links', () => {
  assert.equal(getSafeLinkHref('https://example.com'), 'https://example.com');
  assert.equal(getSafeLinkHref('mailto:teacher@example.com'), 'mailto:teacher@example.com');
  assert.equal(getSafeLinkHref('javascript:alert(1)'), null);
});
