import { Link, type LinkProps } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function PageHeader({
  title,
  backTo,
  meta,
  actions,
}: {
  title: ReactNode;
  backTo?: LinkProps['to'];
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {backTo && (
        <Link
          to={backTo}
          aria-label={t('common.back')}
          className="grid size-9 place-items-center rounded-control border border-border bg-background hover:bg-surface"
        >
          {/* Arrow points "back" in both directions: right in Arabic, left in English. */}
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
        </Link>
      )}
      <h1 className="text-xl font-bold">{title}</h1>
      {meta}
      <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

/** A titled card section in an editor form. */
export function Section({
  title,
  hint,
  children,
}: {
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-card border border-border bg-background p-4">
      <div>
        <h2 className="font-bold">{title}</h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
