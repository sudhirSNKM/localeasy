import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  hint?: string;
}

export default function Input({ label, error, icon, hint, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">{icon}</div>
        )}
        <input
          className={`
            w-full rounded-lg border bg-white text-neutral-900 text-sm
            placeholder:text-neutral-400 transition-colors
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-neutral-50 disabled:text-neutral-400
            ${error ? 'border-error-500' : 'border-neutral-300'}
            ${icon ? 'pl-10' : 'pl-3.5'}
            py-2.5 pr-3.5
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
