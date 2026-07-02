import React from 'react';

type SecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function SecondaryButton({ children, className = '', type = 'button', ...props }: SecondaryButtonProps) {
  return (
    <button type={type} className={`skx-secondary-btn ${className}`} {...props}>
      {children}
    </button>
  );
}
