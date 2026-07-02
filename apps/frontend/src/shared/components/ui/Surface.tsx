import React from 'react';

interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export default function Surface({ children, className = '' }: SurfaceProps) {
  return <section className={`skx-surface p-5 md:p-6 ${className}`}>{children}</section>;
}
