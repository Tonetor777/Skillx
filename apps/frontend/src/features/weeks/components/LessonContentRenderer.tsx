import React from 'react';

import {
  getSafeLinkHref,
  parseLessonContent,
  type LessonContentMark,
  type LessonContentNode,
} from '../utils/lessonContent';

type LessonContentRendererProps = {
  content?: string | null;
};

const renderMarkedText = (text: string, marks: LessonContentMark[] | undefined, key: string): React.ReactNode => {
  let node: React.ReactNode = text;

  marks?.forEach((mark) => {
    if (mark.type === 'bold') {
      node = <strong key={`${key}-bold`}>{node}</strong>;
    }
    if (mark.type === 'italic') {
      node = <em key={`${key}-italic`}>{node}</em>;
    }
    if (mark.type === 'code') {
      node = <code key={`${key}-code`} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-800">{node}</code>;
    }
    if (mark.type === 'link') {
      const href = getSafeLinkHref(mark.attrs?.href);
      if (href) {
        node = (
          <a key={`${key}-link`} href={href} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline underline-offset-4">
            {node}
          </a>
        );
      }
    }
  });

  return <React.Fragment key={key}>{node}</React.Fragment>;
};

const renderChildren = (content: LessonContentNode[] | undefined, keyPrefix: string): React.ReactNode[] => {
  return content?.map((node, index) => renderNode(node, `${keyPrefix}-${index}`)) ?? [];
};

const renderNode = (node: LessonContentNode, key: string): React.ReactNode => {
  if (node.type === 'text') {
    return renderMarkedText(node.text ?? '', node.marks, key);
  }

  if (node.type === 'hardBreak') {
    return <br key={key} />;
  }

  if (node.type === 'heading') {
    const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 2;
    const className = level === 1
      ? 'mt-6 text-2xl font-bold text-slate-950'
      : level === 2
        ? 'mt-5 text-xl font-bold text-slate-950'
        : 'mt-4 text-lg font-bold text-slate-900';
    const children = renderChildren(node.content, key);

    if (level === 1) return <h1 key={key} className={className}>{children}</h1>;
    if (level === 2) return <h2 key={key} className={className}>{children}</h2>;
    return <h3 key={key} className={className}>{children}</h3>;
  }

  if (node.type === 'paragraph') {
    const children = renderChildren(node.content, key);
    return <p key={key} className="leading-7 text-slate-700">{children.length > 0 ? children : '\u00a0'}</p>;
  }

  if (node.type === 'bulletList') {
    return <ul key={key} className="list-disc space-y-2 pl-6 text-slate-700">{renderChildren(node.content, key)}</ul>;
  }

  if (node.type === 'orderedList') {
    return <ol key={key} className="list-decimal space-y-2 pl-6 text-slate-700">{renderChildren(node.content, key)}</ol>;
  }

  if (node.type === 'listItem') {
    return <li key={key} className="pl-1 leading-7">{renderChildren(node.content, key)}</li>;
  }

  if (node.type === 'blockquote') {
    return (
      <blockquote key={key} className="border-l-4 border-slate-300 bg-slate-50 px-4 py-3 text-slate-700">
        {renderChildren(node.content, key)}
      </blockquote>
    );
  }

  if (node.type === 'codeBlock') {
    return (
      <pre key={key} className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-50">
        <code>{node.content?.map((child) => child.text ?? '').join('')}</code>
      </pre>
    );
  }

  return <React.Fragment key={key}>{renderChildren(node.content, key)}</React.Fragment>;
};

export function LessonContentRenderer({ content }: LessonContentRendererProps) {
  const parsed = parseLessonContent(content);

  if (parsed.kind === 'text') {
    const paragraphs = parsed.text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) return null;

    return (
      <article className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-7 text-slate-700">{paragraph}</p>
        ))}
      </article>
    );
  }

  return (
    <article className="space-y-4">
      {(parsed.document.content ?? []).map((node, index) => renderNode(node, `lesson-node-${index}`))}
    </article>
  );
}
