export {
  createRichContentDocumentFromText as createLessonDocumentFromText,
  emptyRichContentDocument as emptyLessonDocument,
  getSafeLinkHref,
  getYouTubeVideoId,
  getYouTubeVideoIdsFromContent,
  hydrateRichContentImages as hydrateLessonDocumentImages,
  isRichContentDocument as isLessonContentDocument,
  parseRichContent as parseLessonContent,
  richContentHasRenderableContent as lessonContentHasRenderableContent,
  richContentToTextLines as lessonContentToTextLines,
  serializeRichContentDocument as serializeLessonDocument,
  stripTransientImageSources,
} from '../../../shared/rich-content/utils';

export type {
  ParsedRichContent as ParsedLessonContent,
  RichContentDocument as LessonContentDocument,
  RichContentImageAsset as LessonImageAsset,
  RichContentMark as LessonContentMark,
  RichContentNode as LessonContentNode,
} from '../../../shared/rich-content/utils';

