import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Undo2,
  Unlink,
} from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import {
  createLessonDocumentFromText,
  emptyLessonDocument,
  parseLessonContent,
  serializeLessonDocument,
  type LessonContentDocument,
} from '../utils/lessonContent';

type RichLessonEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

const editorContentFromValue = (value: string): LessonContentDocument => {
  const parsed = parseLessonContent(value);
  return parsed.kind === 'document' ? parsed.document : createLessonDocumentFromText(parsed.text);
};

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-slate-600 transition ${
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-400 hover:text-slate-950'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function RichLessonEditor({ value, onChange }: RichLessonEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        autolink: true,
        defaultProtocol: 'https',
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Write the lesson students will read here...',
      }),
    ],
    content: editorContentFromValue(value),
    editorProps: {
      attributes: {
        class: 'min-h-56 rounded-b-lg border-x border-b border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON() as LessonContentDocument;
      onChange(currentEditor.isEmpty ? '' : serializeLessonDocument(json));
    },
  });

  useEffect(() => {
    if (!editor) return;

    const current = serializeLessonDocument(editor.getJSON() as LessonContentDocument);
    const next = serializeLessonDocument(editorContentFromValue(value));
    if (current !== next) {
      editor.commands.setContent(value ? editorContentFromValue(value) : emptyLessonDocument, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-56 rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
        Loading lesson editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Lesson link URL', previousUrl ?? '');

    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-t-lg border border-slate-200 bg-slate-50 p-2">
        <ToolbarButton label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Add link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Remove link" disabled={!editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
