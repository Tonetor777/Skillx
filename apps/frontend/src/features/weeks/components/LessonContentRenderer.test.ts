import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { LessonContentRenderer } from './LessonContentRenderer';
import { serializeLessonDocument } from '../utils/lessonContent';

test('LessonContentRenderer hides YouTube source links while keeping embeds when requested', () => {
  const content = serializeLessonDocument({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Watch this https://youtu.be/dQw4w9WgXcQ' }] },
      {
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'YouTube lesson',
          marks: [{ type: 'link', attrs: { href: 'https://www.youtube.com/watch?v=abcdefghijk' } }],
        }],
      },
    ],
  });

  const html = renderToStaticMarkup(
    React.createElement(LessonContentRenderer, { content, hideYouTubeLinks: true }),
  );

  assert.equal(html.includes('youtu.be/dQw4w9WgXcQ'), false);
  assert.equal(html.includes('youtube.com/watch?v=abcdefghijk'), false);
  assert.equal(html.includes('https://www.youtube.com/embed/dQw4w9WgXcQ'), true);
  assert.equal(html.includes('https://www.youtube.com/embed/abcdefghijk'), true);
  assert.equal(html.includes('Watch this'), true);
});
