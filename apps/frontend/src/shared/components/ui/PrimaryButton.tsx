import React from 'react';

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function PrimaryButton({ children, className = '', type = 'button', ...props }: PrimaryButtonProps) {
  return (
    <button type={type} className={`skx-primary-btn ${className}`} {...props}>
      {children}
    </button>
  );
}
