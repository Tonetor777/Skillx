export type LessonContentMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type LessonContentNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: LessonContentNode[];
  text?: string;
  marks?: LessonContentMark[];
};

export type LessonContentDocument = {
  type: 'doc';
  content?: LessonContentNode[];
};

export type ParsedLessonContent =
  | { kind: 'document'; document: LessonContentDocument }
  | { kind: 'text'; text: string };

const PARAGRAPH_SEPARATOR = /\n{2,}/;

export const emptyLessonDocument: LessonContentDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isLessonContentDocument = (value: unknown): value is LessonContentDocument => {
  return isObject(value) && value.type === 'doc' && (!('content' in value) || Array.isArray(value.content));
};

export const createLessonDocumentFromText = (content: string): LessonContentDocument => {
  const paragraphs = content
    .split(PARAGRAPH_SEPARATOR)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return emptyLessonDocument;
  }

  return {
    type: 'doc',
    content: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: paragraph }],
    })),
  };
};

export const parseLessonContent = (content?: string | null): ParsedLessonContent => {
  const trimmed = content?.trim() ?? '';

  if (!trimmed) {
    return { kind: 'document', document: emptyLessonDocument };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (isLessonContentDocument(parsed)) {
      return { kind: 'document', document: parsed };
    }
  } catch {
    return { kind: 'text', text: content ?? '' };
  }

  return { kind: 'text', text: content ?? '' };
};

export const serializeLessonDocument = (document: LessonContentDocument): string => {
  return JSON.stringify(document);
};

const nodeHasText = (node: LessonContentNode): boolean => {
  if (typeof node.text === 'string' && node.text.trim().length > 0) {
    return true;
  }
  return node.content?.some(nodeHasText) ?? false;
};

export const lessonContentHasRenderableContent = (content?: string | null): boolean => {
  const parsed = parseLessonContent(content);
  if (parsed.kind === 'text') {
    return parsed.text.trim().length > 0;
  }
  return parsed.document.content?.some(nodeHasText) ?? false;
};

const collectText = (node: LessonContentNode): string => {
  if (node.type === 'hardBreak') {
    return '\n';
  }

  const ownText = node.text ?? '';
  const childText = node.content?.map(collectText).join('') ?? '';
  return ownText + childText;
};

export const lessonContentToTextLines = (content?: string | null): string[] => {
  const parsed = parseLessonContent(content);
  if (parsed.kind === 'text') {
    return parsed.text
      .split(PARAGRAPH_SEPARATOR)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return (parsed.document.content ?? [])
    .map((node) => collectText(node).trim())
    .filter(Boolean);
};

export const getSafeLinkHref = (href: unknown): string | null => {
  if (typeof href !== 'string') return null;

  try {
    const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const parsed = new URL(href, origin);
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return href;
    }
  } catch {
    return null;
  }

  return null;
};
