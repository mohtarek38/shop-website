import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-control border border-border bg-background px-3 text-sm text-text placeholder:text-muted/70',
        'focus:border-primary focus:ring-3 focus:ring-primary-soft focus:outline-none',
        'aria-invalid:border-danger aria-invalid:focus:ring-danger-soft',
        'disabled:bg-surface disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
