import { Alert, Badge, Button, cn } from '@shop/ui';
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { type DragEvent, useRef, useState } from 'react';
import { type Control, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { apiErrorMessage, apiFieldErrors } from '../../lib/form-errors';
import type { ProductFormValues } from './product-form';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 20;

/**
 * Product images: upload (pick or drop), reorder and remove. The first image is the main
 * one. Uploads happen immediately; the list is saved with the product.
 */
export function ImagesEditor({
  control,
  disabled,
}: {
  control: Control<ProductFormValues>;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'images',
    keyName: 'fieldKey',
  });
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    setErrors([]);
    const room = MAX_IMAGES - fields.length;
    const problems: string[] = [];
    if (files.length > room) problems.push(t('images.tooMany', { max: MAX_IMAGES }));

    for (const file of files.slice(0, Math.max(room, 0))) {
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name}: ${t('errors.image_too_large')}`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const asset = await api.admin.media.uploadImage(file, file.name);
        append({
          mediaId: asset.id,
          urls: { thumb: asset.urls.thumb, md: asset.urls.md },
          alt: { ar: '', en: '' },
        });
      } catch (error) {
        const field = apiFieldErrors(error, t)?.[0]?.message;
        problems.push(`${file.name}: ${field ?? apiErrorMessage(error, t)}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    setErrors(problems);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) void upload([...event.dataTransfer.files]);
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Alert tone="danger">
          <ul className="space-y-1">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {fields.map((field, index) => (
          <li key={field.fieldKey} className="overflow-hidden rounded-card border border-border">
            <div className="relative aspect-square bg-surface">
              <img src={field.urls.md} alt="" className="size-full object-contain" loading="lazy" />
              {index === 0 && (
                <Badge tone="primary" className="absolute start-2 top-2">
                  {t('images.main')}
                </Badge>
              )}
            </div>
            {!disabled && (
              <div className="flex justify-between gap-1 p-1">
                {/* "Earlier" points to the start side: right in Arabic, left in English. */}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('images.moveEarlier')}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('common.remove')}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('images.moveLater')}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowLeft className="size-4 ltr:rotate-180" aria-hidden />
                </Button>
              </div>
            )}
          </li>
        ))}

        {!disabled && fields.length < MAX_IMAGES && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-3 text-center text-sm text-muted hover:border-primary hover:text-primary',
                dragging ? 'border-primary bg-primary-soft text-primary' : 'border-border',
              )}
            >
              {uploading > 0 ? (
                <LoaderCircle className="size-6 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-6" aria-hidden />
              )}
              {uploading > 0 ? t('images.uploading', { count: uploading }) : t('images.add')}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          void upload([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
      <p className="text-xs text-muted">{t('images.hint')}</p>
    </div>
  );
}
