import { ReactNode } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';

const variants: Record<Variant, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-accent-100 text-accent-700',
  warning: 'bg-secondary-100 text-secondary-700',
  error: 'bg-error-50 text-error-700',
  info: 'bg-primary-100 text-primary-700',
  secondary: 'bg-neutral-800 text-white',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
