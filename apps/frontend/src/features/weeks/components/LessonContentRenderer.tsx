import { RichContentRenderer } from '../../../shared/rich-content/RichContentRenderer';
import type { LessonImageAsset } from '../utils/lessonContent';

type LessonContentRendererProps = {
  content?: string | null;
  images?: LessonImageAsset[];
  hideYouTubeLinks?: boolean;
};

export function LessonContentRenderer({ content, images = [], hideYouTubeLinks = false }: LessonContentRendererProps) {
  return <RichContentRenderer content={content} images={images} hideYouTubeLinks={hideYouTubeLinks} />;
}

