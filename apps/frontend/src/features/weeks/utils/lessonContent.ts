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

export type LessonImageAsset = {
  id: string;
  image_url: string;
  alt_text?: string;
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
  return JSON.stringify(stripTransientImageSources(document));
};

const nodeHasText = (node: LessonContentNode): boolean => {
  if (node.type === 'image' && typeof node.attrs?.asset_id === 'string' && node.attrs.asset_id.trim().length > 0) {
    return true;
  }
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

const mapLessonContentNode = (
  node: LessonContentNode,
  mapper: (node: LessonContentNode) => LessonContentNode,
): LessonContentNode => {
  const nextNode = node.content
    ? { ...node, content: node.content.map((child) => mapLessonContentNode(child, mapper)) }
    : { ...node };
  return mapper(nextNode);
};

export const stripTransientImageSources = (document: LessonContentDocument): LessonContentDocument => {
  return {
    ...document,
    content: document.content?.map((node) => mapLessonContentNode(node, (currentNode) => {
      if (currentNode.type !== 'image' || typeof currentNode.attrs?.asset_id !== 'string') {
        return currentNode;
      }
      const { src, ...attrs } = currentNode.attrs;
      void src;
      return { ...currentNode, attrs };
    })),
  };
};

export const hydrateLessonDocumentImages = (
  document: LessonContentDocument,
  images: LessonImageAsset[] = [],
): LessonContentDocument => {
  const imageById = new Map(images.map((image) => [image.id, image]));
  return {
    ...document,
    content: document.content?.map((node) => mapLessonContentNode(node, (currentNode) => {
      if (currentNode.type !== 'image' || typeof currentNode.attrs?.asset_id !== 'string') {
        return currentNode;
      }
      const image = imageById.get(currentNode.attrs.asset_id);
      if (!image?.image_url) {
        return currentNode;
      }
      return {
        ...currentNode,
        attrs: {
          ...currentNode.attrs,
          src: image.image_url,
          alt: typeof currentNode.attrs.alt === 'string' ? currentNode.attrs.alt : image.alt_text ?? '',
        },
      };
    })),
  };
};

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export const getYouTubeVideoId = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'music.youtube.com') {
      const watchId = parsed.searchParams.get('v');
      if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) {
        return watchId;
      }
      const [kind, id] = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts'].includes(kind) && id && YOUTUBE_ID_PATTERN.test(id)) {
        return id;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/g;

const collectYouTubeIdsFromNode = (node: LessonContentNode, ids: Set<string>) => {
  if (typeof node.text === 'string') {
    const matches = node.text.match(URL_PATTERN) ?? [];
    matches.forEach((match) => {
      const id = getYouTubeVideoId(match);
      if (id) ids.add(id);
    });
  }

  node.marks?.forEach((mark) => {
    if (mark.type === 'link' && typeof mark.attrs?.href === 'string') {
      const id = getYouTubeVideoId(mark.attrs.href);
      if (id) ids.add(id);
    }
  });

  node.content?.forEach((child) => collectYouTubeIdsFromNode(child, ids));
};

export const getYouTubeVideoIdsFromContent = (content?: string | null): string[] => {
  const ids = new Set<string>();
  const parsed = parseLessonContent(content);

  if (parsed.kind === 'text') {
    const matches = parsed.text.match(URL_PATTERN) ?? [];
    matches.forEach((match) => {
      const id = getYouTubeVideoId(match);
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }

  parsed.document.content?.forEach((node) => collectYouTubeIdsFromNode(node, ids));
  return Array.from(ids);
};
