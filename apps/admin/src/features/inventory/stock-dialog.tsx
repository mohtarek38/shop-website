import {
  type InventoryRow,
  STOCK_ADJUSTMENT_TYPES,
  type StockAdjustmentType,
  type StockLocation,
} from '@shop/contracts';
import { Alert, Button, FormRow, Input, Select } from '@shop/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { apiErrorMessage, apiFieldErrors } from '../../lib/form-errors';
import { useCan } from '../../lib/permissions';
import { useLocalize } from '../../lib/use-localize';
import { catalogKeys } from '../catalog/queries';
import { inventoryKeys } from './queries';

type Mode = StockAdjustmentType | 'transfer' | 'threshold';

/** Receive, count, write off or transfer stock of one variant, or set its low-stock alert. */
export function StockDialog({
  row,
  locations,
  onDone,
}: {
  row: InventoryRow;
  locations: StockLocation[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const canTransfer = useCan('inventory.transfer') && locations.length > 1;
  const active = locations.filter((l) => l.isActive);

  const [mode, setMode] = useState<Mode>('receive');
  const [locationId, setLocationId] = useState(
    active.find((l) => l.isDefault)?.id ?? active[0]?.id ?? '',
  );
  const [toLocationId, setToLocationId] = useState(
    active.find((l) => l.id !== locationId)?.id ?? '',
  );
  const level = row.levels.find((l) => l.locationId === locationId);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [threshold, setThreshold] = useState(
    level?.lowStockThreshold === null || level?.lowStockThreshold === undefined
      ? ''
      : String(level.lowStockThreshold),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const modes: Mode[] = [
    ...STOCK_ADJUSTMENT_TYPES,
    ...(canTransfer ? ['transfer' as const] : []),
    'threshold',
  ];

  async function submit() {
    setErrors({});
    setFormError(null);
    const amount = quantity.trim() === '' ? Number.NaN : Number(quantity);
    if (mode !== 'threshold' && !Number.isInteger(amount)) {
      setErrors({ quantity: t('errors.quantity_required') });
      return;
    }
    setPending(true);
    try {
      if (mode === 'transfer') {
        await api.admin.inventory.transfer({
          variantId: row.variantId,
          fromLocationId: locationId,
          toLocationId,
          quantity: amount,
          reason,
        });
      } else if (mode === 'threshold') {
        await api.admin.inventory.setThreshold({
          variantId: row.variantId,
          locationId,
          lowStockThreshold: threshold.trim() === '' ? null : Number(threshold),
        });
      } else {
        await api.admin.inventory.adjust({
          variantId: row.variantId,
          locationId,
          type: mode,
          quantity: amount,
          reason,
        });
      }
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: catalogKeys.products });
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
      <p className="text-sm text-muted">
        {localize(row.product.name)} · <span dir="ltr">{row.sku}</span>
      </p>
      {formError && <Alert tone="danger">{formError}</Alert>}

      <div role="radiogroup" aria-label={t('inventory.action')} className="flex flex-wrap gap-2">
        {modes.map((value) => (
          <Button
            key={value}
            size="sm"
            role="radio"
            aria-checked={mode === value}
            variant={mode === value ? 'primary' : 'ghost'}
            onClick={() => setMode(value)}
          >
            {t(`inventory.modes.${value}`)}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted">{t(`inventory.modeHints.${mode}`)}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormRow
          label={mode === 'transfer' ? t('inventory.from') : t('inventory.location')}
          htmlFor="stock-location"
          error={errors.locationId ?? errors.fromLocationId}
        >
          <Select
            id="stock-location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {active.map((l) => (
              <option key={l.id} value={l.id}>
                {localize(l.name)}
              </option>
            ))}
          </Select>
        </FormRow>
        {mode === 'transfer' ? (
          <FormRow label={t('inventory.to')} htmlFor="stock-to" error={errors.toLocationId}>
            <Select
              id="stock-to"
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
            >
              {active
                .filter((l) => l.id !== locationId)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {localize(l.name)}
                  </option>
                ))}
            </Select>
          </FormRow>
        ) : (
          <div className="text-sm text-muted sm:pt-6">
            {t('inventory.currentAt', {
              onHand: level?.onHand ?? 0,
              available: level?.available ?? 0,
            })}
          </div>
        )}
      </div>

      {mode === 'threshold' ? (
        <FormRow
          label={t('inventory.threshold')}
          htmlFor="stock-threshold"
          hint={t('inventory.thresholdHint')}
          error={errors.lowStockThreshold}
        >
          <Input
            id="stock-threshold"
            dir="ltr"
            inputMode="numeric"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </FormRow>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormRow
            label={mode === 'adjust' ? t('inventory.countedQuantity') : t('inventory.quantity')}
            htmlFor="stock-quantity"
            required
            error={errors.quantity}
          >
            <Input
              id="stock-quantity"
              dir="ltr"
              inputMode="numeric"
              data-autofocus
              aria-invalid={errors.quantity ? true : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormRow>
          <FormRow
            label={t('inventory.reason')}
            htmlFor="stock-reason"
            required={mode === 'adjust' || mode === 'write_off'}
            error={errors.reason}
          >
            <Input
              id="stock-reason"
              aria-invalid={errors.reason ? true : undefined}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormRow>
        </div>
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
