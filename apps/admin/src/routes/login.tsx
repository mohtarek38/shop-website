import { Alert, Button, Card, Field, Logo } from '@shop/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { currentLocale, i18n } from '../i18n';
import { api, ApiError, meQuery } from '../lib/api';
import { loginRoute } from '../router';

export function LoginPage() {
  const { t } = useTranslation();
  const { redirect } = loginRoute.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const locale = currentLocale();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);
    try {
      await api.auth.signInWithEmail(String(form.get('email')), String(form.get('password')));
      queryClient.removeQueries({ queryKey: meQuery.queryKey });
      // Only redirect within the dashboard.
      const target = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
      await navigate({ to: target });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setError(
        status === 401
          ? t('login.invalid')
          : status === 429
            ? t('login.tooMany')
            : t('login.failed'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <Logo locale={locale} />
      <Card className="w-full max-w-sm space-y-4 p-6">
        <h1 className="text-lg font-bold">{t('login.title')}</h1>
        {error && <Alert tone="danger">{error}</Alert>}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            label={t('login.email')}
            name="email"
            type="email"
            autoComplete="username"
            dir="ltr"
            required
          />
          <Field
            label={t('login.password')}
            name="password"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
          />
          <Button type="submit" variant="primary" className="w-full" loading={pending}>
            {t('login.submit')}
          </Button>
        </form>
      </Card>
      <Button
        variant="ghost"
        size="sm"
        lang={locale === 'ar' ? 'en' : 'ar'}
        onClick={() => void i18n.changeLanguage(locale === 'ar' ? 'en' : 'ar')}
      >
        {t('app.switchLanguage')}
      </Button>
    </div>
  );
}
