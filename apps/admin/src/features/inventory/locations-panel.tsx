import { type StockLocation, stockLocationInputSchema } from '@shop/contracts';
import { Alert, Badge, Button, Card, Checkbox, FormRow, Input } from '@shop/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/modal';
import { api } from '../../lib/api';
import { apiErrorMessage, apiFieldErrors, fieldErrors } from '../../lib/form-errors';
import { useCan } from '../../lib/permissions';
import { useLocalize } from '../../lib/use-localize';
import { inventoryKeys, locationsQuery } from './queries';

/** Stock locations: warehouses or stores that hold stock (ADR-0013). */
export function LocationsPanel() {
  const { t } = useTranslation();
  const localize = useLocalize();
  const canEdit = useCan('inventory.adjust');
  const { data: locations = [] } = useQuery(locationsQuery);
  // `undefined` = closed, `null` = new location.
  const [editing, setEditing] = useState<StockLocation | null | undefined>(undefined);

  return (
    <div className="space-y-3">
      {canEdit && (
        <Button variant="primary" onClick={() => setEditing(null)}>
          <Plus className="size-4" aria-hidden />
          {t('inventory.newLocation')}
        </Button>
      )}
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b border-border text-muted">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
              <th>{t('inventory.locationName')}</th>
              <th>{t('inventory.code')}</th>
              <th>{t('inventory.address')}</th>
              <th>{t('products.status')}</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr
                key={l.id}
                className="border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-3"
              >
                <td>
                  {canEdit ? (
                    <button
                      type="button"
                      className="font-medium text-primary-hover hover:underline"
                      onClick={() => setEditing(l)}
                    >
                      {localize(l.name)}
                    </button>
                  ) : (
                    localize(l.name)
                  )}
                </td>
                <td dir="ltr" className="text-start">
                  {l.code}
                </td>
                <td className="text-muted">{l.address ?? '—'}</td>
                <td>
                  <span className="flex flex-wrap gap-1">
                    {l.isDefault && <Badge tone="primary">{t('inventory.default')}</Badge>}
                    <Badge tone={l.isActive ? 'success' : 'neutral'}>
                      {l.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? localize(editing.name) : t('inventory.newLocation')}
      >
        <LocationForm location={editing ?? null} onDone={() => setEditing(undefined)} />
      </Modal>
    </div>
  );
}

function LocationForm({
  location,
  onDone,
}: {
  location: StockLocation | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [values, setValues] = useState({
    code: location?.code ?? '',
    nameAr: location?.name.ar ?? '',
    nameEn: location?.name.en ?? '',
    address: location?.address ?? '',
    isDefault: location?.isDefault ?? false,
    isActive: location?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof values, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit() {
    setErrors({});
    setFormError(null);
    const parsed = stockLocationInputSchema.safeParse({
      code: values.code,
      name: { ar: values.nameAr, en: values.nameEn },
      address: values.address,
      isDefault: values.isDefault,
      isActive: values.isActive,
      sortOrder: location?.sortOrder ?? 0,
    });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(fieldErrors(parsed.error.issues, t).map((e) => [e.path, e.message])),
      );
      return;
    }
    setPending(true);
    try {
      if (location) await api.admin.stockLocations.update(location.id, parsed.data);
      else await api.admin.stockLocations.create(parsed.data);
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      onDone();
    } catch (error) {
      const fields = apiFieldErrors(error, t);
      if (fields) setErrors(Object.fromEntries(fields.map((f) => [f.path, f.message])));
      else setFormError(apiErrorMessage(error, t));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {formError && <Alert tone="danger">{formError}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormRow
          label={`${t('inventory.locationName')} · ${t('common.arabic')}`}
          htmlFor="loc-name-ar"
          required
          error={errors['name.ar'] ?? errors.name}
        >
          <Input
            id="loc-name-ar"
            value={values.nameAr}
            onChange={(e) => set('nameAr', e.target.value)}
          />
        </FormRow>
        <FormRow
          label={`${t('inventory.locationName')} · ${t('common.english')}`}
          htmlFor="loc-name-en"
        >
          <Input
            id="loc-name-en"
            dir="ltr"
            value={values.nameEn}
            onChange={(e) => set('nameEn', e.target.value)}
          />
        </FormRow>
        <FormRow
          label={t('inventory.code')}
          htmlFor="loc-code"
          required
          hint={t('inventory.codeHint')}
          error={errors.code}
        >
          <Input
            id="loc-code"
            dir="ltr"
            value={values.code}
            onChange={(e) => set('code', e.target.value)}
          />
        </FormRow>
        <FormRow label={t('inventory.address')} htmlFor="loc-address">
          <Input
            id="loc-address"
            value={values.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </FormRow>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Checkbox
          id="loc-default"
          label={t('inventory.makeDefault')}
          checked={values.isDefault}
          onChange={(e) => set('isDefault', e.target.checked)}
        />
        <Checkbox
          id="loc-active"
          label={t('common.active')}
          checked={values.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
        />
      </div>
      {(errors.isDefault || errors.isActive) && (
        <Alert tone="danger">{errors.isDefault ?? errors.isActive}</Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" loading={pending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
