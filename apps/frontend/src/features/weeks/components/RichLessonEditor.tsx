import { RichContentEditor } from '../../../shared/rich-content/RichContentEditor';
import type { RichContentImageAsset } from '../../../shared/rich-content/utils';
import { useUploadLessonImage } from '../api/weeks';
import type { LessonImageAsset } from '../utils/lessonContent';

type RichLessonEditorProps = {
  value: string;
  onChange: (value: string) => void;
  lessonId?: string;
  images?: LessonImageAsset[];
};

export function RichLessonEditor({ value, onChange, lessonId, images = [] }: RichLessonEditorProps) {
  const uploadLessonImage = useUploadLessonImage();

  const uploadImage = async (file: File): Promise<RichContentImageAsset> => {
    if (!lessonId) {
      window.alert('Save the lesson before adding images.');
      throw new Error('Save the lesson before adding images.');
    }

    const formData = new FormData();
    formData.append('lesson_id', lessonId);
    formData.append('image', file);
    formData.append('alt_text', file.name.replace(/\.[^.]+$/, ''));

    return uploadLessonImage.mutateAsync(formData);
  };

  return (
    <RichContentEditor
      value={value}
      onChange={onChange}
      placeholder="Write the lesson students will read here..."
      loadingLabel="Loading lesson editor..."
      linkPromptLabel="Lesson link URL"
      images={images}
      onImageUpload={uploadImage}
      imageUploadDisabled={uploadLessonImage.isPending}
    />
  );
}

