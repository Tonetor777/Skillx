import React from 'react';

type StatusTone = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-[#d8d8d4] bg-white text-[#40403b]',
};

export default function StatusMessage({ children, tone = 'info', className = '' }: StatusMessageProps) {
  return <div className={`border p-3 text-sm font-medium ${toneClasses[tone]} ${className}`}>{children}</div>;
}
