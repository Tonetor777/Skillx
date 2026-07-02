import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <section className={`skx-card border-dashed p-10 text-center ${className}`}>
      {icon && <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#d8d8d4] bg-white text-[#737373]">{icon}</div>}
      <h2 className="font-display text-lg font-bold text-[#141414]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5f5f5a]">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </section>
  );
}
