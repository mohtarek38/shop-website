import { LoaderCircle } from 'lucide-react';

export function PendingPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden />
    </div>
  );
}
