import React from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  amharicTitle: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, amharicTitle, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#d8d8d4] pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="skx-page-label">{eyebrow}</p>
        <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">{amharicTitle}</h1>
        <p className="mt-2 font-display text-lg font-bold text-[#141414]">{title}</p>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5f5a]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
