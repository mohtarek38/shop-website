import { Button, type ButtonProps } from '@shop/ui';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

/** A button that asks for confirmation in a dialog before running `onConfirm`. */
export function ConfirmButton({
  message,
  confirmLabel,
  onConfirm,
  children,
  ...buttonProps
}: Omit<ButtonProps, 'onClick'> & {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button {...buttonProps} onClick={() => dialog.current?.showModal()}>
        {children}
      </Button>
      <dialog
        ref={dialog}
        className="m-auto w-full max-w-sm rounded-card bg-background p-5 text-text backdrop:bg-black/40"
      >
        <h2 className="mb-2 text-lg font-bold">{t('common.confirmTitle')}</h2>
        <p className="mb-5 text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <Button autoFocus onClick={() => dialog.current?.close()}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              dialog.current?.close();
              onConfirm();
            }}
          >
            {confirmLabel ?? t('common.delete')}
          </Button>
        </div>
      </dialog>
    </>
  );
}
