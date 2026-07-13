import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createLessonDocumentFromText,
  getSafeLinkHref,
  getYouTubeVideoIdsFromContent,
  hydrateLessonDocumentImages,
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

test('lesson content utilities treat uploaded image nodes as renderable and strip transient URLs', () => {
  const serialized = serializeLessonDocument({
    type: 'doc',
    content: [{ type: 'image', attrs: { asset_id: 'img_1', src: 'https://signed.example/image.png', alt: 'Diagram' } }],
  });
  const parsed = parseLessonContent(serialized);

  assert.equal(serialized.includes('signed.example'), false);
  assert.equal(lessonContentHasRenderableContent(serialized), true);
  assert.equal(parsed.kind, 'document');
});

test('lesson content utilities hydrate image nodes from current image assets', () => {
  const document = hydrateLessonDocumentImages(
    { type: 'doc', content: [{ type: 'image', attrs: { asset_id: 'img_1', alt: 'Diagram' } }] },
    [{ id: 'img_1', image_url: 'https://cdn.example/image.png', alt_text: 'Diagram' }],
  );

  assert.equal(document.content?.[0].attrs?.src, 'https://cdn.example/image.png');
});

test('lesson content utilities extract and deduplicate safe YouTube links', () => {
  const document = serializeLessonDocument({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Watch https://youtu.be/dQw4w9WgXcQ' }] },
      {
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'again',
          marks: [{ type: 'link', attrs: { href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } }],
        }],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Ignore https://example.com/watch?v=dQw4w9WgXcQ' }] },
    ],
  });

  assert.deepEqual(getYouTubeVideoIdsFromContent(document), ['dQw4w9WgXcQ']);
});

test('lesson content utilities support shorts and embed YouTube URL variants', () => {
  assert.deepEqual(
    getYouTubeVideoIdsFromContent('https://www.youtube.com/shorts/dQw4w9WgXcQ\nhttps://youtube.com/embed/abcdefghijk'),
    ['dQw4w9WgXcQ', 'abcdefghijk'],
  );
});
