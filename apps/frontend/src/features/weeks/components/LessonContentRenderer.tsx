import React from 'react';

import {
  getSafeLinkHref,
  getYouTubeVideoId,
  getYouTubeVideoIdsFromContent,
  parseLessonContent,
  type LessonImageAsset,
  type LessonContentMark,
  type LessonContentNode,
} from '../utils/lessonContent';

type LessonContentRendererProps = {
  content?: string | null;
  images?: LessonImageAsset[];
  hideYouTubeLinks?: boolean;
};

const imageUrlByAssetId = (images: LessonImageAsset[]) => {
  return new Map(images.map((image) => [image.id, image]));
};

const YOUTUBE_URL_PATTERN = /https?:\/\/[^\s<>"')]+/g;

const stripYouTubeUrlsFromText = (text: string): string => {
  return text
    .replace(YOUTUBE_URL_PATTERN, (match) => getYouTubeVideoId(match) ? '' : match)
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const renderMarkedText = (text: string, marks: LessonContentMark[] | undefined, key: string, hideYouTubeLinks: boolean): React.ReactNode => {
  let displayText = text;

  if (hideYouTubeLinks) {
    const linkMark = marks?.find((mark) => mark.type === 'link' && typeof mark.attrs?.href === 'string');
    const linkHref = typeof linkMark?.attrs?.href === 'string' ? linkMark.attrs.href : '';
    if (linkHref && getYouTubeVideoId(linkHref)) {
      return null;
    }
    displayText = stripYouTubeUrlsFromText(text);
    if (!displayText) return null;
  }

  let node: React.ReactNode = displayText;

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

const renderChildren = (
  content: LessonContentNode[] | undefined,
  keyPrefix: string,
  images: Map<string, LessonImageAsset>,
  hideYouTubeLinks: boolean,
): React.ReactNode[] => {
  return content?.map((node, index) => renderNode(node, `${keyPrefix}-${index}`, images, hideYouTubeLinks)).filter(Boolean) ?? [];
};

const renderNode = (node: LessonContentNode, key: string, images: Map<string, LessonImageAsset>, hideYouTubeLinks: boolean): React.ReactNode => {
  if (node.type === 'text') {
    return renderMarkedText(node.text ?? '', node.marks, key, hideYouTubeLinks);
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
    const children = renderChildren(node.content, key, images, hideYouTubeLinks);

    if (level === 1) return <h1 key={key} className={className}>{children}</h1>;
    if (level === 2) return <h2 key={key} className={className}>{children}</h2>;
    return <h3 key={key} className={className}>{children}</h3>;
  }

  if (node.type === 'paragraph') {
    const children = renderChildren(node.content, key, images, hideYouTubeLinks);
    if (hideYouTubeLinks && children.length === 0) return null;
    return <p key={key} className="leading-7 text-slate-700">{children.length > 0 ? children : '\u00a0'}</p>;
  }

  if (node.type === 'bulletList') {
    return <ul key={key} className="list-disc space-y-2 pl-6 text-slate-700">{renderChildren(node.content, key, images, hideYouTubeLinks)}</ul>;
  }

  if (node.type === 'orderedList') {
    return <ol key={key} className="list-decimal space-y-2 pl-6 text-slate-700">{renderChildren(node.content, key, images, hideYouTubeLinks)}</ol>;
  }

  if (node.type === 'listItem') {
    return <li key={key} className="pl-1 leading-7">{renderChildren(node.content, key, images, hideYouTubeLinks)}</li>;
  }

  if (node.type === 'blockquote') {
    return (
      <blockquote key={key} className="border-l-4 border-slate-300 bg-slate-50 px-4 py-3 text-slate-700">
        {renderChildren(node.content, key, images, hideYouTubeLinks)}
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

  if (node.type === 'image') {
    const assetId = typeof node.attrs?.asset_id === 'string' ? node.attrs.asset_id : '';
    const image = images.get(assetId);
    if (!image?.image_url) return null;
    const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : image.alt_text ?? '';
    return (
      <figure key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <img src={image.image_url} alt={alt} className="h-auto max-h-[520px] w-full object-contain" loading="lazy" />
        {alt && <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">{alt}</figcaption>}
      </figure>
    );
  }

  return <React.Fragment key={key}>{renderChildren(node.content, key, images, hideYouTubeLinks)}</React.Fragment>;
};

function YouTubeEmbeds({ videoIds }: { videoIds: string[] }) {
  if (videoIds.length === 0) return null;

  return (
    <section className="space-y-4 pt-2">
      {videoIds.map((videoId) => (
        <div key={videoId} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          <iframe
            title={`YouTube video ${videoId}`}
            src={`https://www.youtube.com/embed/${videoId}`}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ))}
    </section>
  );
}

export function LessonContentRenderer({ content, images = [], hideYouTubeLinks = false }: LessonContentRendererProps) {
  const parsed = parseLessonContent(content);
  const videoIds = getYouTubeVideoIdsFromContent(content);
  const imageMap = imageUrlByAssetId(images);

  if (parsed.kind === 'text') {
    const paragraphs = parsed.text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .map((paragraph) => hideYouTubeLinks ? stripYouTubeUrlsFromText(paragraph) : paragraph)
      .filter(Boolean);

    if (paragraphs.length === 0) return null;

    return (
      <article className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-7 text-slate-700">{paragraph}</p>
        ))}
        <YouTubeEmbeds videoIds={videoIds} />
      </article>
    );
  }

  return (
    <article className="space-y-4">
      {(parsed.document.content ?? []).map((node, index) => renderNode(node, `lesson-node-${index}`, imageMap, hideYouTubeLinks))}
      <YouTubeEmbeds videoIds={videoIds} />
    </article>
  );
}
