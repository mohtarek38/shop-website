import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * A modal dialog (native <dialog>: focus trap, Escape to close). Renders its children
 * only while open, so forms inside start fresh each time.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // showModal() runs after React's autoFocus and would move focus to the close
      // button, so a field that should start focused is marked with data-autofocus.
      element.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className={`m-auto w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-card bg-background p-5 text-text backdrop:bg-black/40`}
    >
      {open && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              className="ms-auto p-1 text-muted hover:text-text"
              aria-label={t('common.close')}
              onClick={onClose}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}
