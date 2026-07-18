import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  placeholder?: string;
  error?: string;
  registration: UseFormRegisterReturn;
};

export function PasswordField({ id, label, autoComplete, placeholder = 'Enter password', error, registration }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="skx-field-label">
        {label}
      </label>
      <div className="mt-1.5 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <KeyRound className="w-4 h-4" />
        </div>
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`skx-field pl-10 pr-12 ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
        <button
          type="button"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 transition hover:text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#141414] focus:ring-offset-2"
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
