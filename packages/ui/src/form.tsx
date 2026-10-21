import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';

const control =
  'w-full rounded-control border border-border bg-background px-3 text-sm text-text ' +
  'focus:border-primary focus:ring-3 focus:ring-primary-soft focus:outline-none ' +
  'aria-invalid:border-danger aria-invalid:focus:ring-danger-soft disabled:bg-surface disabled:opacity-70';

export interface FormRowProps {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error. Pair the control's `aria-describedby` with `${htmlFor}-msg`. */
export function FormRow({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormRowProps) {
  const message = error ?? hint;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-sm text-muted">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {message && (
        <p
          id={htmlFor ? `${htmlFor}-msg` : undefined}
          className={cn('text-xs', error ? 'text-danger' : 'text-muted')}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, 'h-10', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(control, 'min-h-24 py-2 leading-relaxed', className)} {...props} />
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={cn('inline-flex items-center gap-2 text-sm', className)}>
      <input id={id} type="checkbox" className="size-4 accent-primary" {...props} />
      {label}
    </label>
  );
}
